import type { FastifyInstance } from "fastify";

import { registerAuthRoutes } from "../modules/auth/auth.routes";
import { registerHealthRoutes } from "../modules/health/health.routes";

export const registerRoutes = async (app: FastifyInstance): Promise<void> => {
  app.register(registerAuthRoutes, { prefix: "/api" });
  app.register(registerHealthRoutes, { prefix: "/api" });
};
