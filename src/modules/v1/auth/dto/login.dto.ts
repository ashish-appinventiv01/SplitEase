import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .transform((value) => value.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required")
    .max(32, "Password cannot exceed 32 characters"),
});

export type LoginDto = z.infer<typeof loginSchema>;