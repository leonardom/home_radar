import { z } from "zod";

export const NotificationStatusItemSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  matchId: z.uuid(),
  status: z.enum(["pending", "sent", "failed"]),
  attemptCount: z.number().int().nonnegative(),
  lastAttemptAt: z.string().datetime().nullable(),
  sentAt: z.string().datetime().nullable(),
  failedAt: z.string().datetime().nullable(),
  failureReason: z.string().nullable(),
  updatedAt: z.string().datetime(),
});

export const NotificationDeliveryMetricsSchema = z.object({
  pendingCount: z.number().int().nonnegative(),
  sentCount: z.number().int().nonnegative(),
  failedCount: z.number().int().nonnegative(),
});

export const NotificationsStatusResponseSchema = z.object({
  metrics: NotificationDeliveryMetricsSchema,
  failed: z.array(NotificationStatusItemSchema),
});
