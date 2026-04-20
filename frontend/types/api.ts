export type IsoDateString = string;

export type AuthProvider = "password" | "google" | "facebook";
export type OAuthProvider = "google" | "facebook";

export type UserStatus = "active" | "deleted";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  linkedProviders: AuthProvider[];
  status: UserStatus;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  deletedAt: IsoDateString | null;
};

export type UpdateUserProfilePayload = {
  name?: string;
  email?: string;
};

export type UserAuthProviders = {
  userId: string;
  linkedProviders: AuthProvider[];
};

export type LinkAuthProviderPayload = {
  provider: OAuthProvider;
  sessionToken: string;
  state: string;
  nonce: string;
};

export type NotificationPreferenceMode = "instant" | "digest";

export type UserPreferences = {
  userId: string;
  mode: NotificationPreferenceMode;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type UpdateUserPreferencesPayload = {
  mode: NotificationPreferenceMode;
};

export type SearchFilter = {
  id: string;
  priceMin: number | null;
  priceMax: number | null;
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  bathroomsMin: number | null;
  bathroomsMax: number | null;
  location: string | null;
  propertyType: string | null;
  keywords: string[];
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
};

export type CreateFilterPayload = {
  priceMin?: number;
  priceMax?: number;
  bedroomsMin?: number;
  bedroomsMax?: number;
  bathroomsMin?: number;
  bathroomsMax?: number;
  location?: string;
  propertyType?: string;
  keywords?: string[];
};

export type UpdateFilterPayload = Partial<CreateFilterPayload>;

export type FiltersListResponse = {
  items: SearchFilter[];
};

export type MatchItem = {
  id: string;
  userId: string;
  propertyId: string;
  filterId: string;
  matchReasons: string[];
  matchedAt: IsoDateString;
  createdAt: IsoDateString;
};

export type MatchesListResponse = {
  items: MatchItem[];
};

export type PropertySummary = {
  id: string;
  source: string;
  externalListingId: string;
  title: string;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  location: string;
  propertyType: string;
  url: string;
  status: string;
  lastSeenAt: IsoDateString;
};

export type SavedProperty = {
  id: string;
  userId: string;
  propertyId: string;
  savedAt: IsoDateString;
  property: PropertySummary;
};

export type SavePropertyPayload = {
  propertyId: string;
};

export type SavedPropertiesSortBy = "savedAt" | "price" | "lastSeenAt";
export type SavedPropertiesSortOrder = "asc" | "desc";

export type ListSavedPropertiesParams = {
  limit?: number;
  offset?: number;
  sortBy?: SavedPropertiesSortBy;
  sortOrder?: SavedPropertiesSortOrder;
};

export type SavedPropertiesListResponse = {
  items: SavedProperty[];
};
