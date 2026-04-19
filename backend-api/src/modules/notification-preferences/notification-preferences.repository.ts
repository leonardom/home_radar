import { eq } from "drizzle-orm";

import { db } from "../../config/db";
import { notificationPreferencesTable } from "../../database/schema";
import type { NotificationMode, NotificationPreference } from "./notification-preferences.types";

const mapPreference = (
  row: typeof notificationPreferencesTable.$inferSelect,
): NotificationPreference => {
  return {
    userId: row.userId,
    mode: row.mode as NotificationMode,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export class NotificationPreferencesRepository {
  async getOrCreateByUserId(userId: string): Promise<NotificationPreference> {
    const existing = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, userId))
      .limit(1)
      .then((rows) => rows.at(0) ?? null);

    if (existing) {
      return mapPreference(existing);
    }

    const created = await db
      .insert(notificationPreferencesTable)
      .values({
        userId,
        mode: "instant",
      })
      .onConflictDoNothing({
        target: [notificationPreferencesTable.userId],
      })
      .returning()
      .then((rows) => rows.at(0) ?? null);

    if (created) {
      return mapPreference(created);
    }

    const fallback = await db
      .select()
      .from(notificationPreferencesTable)
      .where(eq(notificationPreferencesTable.userId, userId))
      .limit(1)
      .then((rows) => rows.at(0) ?? null);

    if (!fallback) {
      throw new Error("Failed to load notification preference");
    }

    return mapPreference(fallback);
  }

  async updateMode(userId: string, mode: NotificationMode): Promise<NotificationPreference> {
    const now = new Date();

    const updated = await db
      .insert(notificationPreferencesTable)
      .values({
        userId,
        mode,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: [notificationPreferencesTable.userId],
        set: {
          mode,
          updatedAt: now,
        },
      })
      .returning()
      .then((rows) => rows.at(0) ?? null);

    if (!updated) {
      throw new Error("Failed to update notification preference");
    }

    return mapPreference(updated);
  }
}
