import type { FastifyInstance } from "fastify";
import cors from "@fastify/cors";

export const registerPlugins = async (app: FastifyInstance): Promise<void> => {
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
};
