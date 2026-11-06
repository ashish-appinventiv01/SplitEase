import { z } from "zod";

export const updateGroupSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Group name must contain at least 2 characters")
      .max(100, "Group name cannot exceed 100 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(500, "Description cannot exceed 500 characters")
      .optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.description !== undefined,
    { message: "At least one field is required" }
  );
