import { z } from "zod";

export const UserProfileResponseSchema = z.object({
  id: z.uuid(),
  email: z.string().email(),
  status: z.enum(["active", "deleted"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const UpdateProfileRequestSchema = z
  .object({
    email: z
      .string()
      .email()
      .max(320)
      .transform((value) => value.trim().toLowerCase())
      .optional(),
  })
  .refine((data) => data.email !== undefined, {
    message: "At least one field must be provided",
  });

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
