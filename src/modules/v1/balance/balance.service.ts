import mongoose from "mongoose";
import { AppError } from "../../../common/errors";
import { ErrorCode } from "../../../enum/enum";
import { CommonUtils } from "../../../common/utils";
import { GroupRepository } from "../../../repositories/group.repository";
import { ExpenseRepository } from "../../../repositories/expense.repository";
import { SettlementRepository } from "../../../repositories/settlement.repository";
import { RedisCacheManager } from "../../../providers/redis/redis-cache.manager";

interface MemberBalance {
  userId: string;
  balancePaise: number;
  balance: number;
}

interface DebtEdge {
  fromUserId: string;
  toUserId: string;
  amountPaise: number;
  amount: number;
}

interface GroupBalanceResult {
  groupId: string;
  balances: MemberBalance[];
  debts: DebtEdge[];
  cached: boolean;
}

export class BalanceService {
  private readonly groupRepository = new GroupRepository();
  private readonly expenseRepository = new ExpenseRepository();
  private readonly settlementRepository = new SettlementRepository();
  private readonly redisCache = new RedisCacheManager();

  public async getGroupBalances(
    groupId: string,
    requesterId: string
  ): Promise<GroupBalanceResult> {
    await this.requireMembership(groupId, requesterId);

    const cached =
      await this.redisCache.getGroupBalances<Omit<GroupBalanceResult, "cached">>(
        groupId
      );

    if (cached) {
      return { ...cached, cached: true };
    }

    const result = await this.calculateGroupBalances(groupId);
    await this.redisCache.setGroupBalances(groupId, result);

    return { ...result, cached: false };
  }

  public async getMyBalance(groupId: string, requesterId: string) {
    const groupBalances = await this.getGroupBalances(groupId, requesterId);
    const mine = groupBalances.balances.find(
      (balance) => balance.userId === requesterId
    );

    return {
      groupId,
      userId: requesterId,
      balancePaise: mine?.balancePaise ?? 0,
      balance: mine?.balance ?? 0,
      debts: groupBalances.debts.filter(
        (debt) =>
          debt.fromUserId === requesterId || debt.toUserId === requesterId
      ),
      cached: groupBalances.cached,
    };
  }

  private async calculateGroupBalances(
    groupId: string
  ): Promise<Omit<GroupBalanceResult, "cached">> {
    const group = await this.groupRepository.findActiveById(groupId);

    if (!group) {
      throw new AppError("Group not found", 404, ErrorCode.NOT_FOUND);
    }

    const balances = new Map<string, number>();

    for (const member of group.members) {
      balances.set(String(member.userId), 0);
    }

    const [expenses, settlements] = await Promise.all([
      this.expenseRepository.findActiveByGroup(groupId),
      this.settlementRepository.findAllByGroup(groupId),
    ]);

    for (const expense of expenses) {
      const paidBy = String(expense.paidBy);
      balances.set(paidBy, (balances.get(paidBy) ?? 0) + expense.amountPaise);

      for (const split of expense.splits) {
        const userId = String(split.userId);
        balances.set(
          userId,
          (balances.get(userId) ?? 0) - split.amountPaise
        );
      }
    }

    for (const settlement of settlements) {
      const fromUserId = String(settlement.fromUserId);
      const toUserId = String(settlement.toUserId);

      balances.set(
        fromUserId,
        (balances.get(fromUserId) ?? 0) + settlement.amountPaise
      );
      balances.set(
        toUserId,
        (balances.get(toUserId) ?? 0) - settlement.amountPaise
      );
    }

    const memberBalances: MemberBalance[] = [...balances.entries()].map(
      ([userId, balancePaise]) => ({
        userId,
        balancePaise,
        balance: CommonUtils.paiseToRupees(balancePaise),
      })
    );

    const sum = memberBalances.reduce(
      (total, item) => total + item.balancePaise,
      0
    );

    if (sum !== 0) {
      throw new AppError(
        "Group balances do not sum to zero",
        500,
        ErrorCode.INTERNAL_SERVER_ERROR
      );
    }

    return {
      groupId,
      balances: memberBalances,
      debts: this.simplifyDebts(memberBalances),
    };
  }

  private simplifyDebts(balances: MemberBalance[]): DebtEdge[] {
    const debtors = balances
      .filter((item) => item.balancePaise < 0)
      .map((item) => ({
        userId: item.userId,
        amount: -item.balancePaise,
      }))
      .sort((a, b) => b.amount - a.amount);

    const creditors = balances
      .filter((item) => item.balancePaise > 0)
      .map((item) => ({
        userId: item.userId,
        amount: item.balancePaise,
      }))
      .sort((a, b) => b.amount - a.amount);

    const debts: DebtEdge[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i]!;
      const creditor = creditors[j]!;
      const amountPaise = Math.min(debtor.amount, creditor.amount);

      if (amountPaise > 0) {
        debts.push({
          fromUserId: debtor.userId,
          toUserId: creditor.userId,
          amountPaise,
          amount: CommonUtils.paiseToRupees(amountPaise),
        });
      }

      debtor.amount -= amountPaise;
      creditor.amount -= amountPaise;

      if (debtor.amount === 0) i += 1;
      if (creditor.amount === 0) j += 1;
    }

    return debts;
  }

  private async requireMembership(groupId: string, userId: string) {
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      throw new AppError("Invalid group ID", 400, ErrorCode.BAD_REQUEST);
    }

    const isMember = await this.groupRepository.isActiveMember(
      groupId,
      userId
    );

    if (!isMember) {
      throw new AppError(
        "You are not a member of this group",
        403,
        ErrorCode.NOT_GROUP_MEMBER
      );
    }
  }
}
