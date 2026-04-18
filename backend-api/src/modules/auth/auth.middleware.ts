import type { FastifyReply, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";

import { TokenService } from "./token.service";

const tokenService = new TokenService();

export const requireAuth = async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    void reply.code(401).send({ message: "Unauthorized" });
    return;
  }

  const token = authorization.slice("Bearer ".length);

  try {
    request.authUser = tokenService.verifyAccessToken(token);
  } catch (error: unknown) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      void reply.code(401).send({ message: "Unauthorized" });
      return;
    }

    throw error;
  }
};
