import type { PropertyType } from "../filters/filters.types";

export type SavedPropertyListSortBy = "savedAt" | "price" | "lastSeenAt";
export type SavedPropertyListSortOrder = "asc" | "desc";

export type SavedPropertyRecord = {
  id: string;
  userId: string;
  propertyId: string;
  createdAt: Date;
};

export type SavedProperty = {
  id: string;
  userId: string;
  propertyId: string;
  savedAt: Date;
  property: {
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
    status: "active" | "inactive";
    lastSeenAt: Date;
  };
};

export type SavedPropertyListOptions = {
  limit: number;
  offset: number;
  sortBy: SavedPropertyListSortBy;
  sortOrder: SavedPropertyListSortOrder;
};

export type SavePropertyResult = {
  item: SavedProperty;
  created: boolean;
};
