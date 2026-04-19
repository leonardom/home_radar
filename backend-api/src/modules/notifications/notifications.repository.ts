import { and, eq } from "drizzle-orm";

import { db } from "../../config/db";
import { notificationsTable } from "../../database/schema";
import type { CreateNotificationInput, Notification } from "./notifications.types";

const mapNotification = (row: typeof notificationsTable.$inferSelect): Notification => {
  return {
    id: row.id,
    userId: row.userId,
    matchId: row.matchId,
    channel: row.channel as Notification["channel"],
    subject: row.subject,
    body: row.body,
    status: row.status as Notification["status"],
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
}
