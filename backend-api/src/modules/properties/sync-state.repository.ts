import { eq } from "drizzle-orm";

import { db } from "../../config/db";
import { syncStateTable } from "../../database/schema";

export class SyncStateRepository {
  async getLastSyncAt(key: string): Promise<Date | null> {
    const row = await db
      .select({ lastSyncAt: syncStateTable.lastSyncAt })
      .from(syncStateTable)
      .where(eq(syncStateTable.key, key))
      .then((rows) => rows.at(0) ?? null);

    return row?.lastSyncAt ?? null;
  }

  async setLastSyncAt(key: string, lastSyncAt: Date): Promise<void> {
    await db
      .insert(syncStateTable)
      .values({ key, lastSyncAt })
      .onConflictDoUpdate({
        target: [syncStateTable.key],
        set: {
          lastSyncAt,
          updatedAt: new Date(),
        },
      });
  }

  async listStates(): Promise<Array<{ key: string; lastSyncAt: Date | null }>> {
    const rows = await db
      .select({
        key: syncStateTable.key,
        lastSyncAt: syncStateTable.lastSyncAt,
      })
      .from(syncStateTable);

    return rows;
  }
}
