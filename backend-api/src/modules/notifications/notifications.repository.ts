import { and, asc, count, eq, lt, sql } from "drizzle-orm";

import { db } from "../../config/db";
import { notificationsTable } from "../../database/schema";
import type {
  CreateNotificationInput,
  Notification,
  NotificationDeliveryMetrics,
} from "./notifications.types";

const mapNotification = (row: typeof notificationsTable.$inferSelect): Notification => {
  return {
    id: row.id,
    userId: row.userId,
    matchId: row.matchId,
    channel: row.channel as Notification["channel"],
    subject: row.subject,
    body: row.body,
    status: row.status as Notification["status"],
    attemptCount: row.attemptCount,
    lastAttemptAt: row.lastAttemptAt,
    sentAt: row.sentAt,
    failedAt: row.failedAt,
    failureReason: row.failureReason,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export class NotificationsRepository {
  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    const inserted = await db
      .insert(notificationsTable)
      .values({
        userId: input.userId,
        matchId: input.matchId,
        channel: input.channel,
        subject: input.subject,
        body: input.body,
      })
      .onConflictDoNothing({
        target: [notificationsTable.matchId, notificationsTable.channel],
      })
      .returning()
      .then((rows) => rows.at(0) ?? null);

    if (inserted) {
      return mapNotification(inserted);
    }

    const existing = await db
      .select()
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.matchId, input.matchId),
          eq(notificationsTable.channel, input.channel),
        ),
      )
      .then((rows) => rows.at(0) ?? null);

    if (!existing) {
      throw new Error("Failed to create notification");
    }

    return mapNotification(existing);
  }

  async listByUser(userId: string): Promise<Notification[]> {
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.userId, userId));

    return rows.map(mapNotification);
  }

  async listPending(limit: number = 100, maxAttempts: number = 3): Promise<Notification[]> {
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(
        and(
          eq(notificationsTable.status, "pending"),
          lt(notificationsTable.attemptCount, maxAttempts),
        ),
      )
      .orderBy(asc(notificationsTable.createdAt))
      .limit(limit);

    return rows.map(mapNotification);
  }

  async listFailed(limit: number = 50): Promise<Notification[]> {
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.status, "failed"))
      .orderBy(asc(notificationsTable.updatedAt))
      .limit(limit);

    return rows.map(mapNotification);
  }

  async markAttempt(id: string): Promise<Notification | null> {
    const now = new Date();

    const row = await db
      .update(notificationsTable)
      .set({
        attemptCount: sql`${notificationsTable.attemptCount} + 1`,
        lastAttemptAt: now,
        updatedAt: now,
      })
      .where(eq(notificationsTable.id, id))
      .returning()
      .then((rows) => rows.at(0) ?? null);

    return row ? mapNotification(row) : null;
  }

  async recordAttemptFailure(id: string, reason: string): Promise<Notification | null> {
    const now = new Date();

    const row = await db
      .update(notificationsTable)
      .set({
        failedAt: now,
        failureReason: reason,
        updatedAt: now,
      })
      .where(eq(notificationsTable.id, id))
      .returning()
      .then((rows) => rows.at(0) ?? null);

    return row ? mapNotification(row) : null;
  }

  async markSent(id: string): Promise<Notification | null> {
    const now = new Date();
    const row = await db
      .update(notificationsTable)
      .set({
        status: "sent",
        sentAt: now,
        failedAt: null,
        failureReason: null,
        updatedAt: now,
      })
      .where(eq(notificationsTable.id, id))
      .returning()
      .then((rows) => rows.at(0) ?? null);

    return row ? mapNotification(row) : null;
  }

  async markFailed(id: string, reason: string): Promise<Notification | null> {
    const now = new Date();
    const row = await db
      .update(notificationsTable)
      .set({
        status: "failed",
        failedAt: now,
        failureReason: reason,
        updatedAt: now,
      })
      .where(eq(notificationsTable.id, id))
      .returning()
      .then((rows) => rows.at(0) ?? null);

    return row ? mapNotification(row) : null;
  }

  async getDeliveryMetrics(): Promise<NotificationDeliveryMetrics> {
    const [pendingRows, sentRows, failedRows] = await Promise.all([
      db
        .select({ value: count() })
        .from(notificationsTable)
        .where(eq(notificationsTable.status, "pending")),
      db
        .select({ value: count() })
        .from(notificationsTable)
        .where(eq(notificationsTable.status, "sent")),
      db
        .select({ value: count() })
        .from(notificationsTable)
        .where(eq(notificationsTable.status, "failed")),
    ]);

    return {
      pendingCount: pendingRows.at(0)?.value ?? 0,
      sentCount: sentRows.at(0)?.value ?? 0,
      failedCount: failedRows.at(0)?.value ?? 0,
    };
  }
}
