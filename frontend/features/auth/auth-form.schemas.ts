import { z } from "zod";

export const authProviderSchema = z.enum(["password", "google", "facebook"]);

export const authSignInFormSchema = z.object({
  email: z
    .string()
    .email()
    .max(320)
    .transform((value) => value.trim().toLowerCase()),
  password: z.string().min(1),
});

export const authSignUpFormSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z
    .string()
    .email()
    .max(320)
    .transform((value) => value.trim().toLowerCase()),
  password: z
    .string()
    .min(8)
    .max(72)
    .regex(/[A-Z]/, "Password must include at least one uppercase letter")
    .regex(/[a-z]/, "Password must include at least one lowercase letter")
    .regex(/[0-9]/, "Password must include at least one number"),
});

export const authSessionExchangeSchema = z.object({
  provider: authProviderSchema,
  sessionToken: z.string().min(1),
});

export const authRefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export type AuthSignInFormValues = z.infer<typeof authSignInFormSchema>;
export type AuthSignUpFormValues = z.infer<typeof authSignUpFormSchema>;
export type AuthSessionExchangeValues = z.infer<
  typeof authSessionExchangeSchema
>;
export type AuthRefreshValues = z.infer<typeof authRefreshSchema>;
