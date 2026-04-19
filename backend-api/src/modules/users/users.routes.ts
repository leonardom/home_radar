import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { requireAuth } from "../auth/auth.middleware";
import { RefreshTokensRepository } from "../auth/refresh-tokens.repository";
import { DuplicateEmailError, ProfileNotFoundError } from "./users.errors";
import { UsersRepository } from "./users.repository";
import { UpdateProfileRequestSchema, UserProfileResponseSchema } from "./users.schemas";
import { UsersService } from "./users.service";

const usersRepository = new UsersRepository();
const refreshTokensRepository = new RefreshTokensRepository();
const usersService = new UsersService(usersRepository, refreshTokensRepository);

const toProfileResponse = (user: {
  id: string;
  name: string;
  email: string;
  status: "active" | "deleted";
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}) => {
  return UserProfileResponseSchema.parse({
    id: user.id,
    name: user.name,
    email: user.email,
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
  });
};

export const registerUsersRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/users/me", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = request.authUser?.sub;

      if (!userId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const user = await usersService.getProfile(userId);
      const response = toProfileResponse(user);

      return reply.code(200).send(response);
    } catch (error: unknown) {
      if (error instanceof ProfileNotFoundError) {
        return reply.code(404).send({ message: "Profile not found" });
      }

      throw error;
    }
  });

  app.patch("/users/me", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = request.authUser?.sub;

      if (!userId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const payload = UpdateProfileRequestSchema.parse(request.body);
      const user = await usersService.updateProfile(userId, payload);
      const response = toProfileResponse(user);

      return reply.code(200).send(response);
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

      if (error instanceof ProfileNotFoundError) {
        return reply.code(404).send({ message: "Profile not found" });
      }

      if (error instanceof DuplicateEmailError) {
        return reply.code(409).send({ message: "Email already in use" });
      }

      throw error;
    }
  });

  app.delete("/users/me", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = request.authUser?.sub;

      if (!userId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      await usersService.deleteProfile(userId);
      return reply.code(204).send();
    } catch (error: unknown) {
      if (error instanceof ProfileNotFoundError) {
        return reply.code(404).send({ message: "Profile not found" });
      }

      throw error;
    }
  });
};
