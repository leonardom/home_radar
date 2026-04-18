import { and, eq } from "drizzle-orm";

import { db } from "../../config/db";
import { matchesTable } from "../../database/schema";
import type { CreateMatchInput, Match } from "./matches.types";

const mapMatch = (row: typeof matchesTable.$inferSelect): Match => {
  return {
    id: row.id,
    userId: row.userId,
    propertyId: row.propertyId,
    filterId: row.filterId,
    matchReasons: row.matchReasons,
    matchedAt: row.matchedAt,
    createdAt: row.createdAt,
  };
};

export class MatchesRepository {
  async createMatch(input: CreateMatchInput): Promise<Match> {
    const row = await db
      .insert(matchesTable)
      .values({
        userId: input.userId,
        propertyId: input.propertyId,
        filterId: input.filterId,
        matchReasons: input.matchReasons,
        matchedAt: input.matchedAt,
      })
      .onConflictDoUpdate({
        target: [matchesTable.userId, matchesTable.propertyId],
        set: {
          filterId: input.filterId,
          matchReasons: input.matchReasons,
          matchedAt: input.matchedAt,
        },
      })
      .returning()
      .then((rows) => rows.at(0));

    if (!row) {
      throw new Error("Failed to create match");
    }

    return mapMatch(row);
  }

  async findMatch(userId: string, propertyId: string): Promise<Match | null> {
    const row = await db
      .select()
      .from(matchesTable)
      .where(and(eq(matchesTable.userId, userId), eq(matchesTable.propertyId, propertyId)))
      .then((rows) => rows.at(0) ?? null);

    return row ? mapMatch(row) : null;
  }

  async listMatchesByUser(userId: string): Promise<Match[]> {
    const rows = await db.select().from(matchesTable).where(eq(matchesTable.userId, userId));

    return rows.map(mapMatch);
  }

  async listMatchesByProperty(propertyId: string): Promise<Match[]> {
    const rows = await db
      .select()
      .from(matchesTable)
      .where(eq(matchesTable.propertyId, propertyId));

    return rows.map(mapMatch);
  }
}
