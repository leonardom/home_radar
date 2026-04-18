import { z } from "zod";

export const RegisterResponseSchema = z.object({
  id: z.uuid(),
  email: z.string().email(),
  status: z.enum(["active", "deleted"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
