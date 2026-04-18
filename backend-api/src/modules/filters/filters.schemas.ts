import { z } from "zod";

const OptionalNonNegativeInt = z.number().int().nonnegative().nullable().optional();

const PropertyTypeSchema = z.enum([
  "apartment",
  "house",
  "bungalow",
  "land",
  "commercial",
  "other",
]);

const validateRanges = <
  T extends {
    priceMin?: number | null;
    priceMax?: number | null;
    bedroomsMin?: number | null;
    bedroomsMax?: number | null;
    bathroomsMin?: number | null;
    bathroomsMax?: number | null;
  },
>(
  data: T,
): boolean => {
  if (data.priceMin != null && data.priceMax != null && data.priceMin > data.priceMax) {
    return false;
  }

  if (data.bedroomsMin != null && data.bedroomsMax != null && data.bedroomsMin > data.bedroomsMax) {
    return false;
  }

  if (
    data.bathroomsMin != null &&
    data.bathroomsMax != null &&
    data.bathroomsMin > data.bathroomsMax
  ) {
    return false;
  }

  return true;
};

export const CreateFilterBodySchema = z
  .object({
    priceMin: z.coerce.number().int().nonnegative().nullable().optional(),
    priceMax: z.coerce.number().int().nonnegative().nullable().optional(),
    bedroomsMin: z.coerce.number().int().nonnegative().nullable().optional(),
    bedroomsMax: z.coerce.number().int().nonnegative().nullable().optional(),
    bathroomsMin: z.coerce.number().int().nonnegative().nullable().optional(),
    bathroomsMax: z.coerce.number().int().nonnegative().nullable().optional(),
    location: z.string().trim().min(1).max(255).nullable().optional(),
    propertyType: PropertyTypeSchema.nullable().optional(),
    keywords: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
  })
  .refine(
    (data) =>
      data.priceMin != null ||
      data.priceMax != null ||
      data.bedroomsMin != null ||
      data.bedroomsMax != null ||
      data.bathroomsMin != null ||
      data.bathroomsMax != null ||
      data.location != null ||
      data.propertyType != null ||
      (data.keywords != null && data.keywords.length > 0),
    {
      message: "At least one filter field must be provided",
    },
  )
  .refine(validateRanges, {
    message: "Invalid numeric ranges",
  });

export const UpdateFilterBodySchema = z
  .object({
    priceMin: OptionalNonNegativeInt,
    priceMax: OptionalNonNegativeInt,
    bedroomsMin: OptionalNonNegativeInt,
    bedroomsMax: OptionalNonNegativeInt,
    bathroomsMin: OptionalNonNegativeInt,
    bathroomsMax: OptionalNonNegativeInt,
    location: z.string().trim().min(1).max(255).nullable().optional(),
    propertyType: PropertyTypeSchema.nullable().optional(),
    keywords: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(validateRanges, {
    message: "Invalid numeric ranges",
  });

export const FilterParamsSchema = z.object({
  id: z.uuid(),
});

export const FilterResponseSchema = z.object({
  id: z.uuid(),
  priceMin: z.number().int().nonnegative().nullable(),
  priceMax: z.number().int().nonnegative().nullable(),
  bedroomsMin: z.number().int().nonnegative().nullable(),
  bedroomsMax: z.number().int().nonnegative().nullable(),
  bathroomsMin: z.number().int().nonnegative().nullable(),
  bathroomsMax: z.number().int().nonnegative().nullable(),
  location: z.string().nullable(),
  propertyType: PropertyTypeSchema.nullable(),
  keywords: z.array(z.string()),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const FilterListResponseSchema = z.object({
  items: z.array(FilterResponseSchema),
});

export type CreateFilterBody = z.infer<typeof CreateFilterBodySchema>;
export type UpdateFilterBody = z.infer<typeof UpdateFilterBodySchema>;
export type FilterParams = z.infer<typeof FilterParamsSchema>;
