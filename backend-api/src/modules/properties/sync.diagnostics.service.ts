import { SyncStateRepository } from "./sync-state.repository";

export type SyncDiagnosticState = {
  key: string;
  lastSyncAt: Date | null;
  lagSeconds: number | null;
};

export class SyncDiagnosticsService {
  constructor(private readonly syncStateRepository: SyncStateRepository) {}

  async getStates(now: Date = new Date()): Promise<SyncDiagnosticState[]> {
    const states = await this.syncStateRepository.listStates();

    return states.map((state) => ({
      key: state.key,
      lastSyncAt: state.lastSyncAt,
      lagSeconds: state.lastSyncAt
        ? Math.max(0, Math.floor((now.getTime() - state.lastSyncAt.getTime()) / 1000))
        : null,
    }));
  }
}
