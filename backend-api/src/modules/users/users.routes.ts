import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { ClerkTokenAdapter, ClerkTokenValidationError } from "../auth/clerk-token.adapter";
import {
  OAuthInvalidStateNonceError,
  OAuthRateLimitExceededError,
  OAuthReplayDetectedError,
} from "../auth/auth.errors";
import { requireAuth } from "../auth/auth.middleware";
import { oauthRateLimitService } from "../auth/oauth-rate-limit.service";
import { oauthReplayProtectionService } from "../auth/oauth-security.service";
import { RefreshTokensRepository } from "../auth/refresh-tokens.repository";
import { UserIdentitiesRepository } from "../auth/user-identities.repository";
import type { AuthProvider, SocialAuthProvider } from "../auth/user-identities.types";
import { DuplicateEmailError, ProfileNotFoundError } from "./users.errors";
import { UsersRepository } from "./users.repository";
import {
  LinkAuthProviderRequestSchema,
  UnlinkAuthProviderParamsSchema,
  UpdateProfileRequestSchema,
  UserAuthProvidersResponseSchema,
  UserProfileResponseSchema,
} from "./users.schemas";
import { UsersService } from "./users.service";

const usersRepository = new UsersRepository();
const refreshTokensRepository = new RefreshTokensRepository();
const userIdentitiesRepository = new UserIdentitiesRepository();
const clerkTokenAdapter = new ClerkTokenAdapter();
const usersService = new UsersService(usersRepository, refreshTokensRepository);

const resolveLinkedProviders = (providers: AuthProvider[]): AuthProvider[] => {
  return Array.from(new Set(["password", ...providers]));
};

const toAuthProvidersResponse = (userId: string, providers: AuthProvider[]) => {
  return UserAuthProvidersResponseSchema.parse({
    userId,
    linkedProviders: resolveLinkedProviders(providers),
  });
};

const toProfileResponse = (
  user: {
    id: string;
    name: string;
    email: string;
    status: "active" | "deleted";
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  },
  linkedProviders: AuthProvider[],
) => {
  return UserProfileResponseSchema.parse({
    id: user.id,
    name: user.name,
    email: user.email,
    linkedProviders: resolveLinkedProviders(linkedProviders),
    status: user.status,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    deletedAt: user.deletedAt ? user.deletedAt.toISOString() : null,
  });
};

export const registerUsersRoutes = async (app: FastifyInstance): Promise<void> => {
  const resolveClientIdentifier = (forwardedFor: string | string[] | undefined, ip: string): string => {
    if (typeof forwardedFor === "string" && forwardedFor.trim().length > 0) {
      return forwardedFor.split(",")[0]?.trim() || ip;
    }

    return ip;
  };

  app.get("/users/me", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = request.authUser?.sub;

      if (!userId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const user = await usersService.getProfile(userId);
      const identities = await userIdentitiesRepository.listByUserId(userId);
      const response = toProfileResponse(
        user,
        identities.map((identity) => identity.provider),
      );

      return reply.code(200).send(response);
    } catch (error: unknown) {
      if (error instanceof ProfileNotFoundError) {
        return reply.code(404).send({ message: "Profile not found" });
      }

      throw error;
    }
  });

  app.get("/users/me/auth-providers", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.sub;

    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const identities = await userIdentitiesRepository.listByUserId(userId);
    const response = toAuthProvidersResponse(
      userId,
      identities.map((identity) => identity.provider),
    );

    return reply.code(200).send(response);
  });

  app.post("/users/me/auth-providers/link", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = request.authUser?.sub;

      if (!userId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const payload = LinkAuthProviderRequestSchema.parse(request.body);
      const user = await usersService.getProfile(userId);
      const clientIdentifier = resolveClientIdentifier(request.headers["x-forwarded-for"], request.ip);
      oauthRateLimitService.checkAndConsume("oauth-link", clientIdentifier);
      oauthReplayProtectionService.registerAttempt({
        scope: "link",
        provider: payload.provider,
        sessionToken: payload.sessionToken,
        state: payload.state,
        nonce: payload.nonce,
        userId,
      });
      const identity = await clerkTokenAdapter.verifySessionToken(payload.sessionToken, payload.provider);

      if (!identity.email || !identity.emailVerified) {
        return reply.code(400).send({ message: "A verified email is required to link providers" });
      }

      if (identity.email !== user.email.toLowerCase()) {
        return reply.code(409).send({ message: "OAuth identity email does not match current user" });
      }

      const linked = await userIdentitiesRepository.linkIdentity({
        userId,
        provider: payload.provider,
        providerUserId: identity.providerUserId,
        email: identity.email,
      });

      if (linked.userId !== userId) {
        request.log.warn(
          {
            event: "auth.provider.link.failed",
            userId,
            provider: payload.provider,
            reason: "linked_to_other_user",
          },
          "Auth provider link failed",
        );
        return reply.code(409).send({ message: "OAuth identity already linked to another user" });
      }

      const identities = await userIdentitiesRepository.listByUserId(userId);
      const response = toAuthProvidersResponse(
        userId,
        identities.map((item) => item.provider),
      );

      request.log.info(
        {
          event: "auth.provider.link.success",
          userId,
          provider: payload.provider,
        },
        "Auth provider linked",
      );

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

      if (error instanceof ClerkTokenValidationError) {
        return reply.code(401).send({ message: "Invalid OAuth session token" });
      }

      if (error instanceof ProfileNotFoundError) {
        return reply.code(404).send({ message: "Profile not found" });
      }

      if (error instanceof OAuthInvalidStateNonceError) {
        return reply.code(400).send({ message: "Invalid OAuth state or nonce" });
      }

      if (error instanceof OAuthReplayDetectedError) {
        request.log.warn(
          {
            event: "auth.provider.link.failed",
            userId: request.authUser?.sub ?? null,
            reason: "replay_detected",
          },
          "Auth provider link failed",
        );
        return reply.code(409).send({ message: "OAuth replay detected" });
      }

      if (error instanceof OAuthRateLimitExceededError) {
        request.log.warn(
          {
            event: "auth.provider.link.failed",
            userId: request.authUser?.sub ?? null,
            reason: "rate_limited",
          },
          "Auth provider link failed",
        );
        return reply.code(429).send({ message: "Too many OAuth attempts, please retry later" });
      }

      throw error;
    }
  });

  app.delete(
    "/users/me/auth-providers/:provider",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.authUser?.sub;

        if (!userId) {
          return reply.code(401).send({ message: "Unauthorized" });
        }

        const { provider } = UnlinkAuthProviderParamsSchema.parse(request.params) as {
          provider: SocialAuthProvider;
        };
        const identities = await userIdentitiesRepository.listByUserId(userId);
        const socialIdentities = identities.filter((identity) => identity.provider !== "password");
        const hasProvider = socialIdentities.some((identity) => identity.provider === provider);

        if (!hasProvider) {
          request.log.warn(
            {
              event: "auth.provider.unlink.failed",
              userId,
              provider,
              reason: "provider_not_found",
            },
            "Auth provider unlink failed",
          );
          return reply.code(404).send({ message: "Provider link not found" });
        }

        // Prevent account lockout by requiring at least one social provider to remain linked.
        if (socialIdentities.length <= 1) {
          request.log.warn(
            {
              event: "auth.provider.unlink.failed",
              userId,
              provider,
              reason: "last_provider_lockout",
            },
            "Auth provider unlink failed",
          );
          return reply.code(409).send({ message: "Cannot unlink the last authentication provider" });
        }

        await userIdentitiesRepository.unlinkIdentity(userId, provider);

        const updated = await userIdentitiesRepository.listByUserId(userId);
        const response = toAuthProvidersResponse(
          userId,
          updated.map((identity) => identity.provider),
        );

        request.log.info(
          {
            event: "auth.provider.unlink.success",
            userId,
            provider,
          },
          "Auth provider unlinked",
        );

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

        throw error;
      }
    },
  );

  app.patch("/users/me", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = request.authUser?.sub;

      if (!userId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const payload = UpdateProfileRequestSchema.parse(request.body);
      const user = await usersService.updateProfile(userId, payload);
      const identities = await userIdentitiesRepository.listByUserId(userId);
      const response = toProfileResponse(
        user,
        identities.map((identity) => identity.provider),
      );

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
