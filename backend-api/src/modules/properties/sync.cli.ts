import { closeDatabasePool } from "../../config/db";
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
  const propertiesRepository = new PropertiesRepository();
  const syncStateRepository = new SyncStateRepository();

  const syncService = new PropertiesSyncService(
    scraperRepository,
    propertiesRepository,
    syncStateRepository,
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
