import { env } from "../../config/env";
import type { MatchingTriggerDispatcher } from "../matching/matching.trigger.dispatcher";
import { NoopMatchingTriggerDispatcher } from "../matching/matching.trigger.dispatcher";
import { mapScraperListingToUpsertProperty } from "./properties.mapper";
import { PropertiesRepository } from "./properties.repository";
import { ScraperListingsRepository } from "./scraper-listings.repository";
import {
  DatabaseSyncDeadLetterRepository,
  type SyncDeadLetterRepository,
} from "./sync-dead-letter.repository";
import { SyncStateRepository } from "./sync-state.repository";
import type { ScraperListing, ScraperListingsSyncContract } from "./properties.types";

export const SCRAPER_LISTINGS_SYNC_CONTRACT: ScraperListingsSyncContract = {
  required: ["source", "listing_url", "updated_at"],
  optional: [
    "title",
    "region",
    "status",
    "price_value",
    "beds",
    "baths",
    "property_type",
    "created_at",
    "last_seen_at",
    "scraped_at",
  ],
  defaults: {
    status: "active",
    source: "unknown",
  },
};

export type SyncRunResult = {
  mode: "backfill" | "incremental";
  source: string;
  fetched: number;
  created: number;
  updated: number;
  deactivated: number;
  deadLetters: number;
  lastSyncAt: Date | null;
};

type SyncLogger = {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
};

const defaultLogger: SyncLogger = {
  info(message, meta) {
    console.info(message, meta);
  },
  warn(message, meta) {
    console.warn(message, meta);
  },
  error(message, meta) {
    console.error(message, meta);
  },
};

const buildSyncKey = (source: string): string => `scraper:listings:${source}`;

export class PropertiesSyncService {
  constructor(
    private readonly scraperListingsRepository: ScraperListingsRepository,
    private readonly propertiesRepository: PropertiesRepository,
    private readonly syncStateRepository: SyncStateRepository,
    private readonly matchingDispatcher: MatchingTriggerDispatcher = new NoopMatchingTriggerDispatcher(),
    private readonly deadLetterRepository: SyncDeadLetterRepository =
      new DatabaseSyncDeadLetterRepository(),
    private readonly logger: SyncLogger = defaultLogger,
    private readonly retryAttempts: number = env.SCRAPER_SYNC_RETRY_ATTEMPTS,
  ) {}

  async runIncremental(source: string = "all"): Promise<SyncRunResult> {
    const startedAt = Date.now();
    const syncKey = buildSyncKey(source);
    this.logger.info("Starting incremental listings sync", { source, syncKey });

    const lastSyncAt = await this.withRetry(
      () => this.syncStateRepository.getLastSyncAt(syncKey),
      "getLastSyncAt",
      { source, syncKey },
    );

    const listings = await this.withRetry(
      () =>
        this.scraperListingsRepository.fetchIncremental({
          after: lastSyncAt,
          source: source === "all" ? undefined : source,
        }),
      "fetchIncremental",
      { source, syncKey },
    );

    const result = await this.processListings({
      mode: "incremental",
      source,
      syncKey,
      listings,
      deactivateMissing: false,
    });

    this.logger.info("Finished incremental listings sync", {
      ...result,
      durationMs: Date.now() - startedAt,
    });

    return result;
  }

  async runBackfill(source: string = "all"): Promise<SyncRunResult> {
    const startedAt = Date.now();
    this.logger.info("Starting backfill listings sync", { source });

    const listings = await this.withRetry(
      () => this.scraperListingsRepository.fetchAllBySource(source === "all" ? undefined : source),
      "fetchAllBySource",
      { source },
    );

    const result = await this.processListings({
      mode: "backfill",
      source,
      syncKey: buildSyncKey(source),
      listings,
      deactivateMissing: true,
    });

    this.logger.info("Finished backfill listings sync", {
      ...result,
      durationMs: Date.now() - startedAt,
    });

    return result;
  }

  private async processListings(params: {
    mode: "backfill" | "incremental";
    source: string;
    syncKey: string;
    listings: ScraperListing[];
    deactivateMissing: boolean;
  }): Promise<SyncRunResult> {
    let created = 0;
    let updated = 0;
    let deactivated = 0;
    let deadLetters = 0;
    let maxUpdatedAt: Date | null = null;

    const seenBySource = new Map<string, Set<string>>();

    for (const listing of params.listings) {
      try {
        const mapped = mapScraperListingToUpsertProperty(
          listing,
          params.source === "all" ? SCRAPER_LISTINGS_SYNC_CONTRACT.defaults.source : params.source,
        );

        const sourceSeen = seenBySource.get(mapped.source) ?? new Set<string>();
        sourceSeen.add(mapped.externalListingId);
        seenBySource.set(mapped.source, sourceSeen);

        const previous = await this.withRetry(
          () =>
            this.propertiesRepository.findBySourceIdentity(mapped.source, mapped.externalListingId),
          "findBySourceIdentity",
          {
            syncKey: params.syncKey,
            source: mapped.source,
            externalListingId: mapped.externalListingId,
          },
        );

        const persisted = await this.withRetry(
          () => this.propertiesRepository.upsertProperty(mapped),
          "upsertProperty",
          {
            syncKey: params.syncKey,
            source: mapped.source,
            externalListingId: mapped.externalListingId,
          },
        );

        if (previous) {
          updated += 1;
          await this.withRetry(
            () => this.matchingDispatcher.dispatchPropertyUpdated({ propertyId: persisted.id }),
            "dispatchPropertyUpdated",
            { syncKey: params.syncKey, propertyId: persisted.id },
          );
        } else {
          created += 1;
          await this.withRetry(
            () => this.matchingDispatcher.dispatchPropertyCreated({ propertyId: persisted.id }),
            "dispatchPropertyCreated",
            { syncKey: params.syncKey, propertyId: persisted.id },
          );
        }

        const listingUpdatedAt =
          listing.updated_at instanceof Date
            ? listing.updated_at
            : listing.updated_at
              ? new Date(listing.updated_at)
              : null;

        if (listingUpdatedAt && !Number.isNaN(listingUpdatedAt.getTime())) {
          if (!maxUpdatedAt || listingUpdatedAt > maxUpdatedAt) {
            maxUpdatedAt = listingUpdatedAt;
          }
        }
      } catch (error: unknown) {
        deadLetters += 1;
        const serializedPayload = JSON.stringify(listing);

        await this.captureDeadLetter({
          syncKey: params.syncKey,
          source: listing.source ?? null,
          externalListingId:
            typeof listing.listing_url === "string"
              ? listing.listing_url
              : listing.id != null
                ? String(listing.id)
                : null,
          payload: serializedPayload,
          errorMessage: error instanceof Error ? error.message : String(error),
        });

        this.logger.warn("Listing sync failed and moved to dead-letter", {
          syncKey: params.syncKey,
          source: listing.source ?? null,
          listingId: listing.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (params.deactivateMissing) {
      for (const [source, seenExternalIds] of seenBySource.entries()) {
        const count = await this.withRetry(
          () => this.propertiesRepository.markInactiveMissingForSource(source, [...seenExternalIds]),
          "markInactiveMissingForSource",
          { syncKey: params.syncKey, source },
        );
        deactivated += count;
      }
    }

    if (maxUpdatedAt) {
      await this.withRetry(
        () => this.syncStateRepository.setLastSyncAt(params.syncKey, maxUpdatedAt),
        "setLastSyncAt",
        { syncKey: params.syncKey },
      );
    }

    return {
      mode: params.mode,
      source: params.source,
      fetched: params.listings.length,
      created,
      updated,
      deactivated,
      deadLetters,
      lastSyncAt: maxUpdatedAt,
    };
  }

  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    meta: Record<string, unknown>,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt += 1) {
      try {
        return await operation();
      } catch (error: unknown) {
        lastError = error;

        if (attempt < this.retryAttempts) {
          this.logger.warn("Sync operation failed, retrying", {
            operation: operationName,
            attempt,
            retryAttempts: this.retryAttempts,
            ...meta,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
    }

    this.logger.error("Sync operation failed after retries", {
      operation: operationName,
      retryAttempts: this.retryAttempts,
      ...meta,
      error: lastError instanceof Error ? lastError.message : String(lastError),
    });

    throw lastError;
  }

  private async captureDeadLetter(params: {
    syncKey: string;
    source: string | null;
    externalListingId: string | null;
    payload: string;
    errorMessage: string;
  }): Promise<void> {
    try {
      await this.deadLetterRepository.createDeadLetter(params);
    } catch (error: unknown) {
      this.logger.error("Failed to capture sync dead-letter", {
        syncKey: params.syncKey,
        source: params.source,
        externalListingId: params.externalListingId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
