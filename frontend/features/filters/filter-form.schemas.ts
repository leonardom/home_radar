import { z } from "zod";

const propertyTypeSchema = z.enum([
  "apartment",
  "house",
  "bungalow",
  "land",
  "commercial",
  "other",
]);

const parseOptionalNullableInt = (value: unknown): number | null | undefined => {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === "") {
    return null;
  }

  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) {
    return Number.NaN;
  }

  return numericValue;
};

const optionalNullableIntSchema = z.preprocess(
  parseOptionalNullableInt,
  z.number().int().nonnegative().nullable().optional(),
);

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

export const createFilterFormSchema = z
  .object({
    priceMin: optionalNullableIntSchema,
    priceMax: optionalNullableIntSchema,
    bedroomsMin: optionalNullableIntSchema,
    bedroomsMax: optionalNullableIntSchema,
    bathroomsMin: optionalNullableIntSchema,
    bathroomsMax: optionalNullableIntSchema,
    location: z.string().trim().min(1).max(255).nullable().optional(),
    propertyType: propertyTypeSchema.nullable().optional(),
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

export const updateFilterFormSchema = z
  .object({
    priceMin: optionalNullableIntSchema,
    priceMax: optionalNullableIntSchema,
    bedroomsMin: optionalNullableIntSchema,
    bedroomsMax: optionalNullableIntSchema,
    bathroomsMin: optionalNullableIntSchema,
    bathroomsMax: optionalNullableIntSchema,
    location: z.string().trim().min(1).max(255).nullable().optional(),
    propertyType: propertyTypeSchema.nullable().optional(),
    keywords: z.array(z.string().trim().min(1).max(64)).max(20).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided",
  })
  .refine(validateRanges, {
    message: "Invalid numeric ranges",
  });

export type CreateFilterFormValues = z.infer<typeof createFilterFormSchema>;
export type UpdateFilterFormValues = z.infer<typeof updateFilterFormSchema>;
