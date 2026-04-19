import { closeDatabasePool } from "../../config/db";
import { FiltersRepository } from "../filters/filters.repository";
import { InMemoryTriggerEventStore } from "../matching/matching.event-store";
import { MatchingService } from "../matching/matching.service";
import { MatchingTriggerService } from "../matching/matching.trigger.service";
import { DatabaseMatchingSink } from "../matches/matches.sink";
import { MatchesRepository } from "../matches/matches.repository";
import { MatchesService } from "../matches/matches.service";
import { NotificationsRepository } from "../notifications/notifications.repository";
import { NotificationsService } from "../notifications/notifications.service";
import { PropertiesRepository } from "./properties.repository";
import { PropertiesSyncService } from "./properties.sync.service";
import { ScraperListingsRepository } from "./scraper-listings.repository";
import { SyncStateRepository } from "./sync-state.repository";

const getArgValue = (name: string): string | undefined => {
  const full = process.argv.find((arg) => arg.startsWith(`${name}=`));
  return full ? full.split("=").slice(1).join("=") : undefined;
};

const parseSourceArg = (): string => {
  return getArgValue("--source") ?? "all";
};

const parseMode = (): "backfill" | "incremental" => {
  const mode = process.argv[2];
  if (mode === "backfill" || mode === "incremental") {
    return mode;
  }

  throw new Error(
    "Usage: tsx src/modules/properties/sync.cli.ts <backfill|incremental> [--source=<source>]",
  );
};

const run = async (): Promise<void> => {
  const mode = parseMode();
  const source = parseSourceArg();

  const scraperRepository = new ScraperListingsRepository();
  const filtersRepository = new FiltersRepository();
  const propertiesRepository = new PropertiesRepository();
  const matchesRepository = new MatchesRepository();
  const notificationsRepository = new NotificationsRepository();
  const syncStateRepository = new SyncStateRepository();

  const matchingService = new MatchingService();
  const eventStore = new InMemoryTriggerEventStore();
  const matchesService = new MatchesService(matchesRepository);
  const notificationsService = new NotificationsService(notificationsRepository);
  const matchingSink = new DatabaseMatchingSink(matchesService, notificationsService);
  const matchingDispatcher = new MatchingTriggerService(
    matchingService,
    filtersRepository,
    propertiesRepository,
    eventStore,
    matchingSink,
  );

  const syncService = new PropertiesSyncService(
    scraperRepository,
    propertiesRepository,
    syncStateRepository,
    matchingDispatcher,
  );

  const result =
    mode === "backfill"
      ? await syncService.runBackfill(source)
      : await syncService.runIncremental(source);

  console.info("Listings sync finished", {
    mode: result.mode,
    source: result.source,
    fetched: result.fetched,
    created: result.created,
    updated: result.updated,
    deactivated: result.deactivated,
    deadLetters: result.deadLetters,
    lastSyncAt: result.lastSyncAt?.toISOString() ?? null,
  });

  await scraperRepository.close();
  await closeDatabasePool();
};

run().catch(async (error: unknown) => {
  console.error("Listings sync failed", {
    error: error instanceof Error ? error.message : String(error),
  });

  process.exitCode = 1;

  await closeDatabasePool();
});
