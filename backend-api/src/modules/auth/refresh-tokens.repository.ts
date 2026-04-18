import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "../../config/db";
import { refreshTokensTable } from "../../database/schema";

export type RefreshTokenRecord = typeof refreshTokensTable.$inferSelect;

export class RefreshTokensRepository {
  async create(input: { userId: string; tokenHash: string; expiresAt: Date }): Promise<void> {
    await db.insert(refreshTokensTable).values({
      userId: input.userId,
      tokenHash: input.tokenHash,
      expiresAt: input.expiresAt,
    });
  }

  async findActiveByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const now = new Date();

    return db
      .select()
      .from(refreshTokensTable)
      .where(
        and(
          eq(refreshTokensTable.tokenHash, tokenHash),
          isNull(refreshTokensTable.revokedAt),
          gt(refreshTokensTable.expiresAt, now),
        ),
      )
      .limit(1)
      .then((rows) => rows.at(0) ?? null);
  }

  async revokeById(id: string): Promise<void> {
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.id, id));
  }

  async revokeByTokenHash(tokenHash: string): Promise<void> {
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.tokenHash, tokenHash));
  }

  async revokeByUserId(userId: string): Promise<void> {
    await db
      .update(refreshTokensTable)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokensTable.userId, userId));
  }
}
