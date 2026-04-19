import type { FastifyInstance } from "fastify";

import { requireAuth } from "../auth/auth.middleware";
import { NotificationsRepository } from "./notifications.repository";
import { NotificationsStatusResponseSchema } from "./notifications.schemas";

const notificationsRepository = new NotificationsRepository();

export const registerNotificationsRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/notifications/status", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.sub;

    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const [metrics, failed] = await Promise.all([
      notificationsRepository.getDeliveryMetrics(),
      notificationsRepository.listFailed(50),
    ]);

    const payload = NotificationsStatusResponseSchema.parse({
      metrics,
      failed: failed.map((item) => ({
        id: item.id,
        userId: item.userId,
        matchId: item.matchId,
        status: item.status,
        attemptCount: item.attemptCount,
        lastAttemptAt: item.lastAttemptAt?.toISOString() ?? null,
        sentAt: item.sentAt?.toISOString() ?? null,
        failedAt: item.failedAt?.toISOString() ?? null,
        failureReason: item.failureReason,
        updatedAt: item.updatedAt.toISOString(),
      })),
    });

    return reply.code(200).send(payload);
  });
};
