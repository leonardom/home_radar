import { z } from "zod";

export const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  timestamp: z.string().datetime(),
  database: z.literal("connected"),
  auth: z.object({
    clerk: z.object({
      mode: z.enum(["optional", "required"]),
      publishableKeyConfigured: z.boolean(),
      verificationMethod: z.enum(["none", "secret_key", "jwt_key", "secret_and_jwt"]),
      enabledSocialProviders: z.array(z.enum(["google", "facebook"])),
      providers: z.object({
        google: z.boolean(),
        facebook: z.boolean(),
      }),
      ready: z.boolean(),
      issues: z.array(z.string()),
    }),
  }),
});

export type HealthResponse = z.infer<typeof HealthResponseSchema>;
