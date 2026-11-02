import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Group name must contain at least 2 characters")
    .max(100, "Group name cannot exceed 100 characters"),

  description: z
    .string()
    .trim()
    .max(500, "Description cannot exceed 500 characters")
    .optional(),

  members: z
    .array(z.string().min(1))
    .optional()
    .default([]),
});