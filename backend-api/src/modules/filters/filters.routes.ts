import type { FastifyInstance } from "fastify";
import { ZodError } from "zod";

import { requireAuth } from "../auth/auth.middleware";
import { FilterNotFoundError, MinimumFiltersConstraintError } from "./filters.errors";
import { FiltersRepository } from "./filters.repository";
import {
  CreateFilterBodySchema,
  FilterListResponseSchema,
  FilterParamsSchema,
  FilterResponseSchema,
  UpdateFilterBodySchema,
} from "./filters.schemas";
import { FiltersService } from "./filters.service";
import type { SearchFilter } from "./filters.types";

const filtersRepository = new FiltersRepository();
const filtersService = new FiltersService(filtersRepository);

const toFilterResponse = (filter: SearchFilter) => {
  return FilterResponseSchema.parse({
    id: filter.id,
    priceMin: filter.priceMin,
    priceMax: filter.priceMax,
    bedroomsMin: filter.bedroomsMin,
    bedroomsMax: filter.bedroomsMax,
    bathroomsMin: filter.bathroomsMin,
    bathroomsMax: filter.bathroomsMax,
    location: filter.location,
    propertyType: filter.propertyType,
    keywords: filter.keywords,
    createdAt: filter.createdAt.toISOString(),
    updatedAt: filter.updatedAt.toISOString(),
  });
};

const asValidationError = (error: ZodError) => ({
  message: "Validation error",
  issues: error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  })),
});

export const registerFiltersRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post("/filters", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = request.authUser?.sub;
      if (!userId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const payload = CreateFilterBodySchema.parse(request.body);
      const filter = await filtersService.createFilter(userId, payload);
      const response = toFilterResponse(filter);

      return reply.code(201).send(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return reply.code(400).send(asValidationError(error));
      }

      throw error;
    }
  });

  app.get("/filters", { preHandler: requireAuth }, async (request, reply) => {
    const userId = request.authUser?.sub;
    if (!userId) {
      return reply.code(401).send({ message: "Unauthorized" });
    }

    const filters = await filtersService.listFilters(userId);
    const response = FilterListResponseSchema.parse({
      items: filters.map(toFilterResponse),
    });

    return reply.code(200).send(response);
  });

  app.patch("/filters/:id", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = request.authUser?.sub;
      if (!userId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const params = FilterParamsSchema.parse(request.params);
      const payload = UpdateFilterBodySchema.parse(request.body);

      const updated = await filtersService.updateFilter(userId, params.id, payload);
      const response = toFilterResponse(updated);

      return reply.code(200).send(response);
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return reply.code(400).send(asValidationError(error));
      }

      if (error instanceof FilterNotFoundError) {
        return reply.code(404).send({ message: "Filter not found" });
      }

      throw error;
    }
  });

  app.delete("/filters/:id", { preHandler: requireAuth }, async (request, reply) => {
    try {
      const userId = request.authUser?.sub;
      if (!userId) {
        return reply.code(401).send({ message: "Unauthorized" });
      }

      const params = FilterParamsSchema.parse(request.params);
      await filtersService.deleteFilter(userId, params.id);

      return reply.code(204).send();
    } catch (error: unknown) {
      if (error instanceof ZodError) {
        return reply.code(400).send(asValidationError(error));
      }

      if (error instanceof FilterNotFoundError) {
        return reply.code(404).send({ message: "Filter not found" });
      }

      if (error instanceof MinimumFiltersConstraintError) {
        return reply.code(409).send({ message: "At least one filter must be kept" });
      }

      throw error;
    }
  });
};
