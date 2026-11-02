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
}