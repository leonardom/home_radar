import { eq } from "drizzle-orm";

import { db } from "../../config/db";
import { usersTable } from "../../repositories/schema";
import { DuplicateEmailError } from "./users.errors";
import type { NewUser, User } from "./user.types";

const mapUser = (row: typeof usersTable.$inferSelect): User => {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.passwordHash,
    status: row.status as User["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export class UsersRepository {
  async findByEmail(email: string): Promise<User | null> {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1)
      .then((rows) => rows.at(0) ?? null);

    return user ? mapUser(user) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, id))
      .limit(1)
      .then((rows) => rows.at(0) ?? null);

    return user ? mapUser(user) : null;
  }

  async createUser(input: NewUser): Promise<User> {
    let user: typeof usersTable.$inferSelect | undefined;

    try {
      user = await db
        .insert(usersTable)
        .values({
          email: input.email,
          passwordHash: input.passwordHash,
          status: input.status ?? "active",
        })
        .returning()
        .then((rows) => rows.at(0));
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new DuplicateEmailError(input.email);
      }

      throw error;
    }

    if (!user) {
      throw new Error("Failed to create user");
    }

    return mapUser(user);
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "23505"
    );
  }
}
