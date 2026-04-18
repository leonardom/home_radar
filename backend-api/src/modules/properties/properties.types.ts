import type { PropertyType } from "../filters/filters.types";

export type PropertyStatus = "active" | "inactive";

export type Property = {
  id: string;
  source: string;
  externalListingId: string;
  title: string;
  price: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  location: string | null;
  propertyType: PropertyType | null;
  url: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  status: PropertyStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type UpsertPropertyInput = Omit<Property, "id" | "createdAt" | "updatedAt">;

export type ScraperListing = {
  id: string | number;
  source?: string | null;
  title?: string | null;
  price?: string | number | null;
  bedrooms?: string | number | null;
  bathrooms?: string | number | null;
  location?: string | null;
  property_type?: string | null;
  propertyType?: string | null;
  url?: string | null;
  listing_url?: string | null;
  status?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  first_seen_at?: string | Date | null;
  last_seen_at?: string | Date | null;
};
