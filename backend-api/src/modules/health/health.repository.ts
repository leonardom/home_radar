import { sql } from "drizzle-orm";

import { db } from "../../config/db";

export class HealthRepository {
  async checkDatabase(): Promise<void> {
    await db.execute(sql`select 1`);
  }
}
