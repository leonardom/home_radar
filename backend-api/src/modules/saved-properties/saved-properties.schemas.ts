import { z } from "zod";

export const SavePropertyBodySchema = z.object({
  propertyId: z.uuid(),
});

export const SavedPropertyParamsSchema = z.object({
  propertyId: z.uuid(),
});

export const SavedPropertyListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
  sortBy: z.enum(["savedAt", "price", "lastSeenAt"]).default("savedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const SavedPropertyResponseSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  propertyId: z.uuid(),
  savedAt: z.string().datetime(),
  property: z.object({
    id: z.uuid(),
    source: z.string().min(1),
    externalListingId: z.string().min(1),
    title: z.string().min(1),
    price: z.number().int().nullable(),
    bedrooms: z.number().int().nullable(),
    bathrooms: z.number().int().nullable(),
    location: z.string().nullable(),
    propertyType: z.enum(["house", "apartment", "land", "commercial", "other"]).nullable(),
    url: z.string().nullable(),
    status: z.enum(["active", "inactive"]),
    lastSeenAt: z.string().datetime(),
  }),
});

export const SavedPropertyListResponseSchema = z.object({
  items: z.array(SavedPropertyResponseSchema),
});

export type SavePropertyBody = z.infer<typeof SavePropertyBodySchema>;
export type SavedPropertyParams = z.infer<typeof SavedPropertyParamsSchema>;
export type SavedPropertyListQuery = z.infer<typeof SavedPropertyListQuerySchema>;
