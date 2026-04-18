import type { PropertyType } from "../filters/filters.types";
import type { ScraperListing, UpsertPropertyInput } from "./properties.types";

const KNOWN_PROPERTY_TYPES: PropertyType[] = [
  "apartment",
  "house",
  "bungalow",
  "land",
  "commercial",
  "other",
];

const parseDate = (value: string | Date | null | undefined, fallback: Date): Date => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return fallback;
};

const parseNullableInt = (value: string | number | null | undefined): number | null => {
  if (value == null) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.trunc(value) : null;
  }

  const digitsOnly = value.replace(/[^0-9.-]/g, "");
  if (digitsOnly.length === 0) {
    return null;
  }

  const parsed = Number(digitsOnly);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
};

const normalizePropertyType = (value: string | null | undefined): PropertyType | null => {
  if (value == null) {
    return null;
  }

  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return null;
  }

  if (KNOWN_PROPERTY_TYPES.includes(normalized as PropertyType)) {
    return normalized as PropertyType;
  }

  return "other";
};

const normalizeStatus = (value: string | null | undefined): UpsertPropertyInput["status"] => {
  if (!value) {
    return "active";
  }

  const normalized = value.trim().toLowerCase();
  if (["inactive", "removed", "deleted", "unavailable", "offmarket"].includes(normalized)) {
    return "inactive";
  }

  return "active";
};

const normalizeText = (value: string | null | undefined): string | null => {
  if (value == null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
};

export const mapScraperListingToUpsertProperty = (
  listing: ScraperListing,
  defaultSource?: string,
  now: Date = new Date(),
): UpsertPropertyInput => {
  const externalListingId =
    normalizeText(listing.external_listing_id) ??
    normalizeText(listing.listing_url) ??
    String(listing.id ?? "").trim();
  if (externalListingId.length === 0) {
    throw new Error("Listing external identity is required to map property");
  }

  const source = normalizeText(listing.source) ?? normalizeText(defaultSource);
  if (!source) {
    throw new Error("Listing source is required to map property");
  }

  const title = normalizeText(listing.title) ?? `Listing ${externalListingId}`;
  const location = normalizeText(listing.location) ?? normalizeText(listing.region);
  const url = normalizeText(listing.url) ?? normalizeText(listing.listing_url);

  return {
    source,
    externalListingId,
    title,
    price: parseNullableInt(listing.price_value ?? listing.price),
    bedrooms: parseNullableInt(listing.bedrooms ?? listing.beds),
    bathrooms: parseNullableInt(listing.bathrooms ?? listing.baths),
    location,
    propertyType: normalizePropertyType(listing.propertyType ?? listing.property_type),
    url,
    firstSeenAt: parseDate(
      listing.first_seen_at ?? listing.created_at ?? listing.scraped_at ?? null,
      now,
    ),
    lastSeenAt: parseDate(
      listing.last_seen_at ?? listing.updated_at ?? listing.scraped_at ?? null,
      now,
    ),
    status: normalizeStatus(listing.status),
  };
};
