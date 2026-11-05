import { z } from "zod";

export const addMemberSchema = z.object({
  userId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID"),
});