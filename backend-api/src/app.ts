import Fastify, { type FastifyInstance } from "fastify";

import { env, evaluateClerkReadiness } from "./config/env";
import { registerPlugins } from "./plugins";
import { registerRoutes } from "./routes";

export const buildApp = async (): Promise<FastifyInstance> => {
  const app = Fastify({
    logger: true,
  });

  await registerPlugins(app);
  await registerRoutes(app);

  const clerkReadiness = evaluateClerkReadiness(env);
  app.log.info(
    {
      event: "auth.clerk.readiness",
      clerk: clerkReadiness,
    },
    "Clerk OAuth readiness evaluated",
  );

  return app;
};
