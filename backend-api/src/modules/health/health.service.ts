import type { HealthResponse } from "./health.schemas";
import { HealthRepository } from "./health.repository";

export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async getStatus(): Promise<HealthResponse> {
    await this.healthRepository.checkDatabase();

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
    };
  }
}
