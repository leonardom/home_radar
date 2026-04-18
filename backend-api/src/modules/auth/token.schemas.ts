import { z } from "zod";

export const LoginRequestSchema = z.object({
  email: z
    .string()
    .email()
    .max(320)
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1),
});

export const RefreshRequestSchema = z.object({
  refreshToken: z.string().min(1),
});

export const AuthTokensResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int().positive(),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type AuthTokensResponse = z.infer<typeof AuthTokensResponseSchema>;
