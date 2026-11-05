import mongoose from "mongoose";
import { AppError } from "../../../common/errors";
import { ErrorCode } from "../../../enum/enum";
import { UserRepository } from "../../../repositories/user.repository";
import { GroupRepository } from "../../../repositories/group.repository";
import type { CreateGroupPayload } from "./interfaces/group.interface";

export class GroupService {
    private readonly groupRepository = new GroupRepository();
    private readonly userRepository = new UserRepository();

    public async createGroup(
        userId: string,
        payload: CreateGroupPayload
    ) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new AppError("Invalid user ID", 400, ErrorCode.VALIDATION_ERROR);
        }

        const creator = await this.userRepository.findById(userId);

        if (!creator || !creator.isActive) {
            throw new AppError("User not found or inactive", 404, ErrorCode.NOT_FOUND);
        }

        const memberIds = [
            ...new Set([userId, ...(payload.members ?? [])]),
        ];

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

        return {
            id: String(
                (group as typeof group & { _id?: unknown })._id ?? ""
            ),
            name: group.name,
            description: group.description,
            createdBy: userId,
            members: memberIds,
            createdAt: group.createdAt,
            updatedAt: group.updatedAt,
        };
    }


    public async getMyGroups(
        userId: string,
        page = 1,
        limit = 20
    ) {
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new AppError("Invalid user ID", 400, ErrorCode.VALIDATION_ERROR);
        }

        page = Math.max(1, Math.floor(page));
        limit = Math.min(100, Math.max(1, Math.floor(limit)));

        const user = await this.userRepository.findById(userId);

        if (!user || !user.isActive) {
            throw new AppError("User not found or inactive", 404, ErrorCode.NOT_FOUND);
        }

        const { items, total } = await this.groupRepository.findByMember(
            userId,
            page,
            limit
        );

        return {
            items,
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
        };
    }

    public async getGroupDetails(
        groupId: string,
        userId: string
    ) {
        if (!mongoose.Types.ObjectId.isValid(groupId)) {
            throw new AppError("Invalid group ID", 400, ErrorCode.BAD_REQUEST);
        }

        const group = await this.groupRepository.findByIdWithMembers(groupId);

        if (!group) {
            throw new AppError("Group not found", 404, ErrorCode.NOT_FOUND);
        }

        const isMember = group.members.some(
            (member: any) => String(member.userId?._id) === userId
        );

        if (!isMember) {
            throw new AppError(
                "You are not a member of this group",
                403,
                ErrorCode.FORBIDDEN
            );
        }

        return {
            id: String(group._id),
            name: group.name,
            description: group.description,
            createdBy: String(group.createdBy),
            members: group.members
                .filter((member: any) => member.userId && member.userId.isActive)
                .map((member: any) => ({
                    userId: String(member.userId._id),
                    name: member.userId.name,
                    email: member.userId.email,
                })),
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
            ErrorCode.CONFLICT
          );
        }
      
        const newMember = await this.userRepository.findById(newMemberId);
      
        if (!newMember || !newMember.isActive) {
          throw new AppError("User not found or inactive", 404, ErrorCode.NOT_FOUND);
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
      
        return {
          groupId,
          userId: newMemberId,
          message: "Member added successfully",
        };
      }
}