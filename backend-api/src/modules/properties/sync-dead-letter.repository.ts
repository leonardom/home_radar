import { db } from "../../config/db";
import { syncDeadLettersTable } from "../../database/schema";

export type DeadLetterInput = {
  syncKey: string;
  source: string | null;
  externalListingId: string | null;
  payload: string;
  errorMessage: string;
};

export interface SyncDeadLetterRepository {
  createDeadLetter(input: DeadLetterInput): Promise<void>;
}

export class DatabaseSyncDeadLetterRepository implements SyncDeadLetterRepository {
  async createDeadLetter(input: DeadLetterInput): Promise<void> {
    await db.insert(syncDeadLettersTable).values({
      syncKey: input.syncKey,
      source: input.source,
      externalListingId: input.externalListingId,
      payload: input.payload,
      errorMessage: input.errorMessage,
    });
  }
}

export class NoopSyncDeadLetterRepository implements SyncDeadLetterRepository {
  async createDeadLetter(): Promise<void> {
    return;
  }
}
