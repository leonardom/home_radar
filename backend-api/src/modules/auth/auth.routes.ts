import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { AuthService } from "./auth.service";
import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  OAuthIdentityEmailRequiredError,
  OAuthInvalidStateNonceError,
  OAuthRateLimitExceededError,
  OAuthReplayDetectedError,
} from "./auth.errors";
import { oauthRateLimitService } from "./oauth-rate-limit.service";
import { AuthIdentityService, ProviderIdentityConflictError } from "./auth-identity.service";
import { ClerkTokenAdapter, ClerkTokenValidationError } from "./clerk-token.adapter";
import { oauthReplayProtectionService } from "./oauth-security.service";
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
  OAuthLoginRequestSchema,
  RefreshRequestSchema,
} from "./token.schemas";
import { TokenService } from "./token.service";
import { UserIdentitiesRepository } from "./user-identities.repository";

const usersRepository = new UsersRepository();
const userIdentitiesRepository = new UserIdentitiesRepository();
const passwordService = new PasswordService();
const tokenService = new TokenService();
const refreshTokensRepository = new RefreshTokensRepository();
const clerkTokenAdapter = new ClerkTokenAdapter();
const authIdentityService = new AuthIdentityService(usersRepository, userIdentitiesRepository);
const registerService = new RegisterService(usersRepository, passwordService);
const authService = new AuthService(
  usersRepository,
  passwordService,
  tokenService,
  refreshTokensRepository,
  userIdentitiesRepository,
  clerkTokenAdapter,
  authIdentityService,
);

export const registerAuthRoutes = async (app: FastifyInstance): Promise<void> => {
  const resolveClientIdentifier = (
    forwardedFor: string | string[] | undefined,
    ip: string,
  ): string => {
    if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
      return forwardedFor.split(",")[0]?.trim() || ip;
    }

    return ip;
  };

  app.post("/auth/register", async (request, reply) => {
    try {
      const payload = RegisterRequestSchema.parse(request.body);
      const user = await registerService.register(payload);

      const safeResponse = RegisterResponseSchema.parse({
        id: user.id,
        name: user.name,
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
      const subject = tokenService.verifyAccessToken(tokens.accessToken).sub;
      request.log.info(
        {
          event: "auth.login.success",
          method: "password",
          userId: subject,
        },
        "Auth method used",
      );
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
        request.log.warn(
          {
            event: "auth.login.failed",
            method: "password",
            reason: "invalid_credentials",
          },
          "Auth method failed",
        );
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

  app.post("/auth/oauth", async (request, reply) => {
    try {
      const payload = OAuthLoginRequestSchema.parse(request.body);
      const clientIdentifier = resolveClientIdentifier(
        request.headers["x-forwarded-for"],
        request.ip,
      );
      oauthRateLimitService.checkAndConsume("oauth-login", clientIdentifier);
      oauthReplayProtectionService.registerAttempt({
        scope: "login",
        provider: payload.provider,
        sessionToken: payload.sessionToken,
        state: payload.state,
        nonce: payload.nonce,
      });
      const tokens = await authService.oauthLogin(payload);
      const subject = tokenService.verifyAccessToken(tokens.accessToken).sub;
      request.log.info(
        {
          event: "auth.login.success",
          method: payload.provider,
          userId: subject,
        },
        "Auth method used",
      );
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

      if (error instanceof ClerkTokenValidationError) {
        request.log.warn(
          {
            event: "auth.login.failed",
            method: "oauth",
            reason: "invalid_oauth_token",
          },
          "Auth method failed",
        );
        return reply.code(401).send({ message: "Invalid OAuth session token" });
      }

      if (error instanceof OAuthIdentityEmailRequiredError) {
        request.log.warn(
          {
            event: "auth.login.failed",
            method: "oauth",
            reason: "missing_or_unverified_email",
          },
          "Auth method failed",
        );
        return reply.code(400).send({ message: "A verified email is required for OAuth login" });
      }

      if (error instanceof OAuthInvalidStateNonceError) {
        return reply.code(400).send({ message: "Invalid OAuth state or nonce" });
      }

      if (error instanceof OAuthReplayDetectedError) {
        request.log.warn(
          {
            event: "auth.login.failed",
            method: "oauth",
            reason: "replay_detected",
          },
          "Auth method failed",
        );
        return reply.code(409).send({ message: "OAuth replay detected" });
      }

      if (error instanceof OAuthRateLimitExceededError) {
        request.log.warn(
          {
            event: "auth.login.failed",
            method: "oauth",
            reason: "rate_limited",
          },
          "Auth method failed",
        );
        return reply.code(429).send({ message: "Too many OAuth attempts, please retry later" });
      }

      if (error instanceof ProviderIdentityConflictError) {
        return reply.code(409).send({ message: "OAuth identity already linked to another user" });
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
