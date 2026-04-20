import { z } from "zod";

export const SessionExchangeProviderSchema = z.enum(["password", "google", "facebook"]);
export const OAuthProviderSchema = z.enum(["google", "facebook"]);

export const LoginRequestSchema = z.object({
  email: z
    .string()
    .email()
    .max(320)
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1),
});

export const OAuthLoginRequestSchema = z.object({
  provider: OAuthProviderSchema,
  sessionToken: z.string().min(1),
  state: z.string().trim().min(16).max(256),
  nonce: z.string().trim().min(16).max(256),
});

export const SessionExchangeRequestSchema = z.object({
  provider: SessionExchangeProviderSchema,
  sessionToken: z.string().min(1),
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
export type OAuthLoginRequest = z.infer<typeof OAuthLoginRequestSchema>;
export type SessionExchangeRequest = z.infer<typeof SessionExchangeRequestSchema>;
export type RefreshRequest = z.infer<typeof RefreshRequestSchema>;
export type AuthTokensResponse = z.infer<typeof AuthTokensResponseSchema>;
