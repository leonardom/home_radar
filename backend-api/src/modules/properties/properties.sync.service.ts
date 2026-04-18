import type { MatchingTriggerDispatcher } from "../matching/matching.trigger.dispatcher";
import { NoopMatchingTriggerDispatcher } from "../matching/matching.trigger.dispatcher";
import { mapScraperListingToUpsertProperty } from "./properties.mapper";
import { PropertiesRepository } from "./properties.repository";
import { ScraperListingsRepository } from "./scraper-listings.repository";
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
  lastSyncAt: Date | null;
};

const buildSyncKey = (source: string): string => `scraper:listings:${source}`;

export class PropertiesSyncService {
  constructor(
    private readonly scraperListingsRepository: ScraperListingsRepository,
    private readonly propertiesRepository: PropertiesRepository,
    private readonly syncStateRepository: SyncStateRepository,
    private readonly matchingDispatcher: MatchingTriggerDispatcher = new NoopMatchingTriggerDispatcher(),
  ) {}

  async runIncremental(source: string = "all"): Promise<SyncRunResult> {
    const syncKey = buildSyncKey(source);
    const lastSyncAt = await this.syncStateRepository.getLastSyncAt(syncKey);
    const listings = await this.scraperListingsRepository.fetchIncremental({
      after: lastSyncAt,
      source: source === "all" ? undefined : source,
    });

    return this.processListings({
      mode: "incremental",
      source,
      syncKey,
      listings,
      deactivateMissing: false,
    });
  }

  async runBackfill(source: string = "all"): Promise<SyncRunResult> {
    const listings = await this.scraperListingsRepository.fetchAllBySource(
      source === "all" ? undefined : source,
    );

    return this.processListings({
      mode: "backfill",
      source,
      syncKey: buildSyncKey(source),
      listings,
      deactivateMissing: true,
    });
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
    let maxUpdatedAt: Date | null = null;

    const seenBySource = new Map<string, Set<string>>();

    for (const listing of params.listings) {
      const mapped = mapScraperListingToUpsertProperty(
        listing,
        params.source === "all" ? SCRAPER_LISTINGS_SYNC_CONTRACT.defaults.source : params.source,
      );

      const sourceSeen = seenBySource.get(mapped.source) ?? new Set<string>();
      sourceSeen.add(mapped.externalListingId);
      seenBySource.set(mapped.source, sourceSeen);

      const previous = await this.propertiesRepository.findBySourceIdentity(
        mapped.source,
        mapped.externalListingId,
      );

      const persisted = await this.propertiesRepository.upsertProperty(mapped);

      if (previous) {
        updated += 1;
        await this.matchingDispatcher.dispatchPropertyUpdated({ propertyId: persisted.id });
      } else {
        created += 1;
        await this.matchingDispatcher.dispatchPropertyCreated({ propertyId: persisted.id });
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
    }

    if (params.deactivateMissing) {
      for (const [source, seenExternalIds] of seenBySource.entries()) {
        const count = await this.propertiesRepository.markInactiveMissingForSource(source, [
          ...seenExternalIds,
        ]);
        deactivated += count;
      }
    }

    if (maxUpdatedAt) {
      await this.syncStateRepository.setLastSyncAt(params.syncKey, maxUpdatedAt);
    }

    return {
      mode: params.mode,
      source: params.source,
      fetched: params.listings.length,
      created,
      updated,
      deactivated,
      lastSyncAt: maxUpdatedAt,
    };
  }
}
