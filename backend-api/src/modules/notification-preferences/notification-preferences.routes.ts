import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { requireAuth } from "../auth/auth.middleware";
import {
  NotificationPreferenceResponseSchema,
  UpdateNotificationPreferenceRequestSchema,
} from "./notification-preferences.schemas";
import { NotificationPreferencesRepository } from "./notification-preferences.repository";
import { NotificationPreferencesService } from "./notification-preferences.service";

const notificationPreferencesRepository = new NotificationPreferencesRepository();
const notificationPreferencesService = new NotificationPreferencesService(
  notificationPreferencesRepository,
);

const toResponse = (preference: {
  userId: string;
  mode: "instant" | "digest";
  createdAt: Date;
  updatedAt: Date;
}) => {
  return NotificationPreferenceResponseSchema.parse({
    userId: preference.userId,
    mode: preference.mode,
    createdAt: preference.createdAt.toISOString(),
    updatedAt: preference.updatedAt.toISOString(),
  });
};

const asValidationError = (error: ZodError) => ({
  message: "Validation error",
  issues: error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  })),
});

export const registerNotificationPreferencesRoutes = async (
  app: FastifyInstance,
): Promise<void> => {
  app.get("/users/me/preferences", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.sub;

    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const preference = await notificationPreferencesService.getUserPreference(userId);
    return reply.code(200).send(toResponse(preference));
  });

  app.patch("/users/me/preferences", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = request.authUser?.sub;

      if (!userId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const payload = UpdateNotificationPreferenceRequestSchema.parse(request.body);
      const updated = await notificationPreferencesService.updateUserPreference(
        userId,
        payload.mode,
      );

      return reply.code(200).send(toResponse(updated));
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return reply.code(400).send(asValidationError(error));
      }

      throw error;
    }
  });
};
