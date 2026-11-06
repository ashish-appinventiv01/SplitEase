import type { SplitType } from "../../../../enum/enum";

export interface ExpenseParticipantInput {
  userId: string;
  amount?: number;
  percent?: number;
}

export interface CreateExpensePayload {
  description: string;
  amount: number;
  paidBy: string;
  splitType: SplitType;
  participants: ExpenseParticipantInput[];
}

export interface UpdateExpensePayload {
  description?: string;
  amount?: number;
  paidBy?: string;
  splitType?: SplitType;
  participants?: ExpenseParticipantInput[];
}
