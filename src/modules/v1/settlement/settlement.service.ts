import mongoose from "mongoose";
import { AppError } from "../../../common/errors";
import { ActivityType, ErrorCode } from "../../../enum/enum";
import { CommonUtils } from "../../../common/utils";
import { SettlementRepository } from "../../../repositories/settlement.repository";
import { GroupRepository } from "../../../repositories/group.repository";
import { UserRepository } from "../../../repositories/user.repository";
import { RedisCacheManager } from "../../../providers/redis/redis-cache.manager";
import { ActivityService } from "../activity/activity.service";

export class SettlementService {
  private readonly settlementRepository = new SettlementRepository();
  private readonly groupRepository = new GroupRepository();
  private readonly userRepository = new UserRepository();
  private readonly redisCache = new RedisCacheManager();
  private readonly activityService = new ActivityService();

  public async createSettlement(
    groupId: string,
    requesterId: string,
    payload: {
      fromUserId: string;
      toUserId: string;
      amount: number;
      note?: string;
    }
  ) {
    const group = await this.requireGroupMembership(groupId, requesterId);
    const memberIds = new Set(group.members.map((m) => String(m.userId)));

    if (!memberIds.has(payload.fromUserId) || !memberIds.has(payload.toUserId)) {
      throw new AppError(
        "Payer and receiver must be group members",
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    for (const userId of [payload.fromUserId, payload.toUserId]) {
      const user = await this.userRepository.findById(userId);
      if (!user || !user.isActive) {
        throw new AppError(
          `User not found or inactive: ${userId}`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }
    }

    const amountPaise = CommonUtils.rupeesToPaise(payload.amount);

    if (amountPaise <= 0) {
      throw new AppError(
        "Settlement amount must be greater than zero",
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const settlement = await this.settlementRepository.create({
      groupId: new mongoose.Types.ObjectId(groupId),
      fromUserId: new mongoose.Types.ObjectId(payload.fromUserId),
      toUserId: new mongoose.Types.ObjectId(payload.toUserId),
      amountPaise,
      note: payload.note?.trim(),
      createdBy: new mongoose.Types.ObjectId(requesterId),
    });

    const settlementId = String(
      (settlement as typeof settlement & { _id?: unknown })._id ?? ""
    );

    await this.redisCache.invalidateGroupBalances(groupId);
    await this.activityService.record({
      groupId,
      actorId: requesterId,
      type: ActivityType.SETTLEMENT_CREATED,
      message: "Settlement recorded",
      metadata: {
        settlementId,
        fromUserId: payload.fromUserId,
        toUserId: payload.toUserId,
        amountPaise,
      },
    });

    return this.toResponse(settlement);
  }

  public async getSettlementDetails(
    settlementId: string,
    requesterId: string
  ) {
    const settlement = await this.settlementRepository.findById(settlementId);

    if (!settlement) {
      throw new AppError("Settlement not found", 404, ErrorCode.NOT_FOUND);
    }

    await this.requireGroupMembership(
      String(settlement.groupId),
      requesterId
    );

    return this.toResponse(settlement);
  }

  public async listSettlements(
    groupId: string,
    requesterId: string,
    page = 1,
    limit = 20
  ) {
    await this.requireGroupMembership(groupId, requesterId);

    const pagination = CommonUtils.getPagination({ page, limit });
    const { items, total } = await this.settlementRepository.findByGroup(
      groupId,
      pagination.page,
      pagination.limit
    );

    return {
      items: items.map((item) => this.toResponse(item)),
      ...CommonUtils.getPaginationMetadata(
        pagination.page,
        pagination.limit,
        total
      ),
    };
  }

  private async requireGroupMembership(groupId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new AppError("Invalid group ID", 400, ErrorCode.BAD_REQUEST);
    }

    const group = await this.groupRepository.findActiveById(groupId);

    if (!group) {
      throw new AppError("Group not found", 404, ErrorCode.NOT_FOUND);
    }

    const isMember = group.members.some(
      (member) => String(member.userId) === userId
    );

    if (!isMember) {
      throw new AppError(
        "You are not a member of this group",
        403,
        ErrorCode.NOT_GROUP_MEMBER
      );
    }

    return group;
  }

  private toResponse(settlement: {
    _id?: unknown;
    groupId: mongoose.Types.ObjectId;
    fromUserId: mongoose.Types.ObjectId;
    toUserId: mongoose.Types.ObjectId;
    amountPaise: number;
    note?: string;
    createdBy: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: String(settlement._id ?? ""),
      groupId: String(settlement.groupId),
      fromUserId: String(settlement.fromUserId),
      toUserId: String(settlement.toUserId),
      amountPaise: settlement.amountPaise,
      amount: CommonUtils.paiseToRupees(settlement.amountPaise),
      note: settlement.note,
      createdBy: String(settlement.createdBy),
      createdAt: settlement.createdAt,
      updatedAt: settlement.updatedAt,
    };
  }
}
