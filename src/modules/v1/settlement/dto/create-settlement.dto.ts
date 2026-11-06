import { z } from "zod";

const objectId = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID");

export const createSettlementSchema = z
  .object({
    fromUserId: objectId,
    toUserId: objectId,
    amount: z.number().positive("Amount must be greater than zero"),
    note: z.string().trim().max(500).optional(),
  })
  .refine((value) => value.fromUserId !== value.toUserId, {
    message: "Payer and receiver must be different users",
    path: ["toUserId"],
  });

export const settlementIdParamSchema = z.object({
  settlementId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid settlement ID"),
});
