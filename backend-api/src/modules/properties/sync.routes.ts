import type { FastifyInstance } from "fastify";

import { requireAuth } from "../auth/auth.middleware";
import { SyncDiagnosticsService } from "./sync.diagnostics.service";
import { SyncStateRepository } from "./sync-state.repository";

const syncStateRepository = new SyncStateRepository();
const syncDiagnosticsService = new SyncDiagnosticsService(syncStateRepository);

export const registerSyncRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/sync/status", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.sub;
    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const states = await syncDiagnosticsService.getStates();

    return reply.code(200).send({
      states: states.map((state) => ({
        key: state.key,
        lastSyncAt: state.lastSyncAt?.toISOString() ?? null,
        lagSeconds: state.lagSeconds,
      })),
    });
  });
};
