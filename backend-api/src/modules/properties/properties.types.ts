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
  external_listing_id?: string | null;
  department?: string | null;
  source?: string | null;
  title?: string | null;
  region?: string | null;
  price?: string | number | null;
  price_value?: string | number | null;
  bedrooms?: string | number | null;
  beds?: string | number | null;
  bathrooms?: string | number | null;
  baths?: string | number | null;
  location?: string | null;
  property_type?: string | null;
  propertyType?: string | null;
  url?: string | null;
  listing_url?: string | null;
  scraped_at?: string | Date | null;
  status?: string | null;
  created_at?: string | Date | null;
  updated_at?: string | Date | null;
  first_seen_at?: string | Date | null;
  last_seen_at?: string | Date | null;
};

export type ScraperListingsSyncContract = {
  required: Array<"source" | "listing_url" | "updated_at">;
  optional: Array<
    | "title"
    | "region"
    | "status"
    | "price_value"
    | "beds"
    | "baths"
    | "property_type"
    | "created_at"
    | "last_seen_at"
    | "scraped_at"
  >;
  defaults: {
    status: PropertyStatus;
    source: string;
  };
};
