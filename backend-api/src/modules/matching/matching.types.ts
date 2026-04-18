import type { SearchFilter } from "../filters/filters.types";

export type MatchReason =
  | "price_range"
  | "minimum_bedrooms"
  | "location"
  | "keywords"
  | "property_type";

export type PropertyCandidate = {
  id: string;
  price: number | null;
  bedrooms: number | null;
  location: string | null;
  description: string | null;
  propertyType?: SearchFilter["propertyType"];
};

export type PropertyFilterMatch = {
  propertyId: string;
  filterId: string;
  userId: string;
  matchReason: MatchReason[];
  matchedAt: Date;
};
