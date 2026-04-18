import type { FastifyInstance } from "fastify";

import { HealthRepository } from "./health.repository";
import { HealthResponseSchema } from "./health.schemas";
import { HealthService } from "./health.service";

const healthRepository = new HealthRepository();
const healthService = new HealthService(healthRepository);

export const registerHealthRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/health", async (_request, reply) => {
    const status = await healthService.getStatus();

    const payload = HealthResponseSchema.parse(status);
    return reply.send(payload);
  });
};
