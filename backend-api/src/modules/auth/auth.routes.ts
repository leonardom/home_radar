import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { DuplicateEmailError } from "../users/users.errors";
import { UsersRepository } from "../users/users.repository";
import { PasswordService } from "./password.service";
import { RegisterResponseSchema } from "./register.responses";
import { RegisterRequestSchema } from "./register.schemas";
import { RegisterService } from "./register.service";

const usersRepository = new UsersRepository();
const passwordService = new PasswordService();
const registerService = new RegisterService(usersRepository, passwordService);

export const registerAuthRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post("/auth/register", async (request, reply) => {
    try {
      const payload = RegisterRequestSchema.parse(request.body);
      const user = await registerService.register(payload);

      const safeResponse = RegisterResponseSchema.parse({
        id: user.id,
        email: user.email,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      });

      return reply.code(201).send(safeResponse);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return reply.code(400).send({
          message: "Validation error",
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        });
      }

      if (error instanceof DuplicateEmailError) {
        return reply.code(409).send({
          message: "Email already in use",
        });
      }

      throw error;
    }
  });
};
