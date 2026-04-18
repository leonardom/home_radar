import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { AuthService } from "./auth.service";
import { InvalidCredentialsError, InvalidRefreshTokenError } from "./auth.errors";
import { RefreshTokensRepository } from "./refresh-tokens.repository";
import { DuplicateEmailError } from "../users/users.errors";
import { UsersRepository } from "../users/users.repository";
import { PasswordService } from "./password.service";
import { RegisterResponseSchema } from "./register.responses";
import { RegisterRequestSchema } from "./register.schemas";
import { RegisterService } from "./register.service";
import {
  AuthTokensResponseSchema,
  LoginRequestSchema,
  RefreshRequestSchema,
} from "./token.schemas";
import { TokenService } from "./token.service";

const usersRepository = new UsersRepository();
const passwordService = new PasswordService();
const tokenService = new TokenService();
const refreshTokensRepository = new RefreshTokensRepository();
const registerService = new RegisterService(usersRepository, passwordService);
const authService = new AuthService(
  usersRepository,
  passwordService,
  tokenService,
  refreshTokensRepository,
);

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

  app.post("/auth/login", async (request, reply) => {
    try {
      const payload = LoginRequestSchema.parse(request.body);
      const tokens = await authService.login(payload);
      const safeResponse = AuthTokensResponseSchema.parse(tokens);
      return reply.code(200).send(safeResponse);
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

      if (error instanceof InvalidCredentialsError) {
        return reply.code(401).send({ message: "Invalid credentials" });
      }

      throw error;
    }
  });

  app.post("/auth/refresh", async (request, reply) => {
    try {
      const payload = RefreshRequestSchema.parse(request.body);
      const tokens = await authService.refresh(payload.refreshToken);
      const safeResponse = AuthTokensResponseSchema.parse(tokens);
      return reply.code(200).send(safeResponse);
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

      if (error instanceof InvalidRefreshTokenError) {
        return reply.code(401).send({ message: "Invalid refresh token" });
      }

      throw error;
    }
  });

  app.post("/auth/logout", async (request, reply) => {
    try {
      const payload = RefreshRequestSchema.parse(request.body);
      await authService.logout(payload.refreshToken);
      return reply.code(204).send();
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

      throw error;
    }
  });
};
