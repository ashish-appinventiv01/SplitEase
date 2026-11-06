import { z } from "zod";

export const groupIdParamSchema = z.object({
  groupId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid group ID"),
});

export const removeMemberParamSchema = z.object({
  groupId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid group ID"),
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"),
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
