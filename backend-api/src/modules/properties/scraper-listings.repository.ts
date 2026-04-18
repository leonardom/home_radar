import { Pool } from "pg";

import { env } from "../../config/env";
import type { ScraperListing } from "./properties.types";

const DEFAULT_BATCH_SIZE = env.SCRAPER_SYNC_BATCH_SIZE;

export class ScraperListingsRepository {
  private readonly pool: Pool;

  constructor(connectionString: string = env.SCRAPER_DATABASE_URL ?? env.DATABASE_URL) {
    this.pool = new Pool({ connectionString });
  }

  async fetchIncremental(params: {
    after: Date | null;
    source?: string;
    limit?: number;
  }): Promise<ScraperListing[]> {
    const limit = params.limit ?? DEFAULT_BATCH_SIZE;

    const rows = await this.pool.query<ScraperListing>(
      `
      SELECT
        id,
        source,
        listing_url,
        title,
        region,
        status,
        price_value,
        beds,
        baths,
        property_type,
        scraped_at,
        created_at,
        updated_at,
        last_seen_at
      FROM listings
      WHERE ($1::timestamptz IS NULL OR updated_at > $1::timestamptz)
        AND ($2::text IS NULL OR source = $2::text)
      ORDER BY updated_at ASC, id ASC
      LIMIT $3
      `,
      [params.after, params.source ?? null, limit],
    );

    return rows.rows;
  }

  async fetchAllBySource(source?: string): Promise<ScraperListing[]> {
    const rows = await this.pool.query<ScraperListing>(
      `
      SELECT
        id,
        source,
        listing_url,
        title,
        region,
        status,
        price_value,
        beds,
        baths,
        property_type,
        scraped_at,
        created_at,
        updated_at,
        last_seen_at
      FROM listings
      WHERE ($1::text IS NULL OR source = $1::text)
      ORDER BY updated_at ASC, id ASC
      `,
      [source ?? null],
    );

    return rows.rows;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
