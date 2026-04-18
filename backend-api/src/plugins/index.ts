import type { FastifyInstance } from "fastify";

export const registerPlugins = async (app: FastifyInstance): Promise<void> => {
  void app;
  return Promise.resolve();
};
