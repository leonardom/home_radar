import type { SearchFilter } from "../filters/filters.types";

export type MatchReason =
  | "price_range"
  | "minimum_bedrooms"
  | "location"
  | "keywords"
  | "property_type";

export type PropertyCandidate = {
  id: string;
  price: number;
  bedrooms: number;
  location: string;
  description: string;
  propertyType?: SearchFilter["propertyType"];
};

export type PropertyFilterMatch = {
  propertyId: string;
  filterId: string;
  userId: string;
  matchReason: MatchReason[];
  matchedAt: Date;
};
