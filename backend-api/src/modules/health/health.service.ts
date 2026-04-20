import type { HealthResponse } from "./health.schemas";
import { HealthRepository } from "./health.repository";
import { env, evaluateClerkReadiness } from "../../config/env";

export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async getStatus(): Promise<HealthResponse> {
    await this.healthRepository.checkDatabase();
    const clerkReadiness = evaluateClerkReadiness(env);

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      database: "connected",
      auth: {
        clerk: clerkReadiness,
      },
    };
  }
}
