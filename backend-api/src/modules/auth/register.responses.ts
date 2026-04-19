import { z } from "zod";

export const RegisterResponseSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  status: z.enum(["active", "deleted"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
