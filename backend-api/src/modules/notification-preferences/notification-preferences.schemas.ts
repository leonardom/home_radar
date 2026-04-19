import { z } from "zod";

export const NotificationModeSchema = z.enum(["instant", "digest"]);

export const NotificationPreferenceResponseSchema = z.object({
  userId: z.uuid(),
  mode: NotificationModeSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const UpdateNotificationPreferenceRequestSchema = z.object({
  mode: NotificationModeSchema,
});

export type UpdateNotificationPreferenceRequest = z.infer<
  typeof UpdateNotificationPreferenceRequestSchema
>;
