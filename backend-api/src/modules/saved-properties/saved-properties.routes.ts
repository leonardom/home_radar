import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { requireAuth } from "../auth/auth.middleware";
import {
  SavePropertyTargetNotFoundError,
  SavedPropertyNotFoundError,
} from "./saved-properties.errors";
import { SavedPropertiesRepository } from "./saved-properties.repository";
import {
  SavePropertyBodySchema,
  SavedPropertyListQuerySchema,
  SavedPropertyListResponseSchema,
  SavedPropertyParamsSchema,
  SavedPropertyResponseSchema,
} from "./saved-properties.schemas";
import { SavedPropertiesService } from "./saved-properties.service";
import type { SavedProperty } from "./saved-properties.types";

const savedPropertiesRepository = new SavedPropertiesRepository();
const savedPropertiesService = new SavedPropertiesService(savedPropertiesRepository);

const asValidationError = (error: ZodError) => ({
  message: "Validation error",
  issues: error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  })),
});

const toResponseItem = (item: SavedProperty) => {
  return SavedPropertyResponseSchema.parse({
    id: item.id,
    userId: item.userId,
    propertyId: item.propertyId,
    savedAt: item.savedAt.toISOString(),
    property: {
      id: item.property.id,
      source: item.property.source,
      externalListingId: item.property.externalListingId,
      title: item.property.title,
      price: item.property.price,
      bedrooms: item.property.bedrooms,
      bathrooms: item.property.bathrooms,
      location: item.property.location,
      propertyType: item.property.propertyType,
      url: item.property.url,
      status: item.property.status,
      lastSeenAt: item.property.lastSeenAt.toISOString(),
    },
  });
};

export const registerSavedPropertiesRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post("/saved-properties", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = request.authUser?.sub;
      if (!userId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const payload = SavePropertyBodySchema.parse(request.body);
      const result = await savedPropertiesService.saveProperty(userId, payload);
      const response = toResponseItem(result.item);

      return reply.code(result.created ? 201 : 200).send(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return reply.code(400).send(asValidationError(error));
      }

      if (error instanceof SavePropertyTargetNotFoundError) {
        return reply.code(404).send({ message: "Property not found" });
      }

      throw error;
    }
  });

  app.get("/saved-properties", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = request.authUser?.sub;
      if (!userId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const query = SavedPropertyListQuerySchema.parse(request.query);
      const items = await savedPropertiesService.listSavedProperties(userId, query);
      const response = SavedPropertyListResponseSchema.parse({
        items: items.map(toResponseItem),
      });

      return reply.code(200).send(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return reply.code(400).send(asValidationError(error));
      }

      throw error;
    }
  });

  app.delete(
    "/saved-properties/:propertyId",
    { preHandler: requireAuth },
    async (request, reply) => {
      try {
        const userId = request.authUser?.sub;
        if (!userId) {
          return reply.code(401).send({ message: "Unauthorized" });
        }

        const params = SavedPropertyParamsSchema.parse(request.params);
        await savedPropertiesService.removeSavedProperty(userId, params.propertyId);

        return reply.code(204).send();
      } catch (error: unknown) {
        if (error instanceof ZodError) {
          return reply.code(400).send(asValidationError(error));
        }

        if (error instanceof SavedPropertyNotFoundError) {
          return reply.code(404).send({ message: "Saved property not found" });
        }

        throw error;
      }
    },
  );
};
