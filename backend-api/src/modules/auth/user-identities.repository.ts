import { and, eq } from "drizzle-orm";

import { db } from "../../config/db";
import { userIdentitiesTable } from "../../database/schema";
import type {
  AuthProvider,
  LinkUserIdentityInput,
  SocialAuthProvider,
  UserIdentity,
} from "./user-identities.types";

const mapIdentity = (row: typeof userIdentitiesTable.$inferSelect): UserIdentity => {
  return {
    id: row.id,
    userId: row.userId,
    provider: row.provider as AuthProvider,
    providerUserId: row.providerUserId,
    email: row.email,
    createdAt: row.createdAt,
  };
};

export class UserIdentitiesRepository {
  async findByProviderIdentity(
    provider: AuthProvider,
    providerUserId: string,
  ): Promise<UserIdentity | null> {
    const row = await db
      .select()
      .from(userIdentitiesTable)
      .where(
        and(
          eq(userIdentitiesTable.provider, provider),
          eq(userIdentitiesTable.providerUserId, providerUserId),
        ),
      )
      .limit(1)
      .then((rows) => rows.at(0) ?? null);

    return row ? mapIdentity(row) : null;
  }

  async listByUserId(userId: string): Promise<UserIdentity[]> {
    const rows = await db
      .select()
      .from(userIdentitiesTable)
      .where(eq(userIdentitiesTable.userId, userId));

    return rows.map(mapIdentity);
  }

  async linkIdentity(input: LinkUserIdentityInput): Promise<UserIdentity> {
    const inserted = await db
      .insert(userIdentitiesTable)
      .values({
        userId: input.userId,
        provider: input.provider,
        providerUserId: input.providerUserId,
        email: input.email ?? null,
      })
      .onConflictDoNothing({
        target: [userIdentitiesTable.provider, userIdentitiesTable.providerUserId],
      })
      .returning()
      .then((rows) => rows.at(0) ?? null);

    if (inserted) {
      return mapIdentity(inserted);
    }

    const existing = await this.findByProviderIdentity(input.provider, input.providerUserId);
    if (!existing) {
      throw new Error("Failed to link user identity");
    }

    return existing;
  }

  async unlinkIdentity(userId: string, provider: SocialAuthProvider): Promise<boolean> {
    const deleted = await db
      .delete(userIdentitiesTable)
      .where(and(eq(userIdentitiesTable.userId, userId), eq(userIdentitiesTable.provider, provider)))
      .returning({ id: userIdentitiesTable.id })
      .then((rows) => rows.at(0) ?? null);

    return deleted !== null;
  }
}
