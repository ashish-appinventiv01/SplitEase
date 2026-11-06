import mongoose from "mongoose";
import { AppError } from "../../../common/errors";
import { ActivityType, ErrorCode, SplitType } from "../../../enum/enum";
import { CommonUtils } from "../../../common/utils";
import { ExpenseRepository } from "../../../repositories/expense.repository";
import { GroupRepository } from "../../../repositories/group.repository";
import { UserRepository } from "../../../repositories/user.repository";
import { RedisCacheManager } from "../../../providers/redis/redis-cache.manager";
import { ActivityService } from "../activity/activity.service";
import type {
  CreateExpensePayload,
  ExpenseParticipantInput,
  UpdateExpensePayload,
} from "./interfaces/expense.interface";
import type { IExpenseSplit } from "../../../schemas/expense.schema";

export class ExpenseService {
  private readonly expenseRepository = new ExpenseRepository();
  private readonly groupRepository = new GroupRepository();
  private readonly userRepository = new UserRepository();
  private readonly redisCache = new RedisCacheManager();
  private readonly activityService = new ActivityService();

  public async createExpense(
    groupId: string,
    requesterId: string,
    payload: CreateExpensePayload
  ) {
    const group = await this.requireGroupMembership(groupId, requesterId);
    const memberIds = new Set(group.members.map((m) => String(m.userId)));

    await this.validatePaidBy(payload.paidBy, memberIds);

    const amountPaise = CommonUtils.rupeesToPaise(payload.amount);
    const splits = await this.buildSplits(
      payload.splitType,
      amountPaise,
      payload.participants,
      memberIds
    );

    const expense = await this.expenseRepository.create({
      groupId: new mongoose.Types.ObjectId(groupId),
      createdBy: new mongoose.Types.ObjectId(requesterId),
      paidBy: new mongoose.Types.ObjectId(payload.paidBy),
      description: payload.description.trim(),
      amountPaise,
      splitType: payload.splitType,
      splits,
      isDeleted: false,
    });

    const expenseId = String(
      (expense as typeof expense & { _id?: unknown })._id ?? ""
    );

    await this.redisCache.invalidateGroupBalances(groupId);
    await this.activityService.record({
      groupId,
      actorId: requesterId,
      type: ActivityType.EXPENSE_CREATED,
      message: `Expense "${expense.description}" created`,
      metadata: {
        expenseId,
        amountPaise,
        splitType: payload.splitType,
      },
    });

    return this.toResponse(expense);
  }

  public async getExpenseDetails(expenseId: string, requesterId: string) {
    const expense = await this.expenseRepository.findById(expenseId);

    if (!expense) {
      throw new AppError("Expense not found", 404, ErrorCode.NOT_FOUND);
    }

    await this.requireGroupMembership(String(expense.groupId), requesterId);
    return this.toResponse(expense);
  }

  public async listGroupExpenses(
    groupId: string,
    requesterId: string,
    page = 1,
    limit = 20
  ) {
    await this.requireGroupMembership(groupId, requesterId);

    const pagination = CommonUtils.getPagination({ page, limit });
    const { items, total } = await this.expenseRepository.findByGroup(
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

  public async updateExpense(
    expenseId: string,
    requesterId: string,
    payload: UpdateExpensePayload
  ) {
    const existing = await this.expenseRepository.findById(expenseId);

    if (!existing) {
      throw new AppError("Expense not found", 404, ErrorCode.NOT_FOUND);
    }

    const groupId = String(existing.groupId);
    const group = await this.requireGroupMembership(groupId, requesterId);
    const memberIds = new Set(group.members.map((m) => String(m.userId)));

    const paidBy = payload.paidBy ?? String(existing.paidBy);
    await this.validatePaidBy(paidBy, memberIds);

    const amountPaise =
      payload.amount !== undefined
        ? CommonUtils.rupeesToPaise(payload.amount)
        : existing.amountPaise;

    const splitType = payload.splitType ?? existing.splitType;

    const participants: ExpenseParticipantInput[] =
      payload.participants ??
      existing.splits.map((split) => ({
        userId: String(split.userId),
        amount:
          splitType === SplitType.EXACT
            ? CommonUtils.paiseToRupees(split.amountPaise)
            : undefined,
        percent: split.percent,
      }));

    const splits = await this.buildSplits(
      splitType,
      amountPaise,
      participants,
      memberIds
    );

    const updated = await this.expenseRepository.updateById(expenseId, {
      description: payload.description?.trim() ?? existing.description,
      paidBy: new mongoose.Types.ObjectId(paidBy),
      amountPaise,
      splitType,
      splits,
    });

    if (!updated) {
      throw new AppError("Expense not found", 404, ErrorCode.NOT_FOUND);
    }

    await this.redisCache.invalidateGroupBalances(groupId);
    await this.activityService.record({
      groupId,
      actorId: requesterId,
      type: ActivityType.EXPENSE_UPDATED,
      message: `Expense "${updated.description}" updated`,
      metadata: { expenseId, amountPaise },
    });

    return this.toResponse(updated);
  }

  public async deleteExpense(expenseId: string, requesterId: string) {
    const existing = await this.expenseRepository.findById(expenseId);

    if (!existing) {
      throw new AppError("Expense not found", 404, ErrorCode.NOT_FOUND);
    }

    const groupId = String(existing.groupId);
    await this.requireGroupMembership(groupId, requesterId);

    const deleted = await this.expenseRepository.softDelete(expenseId);

    if (!deleted) {
      throw new AppError("Expense not found", 404, ErrorCode.NOT_FOUND);
    }

    await this.redisCache.invalidateGroupBalances(groupId);
    await this.activityService.record({
      groupId,
      actorId: requesterId,
      type: ActivityType.EXPENSE_DELETED,
      message: `Expense "${deleted.description}" deleted`,
      metadata: { expenseId },
    });

    return {
      expenseId,
      message: "Expense deleted successfully",
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

  private async validatePaidBy(
    paidBy: string,
    memberIds: Set<string>
  ): Promise<void> {
    if (!memberIds.has(paidBy)) {
      throw new AppError(
        "paidBy must be an active group member",
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }

    const payer = await this.userRepository.findById(paidBy);
    if (!payer || !payer.isActive) {
      throw new AppError(
        "paidBy user not found or inactive",
        400,
        ErrorCode.VALIDATION_ERROR
      );
    }
  }

  private async buildSplits(
    splitType: SplitType,
    amountPaise: number,
    participants: ExpenseParticipantInput[],
    memberIds: Set<string>
  ): Promise<IExpenseSplit[]> {
    for (const participant of participants) {
      if (!memberIds.has(participant.userId)) {
        throw new AppError(
          `Participant is not a group member: ${participant.userId}`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }

      const user = await this.userRepository.findById(participant.userId);
      if (!user || !user.isActive) {
        throw new AppError(
          `Participant not found or inactive: ${participant.userId}`,
          400,
          ErrorCode.VALIDATION_ERROR
        );
      }
    }

    if (splitType === SplitType.EQUAL) {
      const shares = CommonUtils.splitEqually(
        amountPaise,
        participants.length
      );

      return participants.map((participant, index) => ({
        userId: new mongoose.Types.ObjectId(participant.userId),
        amountPaise: shares[index]!,
      }));
    }

    if (splitType === SplitType.EXACT) {
      const splits = participants.map((participant) => {
        const sharePaise = CommonUtils.rupeesToPaise(participant.amount ?? 0);
        return {
          userId: new mongoose.Types.ObjectId(participant.userId),
          amountPaise: sharePaise,
        };
      });

      const total = splits.reduce((sum, split) => sum + split.amountPaise, 0);
      if (total !== amountPaise) {
        throw new AppError(
          "Exact split amounts must equal the total expense",
          400,
          ErrorCode.SPLIT_TOTAL_MISMATCH
        );
      }

      return splits;
    }

    const percentTotal = participants.reduce(
      (sum, participant) => sum + (participant.percent ?? 0),
      0
    );

    if (Math.round(percentTotal * 100) !== 10000) {
      throw new AppError(
        "Percent split values must add up to 100",
        400,
        ErrorCode.SPLIT_TOTAL_MISMATCH
      );
    }

    const rawShares = participants.map((participant) => {
      const percent = participant.percent ?? 0;
      return {
        userId: participant.userId,
        percent,
        amountPaise: Math.floor((amountPaise * percent) / 100),
      };
    });

    let allocated = rawShares.reduce(
      (sum, share) => sum + share.amountPaise,
      0
    );
    let remainder = amountPaise - allocated;

    for (let index = 0; index < rawShares.length && remainder > 0; index += 1) {
      rawShares[index]!.amountPaise += 1;
      remainder -= 1;
    }

    allocated = rawShares.reduce((sum, share) => sum + share.amountPaise, 0);
    if (allocated !== amountPaise) {
      throw new AppError(
        "Percent split amounts must equal the total expense",
        400,
        ErrorCode.SPLIT_TOTAL_MISMATCH
      );
    }

    return rawShares.map((share) => ({
      userId: new mongoose.Types.ObjectId(share.userId),
      amountPaise: share.amountPaise,
      percent: share.percent,
    }));
  }

  private toResponse(expense: {
    _id?: unknown;
    groupId: mongoose.Types.ObjectId;
    createdBy: mongoose.Types.ObjectId;
    paidBy: mongoose.Types.ObjectId;
    description: string;
    amountPaise: number;
    splitType: SplitType;
    splits: IExpenseSplit[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: String(expense._id ?? ""),
      groupId: String(expense.groupId),
      createdBy: String(expense.createdBy),
      paidBy: String(expense.paidBy),
      description: expense.description,
      amountPaise: expense.amountPaise,
      amount: CommonUtils.paiseToRupees(expense.amountPaise),
      splitType: expense.splitType,
      splits: expense.splits.map((split) => ({
        userId: String(split.userId),
        amountPaise: split.amountPaise,
        amount: CommonUtils.paiseToRupees(split.amountPaise),
        percent: split.percent,
      })),
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }
}
