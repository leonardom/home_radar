import { z } from "zod";

export const RegisterRequestSchema = z.object({
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

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
