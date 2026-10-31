import { z } from "zod";

export const refreshTokenSchema = z.object({
  "x-refresh-token": z
    .string()
    .min(1, "Refresh token is required"),
});

export type RefreshTokenDto = z.infer<typeof refreshTokenSchema>;