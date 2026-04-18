export type PropertyType = "apartment" | "house" | "bungalow" | "land" | "commercial" | "other";

export type SearchFilter = {
  id: string;
  userId: string;
  priceMin: number | null;
  priceMax: number | null;
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  bathroomsMin: number | null;
  bathroomsMax: number | null;
  location: string | null;
  propertyType: PropertyType | null;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
};

export type NewSearchFilter = Omit<SearchFilter, "id" | "createdAt" | "updatedAt">;
