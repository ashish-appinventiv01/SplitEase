import { z } from "zod";
import { SplitType } from "../../../../enum/enum";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID");

const splitParticipantSchema = z.object({
  userId: objectId,
  amount: z.number().nonnegative().optional(),
  percent: z.number().min(0).max(100).optional(),
});

export const createExpenseSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, "Description is required")
      .max(500, "Description cannot exceed 500 characters"),
    amount: z
      .number({ error: "Amount is required" })
      .positive("Amount must be greater than zero"),
    paidBy: objectId,
    splitType: z.enum(SplitType),
    participants: z
      .array(splitParticipantSchema)
      .min(1, "At least one participant is required"),
  })
  .superRefine((value, ctx) => {
    const uniqueIds = new Set(value.participants.map((p) => p.userId));
    if (uniqueIds.size !== value.participants.length) {
      ctx.addIssue({
        code: "custom",
        message: "Duplicate participants are not allowed",
        path: ["participants"],
      });
    }

    if (value.splitType === SplitType.EXACT) {
      for (const [index, participant] of value.participants.entries()) {
        if (participant.amount === undefined) {
          ctx.addIssue({
            code: "custom",
            message: "Exact split requires amount for each participant",
            path: ["participants", index, "amount"],
          });
        }
      }
    }

    if (value.splitType === SplitType.PERCENT) {
      for (const [index, participant] of value.participants.entries()) {
        if (participant.percent === undefined) {
          ctx.addIssue({
            code: "custom",
            message: "Percent split requires percent for each participant",
            path: ["participants", index, "percent"],
          });
        }
      }
    }
  });

export const updateExpenseSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1)
      .max(500)
      .optional(),
    amount: z.number().positive().optional(),
    paidBy: objectId.optional(),
    splitType: z.enum(SplitType).optional(),
    participants: z.array(splitParticipantSchema).min(1).optional(),
  })
  .refine(
    (value) =>
      value.description !== undefined ||
      value.amount !== undefined ||
      value.paidBy !== undefined ||
      value.splitType !== undefined ||
      value.participants !== undefined,
    { message: "At least one field is required" }
  );

export const expenseIdParamSchema = z.object({
  expenseId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid expense ID"),
});
