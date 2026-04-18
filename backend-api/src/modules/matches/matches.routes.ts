import type { FastifyInstance } from "fastify";

import { requireAuth } from "../auth/auth.middleware";
import { MatchesRepository } from "./matches.repository";
import { MatchListResponseSchema, MatchResponseSchema } from "./matches.schemas";
import { MatchesService } from "./matches.service";

const matchesRepository = new MatchesRepository();
const matchesService = new MatchesService(matchesRepository);

export const registerMatchesRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/matches/me", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.sub;

    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const matches = await matchesService.listUserMatches(userId);

    const response = MatchListResponseSchema.parse({
      items: matches.map((match) =>
        MatchResponseSchema.parse({
          id: match.id,
          userId: match.userId,
          propertyId: match.propertyId,
          filterId: match.filterId,
          matchReasons: match.matchReasons,
          matchedAt: match.matchedAt.toISOString(),
          createdAt: match.createdAt.toISOString(),
        }),
      ),
    });

    return reply.code(200).send(response);
  });
};
