import Fastify, { type FastifyInstance } from "fastify";

import { registerPlugins } from "./plugins";
import { registerRoutes } from "./routes";

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: true,
  });

  await registerPlugins(app);
  await registerRoutes(app);

  return app;
};
