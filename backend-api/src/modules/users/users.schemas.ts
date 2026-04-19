import { z } from "zod";

const AuthProviderSchema = z.enum(["password", "google", "facebook"]);

export const UserProfileResponseSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1).max(120),
  email: z.string().email(),
  linkedProviders: z.array(AuthProviderSchema),
  status: z.enum(["active", "deleted"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

export const UserAuthProvidersResponseSchema = z.object({
  userId: z.uuid(),
  linkedProviders: z.array(AuthProviderSchema),
});

export const UpdateProfileRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    email: z
      .string()
      .email()
      .max(320)
      .transform((value) => value.trim().toLowerCase())
      .optional(),
  })
  .refine((data) => data.email !== undefined || data.name !== undefined, {
    message: "At least one field must be provided",
  });

export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
