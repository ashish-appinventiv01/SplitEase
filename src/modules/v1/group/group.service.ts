import mongoose from "mongoose";
import { AppError } from "../../../common/errors";
import { ActivityType, ErrorCode } from "../../../enum/enum";
import { UserRepository } from "../../../repositories/user.repository";
import { GroupRepository } from "../../../repositories/group.repository";
import { ActivityService } from "../activity/activity.service";
import { CommonUtils } from "../../../common/utils";
import type {
  CreateGroupPayload,
  UpdateGroupPayload,
} from "./interfaces/group.interface";

export class GroupService {
  private readonly groupRepository = new GroupRepository();
  private readonly userRepository = new UserRepository();
  private readonly activityService = new ActivityService();

  public async createGroup(userId: string, payload: CreateGroupPayload) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", 400, ErrorCode.VALIDATION_ERROR);
    }

    const creator = await this.userRepository.findById(userId);

    if (!creator || !creator.isActive) {
      throw new AppError("User not found or inactive", 404, ErrorCode.NOT_FOUND);
    }

    const memberIds = [...new Set([userId, ...(payload.members ?? [])])];

    for (const memberId of memberIds) {
      if (!mongoose.Types.ObjectId.isValid(memberId)) {
        throw new AppError(
          `Invalid member ID: ${memberId}`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const member = await this.userRepository.findById(memberId);

      if (!member || !member.isActive) {
        throw new AppError(
          `Member not found or inactive: ${memberId}`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }
    }

    const group = await this.groupRepository.create({
      name: payload.name.trim(),
      description: payload.description?.trim(),
      createdBy: new mongoose.Types.ObjectId(userId),
      members: memberIds.map((memberId) => ({
        userId: new mongoose.Types.ObjectId(memberId),
        joinedAt: new Date(),
      })),
      isActive: true,
    });

    const groupId = String(
      (group as typeof group & { _id?: unknown })._id ?? ""
    );

    await this.activityService.record({
      groupId,
      actorId: userId,
      type: ActivityType.GROUP_CREATED,
      message: `Group "${group.name}" created`,
      metadata: { name: group.name, memberCount: memberIds.length },
    });

    return {
      id: groupId,
      name: group.name,
      description: group.description,
      createdBy: userId,
      members: memberIds,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  public async getMyGroups(userId: string, page = 1, limit = 20) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid user ID", 400, ErrorCode.VALIDATION_ERROR);
    }

    const pagination = CommonUtils.getPagination({ page, limit });
    const user = await this.userRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new AppError("User not found or inactive", 404, ErrorCode.NOT_FOUND);
    }

    const { items, total } = await this.groupRepository.findByMember(
      userId,
      pagination.page,
      pagination.limit
    );

    return {
      items: items.map((group) => ({
        id: String((group as typeof group & { _id?: unknown })._id ?? ""),
        name: group.name,
        description: group.description,
        createdBy: String(group.createdBy),
        memberCount: group.members.length,
        createdAt: group.createdAt,
        updatedAt: group.updatedAt,
      })),
      ...CommonUtils.getPaginationMetadata(
        pagination.page,
        pagination.limit,
        total
      ),
    };
  }

  public async getGroupDetails(groupId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new AppError("Invalid group ID", 400, ErrorCode.BAD_REQUEST);
    }

    const group = await this.groupRepository.findByIdWithMembers(groupId);

    if (!group) {
      throw new AppError("Group not found", 404, ErrorCode.NOT_FOUND);
    }

    const isMember = group.members.some(
      (member) =>
        String(
          (member.userId as unknown as { _id?: unknown })?._id ?? member.userId
        ) === userId
    );

    if (!isMember) {
      throw new AppError(
        "You are not a member of this group",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    return {
      id: String((group as typeof group & { _id?: unknown })._id ?? ""),
      name: group.name,
      description: group.description,
      createdBy: String(group.createdBy),
      members: group.members
        .filter((member) => {
          const user = member.userId as unknown as {
            isActive?: boolean;
          } | null;
          return user && user.isActive !== false;
        })
        .map((member) => {
          const user = member.userId as unknown as {
            _id?: unknown;
            name?: string;
            email?: string;
          };
          return {
            userId: String(user._id ?? member.userId),
            name: user.name ?? "",
            email: user.email ?? "",
            joinedAt: member.joinedAt,
          };
        }),
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  public async addMember(
    groupId: string,
    requesterId: string,
    newMemberId: string
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(newMemberId)
    ) {
      throw new AppError("Invalid ID provided", 400, ErrorCode.BAD_REQUEST);
    }

    const group = await this.groupRepository.findById(groupId);

    if (!group || !group.isActive) {
      throw new AppError("Group not found", 404, ErrorCode.NOT_FOUND);
    }

    const isRequesterMember = group.members.some(
      (member) => String(member.userId) === requesterId
    );

    if (!isRequesterMember) {
      throw new AppError(
        "You are not a member of this group",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    const alreadyMember = group.members.some(
      (member) => String(member.userId) === newMemberId
    );

    if (alreadyMember) {
      throw new AppError(
        "User is already a group member",
        409,
        ErrorCode.ALREADY_MEMBER
      );
    }

    const newMember = await this.userRepository.findById(newMemberId);

    if (!newMember || !newMember.isActive) {
      throw new AppError(
        "User not found or inactive",
        404,
        ErrorCode.NOT_FOUND
      );
    }

    const updatedGroup = await this.groupRepository.addMember(
      groupId,
      newMemberId
    );

    if (!updatedGroup) {
      throw new AppError(
        "Unable to add member. Please try again.",
        409,
        ErrorCode.CONFLICT
      );
    }

    await this.activityService.record({
      groupId,
      actorId: requesterId,
      type: ActivityType.MEMBER_ADDED,
      message: `Member added to group`,
      metadata: { userId: newMemberId },
    });

    return {
      groupId,
      userId: newMemberId,
      message: "Member added successfully",
    };
  }

  public async removeMember(
    groupId: string,
    requesterId: string,
    memberId: string
  ) {
    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(memberId)
    ) {
      throw new AppError("Invalid ID provided", 400, ErrorCode.BAD_REQUEST);
    }

    const group = await this.groupRepository.findById(groupId);

    if (!group || !group.isActive) {
      throw new AppError("Group not found", 404, ErrorCode.NOT_FOUND);
    }

    const isRequesterMember = group.members.some(
      (member) => String(member.userId) === requesterId
    );

    if (!isRequesterMember) {
      throw new AppError(
        "You are not a member of this group",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    if (String(group.createdBy) === memberId) {
      throw new AppError(
        "Group creator cannot be removed",
        400,
        ErrorCode.BAD_REQUEST
      );
    }

    const isTargetMember = group.members.some(
      (member) => String(member.userId) === memberId
    );

    if (!isTargetMember) {
      throw new AppError(
        "User is not a member of this group",
        404,
        ErrorCode.NOT_FOUND
      );
    }

    const updatedGroup = await this.groupRepository.removeMember(
      groupId,
      memberId
    );

    if (!updatedGroup) {
      throw new AppError(
        "Unable to remove member. Please try again.",
        409,
        ErrorCode.CONFLICT
      );
    }

    await this.activityService.record({
      groupId,
      actorId: requesterId,
      type: ActivityType.MEMBER_REMOVED,
      message: `Member removed from group`,
      metadata: { userId: memberId },
    });

    return {
      groupId,
      userId: memberId,
      message: "Member removed successfully",
    };
  }

  public async updateGroup(
    groupId: string,
    requesterId: string,
    payload: UpdateGroupPayload
  ) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new AppError("Invalid group ID", 400, ErrorCode.BAD_REQUEST);
    }

    const group = await this.groupRepository.findActiveById(groupId);

    if (!group) {
      throw new AppError("Group not found", 404, ErrorCode.NOT_FOUND);
    }

    const isMember = group.members.some(
      (member) => String(member.userId) === requesterId
    );

    if (!isMember) {
      throw new AppError(
        "You are not a member of this group",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    const updateData: Partial<Pick<typeof group, "name" | "description">> = {};

    if (payload.name !== undefined) {
      updateData.name = payload.name.trim();
    }

    if (payload.description !== undefined) {
      updateData.description = payload.description.trim();
    }

    const updated = await this.groupRepository.updateById(groupId, updateData);

    if (!updated) {
      throw new AppError("Group not found", 404, ErrorCode.NOT_FOUND);
    }

    await this.activityService.record({
      groupId,
      actorId: requesterId,
      type: ActivityType.GROUP_UPDATED,
      message: `Group details updated`,
      metadata: updateData,
    });

    return {
      id: groupId,
      name: updated.name,
      description: updated.description,
      createdBy: String(updated.createdBy),
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  public async deleteGroup(groupId: string, requesterId: string) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new AppError("Invalid group ID", 400, ErrorCode.BAD_REQUEST);
    }

    const group = await this.groupRepository.findActiveById(groupId);

    if (!group) {
      throw new AppError("Group not found", 404, ErrorCode.NOT_FOUND);
    }

    if (String(group.createdBy) !== requesterId) {
      throw new AppError(
        "Only the group creator can delete the group",
        403,
        ErrorCode.FORBIDDEN
      );
    }

    const deleted = await this.groupRepository.softDelete(groupId);

    if (!deleted) {
      throw new AppError("Group not found", 404, ErrorCode.NOT_FOUND);
    }

    await this.activityService.record({
      groupId,
      actorId: requesterId,
      type: ActivityType.GROUP_DELETED,
      message: `Group deactivated`,
      metadata: { name: deleted.name },
    });

    return {
      groupId,
      message: "Group deactivated successfully",
    };
  }
}
