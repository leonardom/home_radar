import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const refreshTokensTable = pgTable("refresh_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const searchFiltersTable = pgTable("search_filters", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  priceMin: integer("price_min"),
  priceMax: integer("price_max"),
  bedroomsMin: integer("bedrooms_min"),
  bedroomsMax: integer("bedrooms_max"),
  bathroomsMin: integer("bathrooms_min"),
  bathroomsMax: integer("bathrooms_max"),
  location: varchar("location", { length: 255 }),
  propertyType: varchar("property_type", { length: 50 }),
  keywords: text("keywords").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const propertiesTable = pgTable(
  "properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: varchar("source", { length: 100 }).notNull(),
    externalListingId: varchar("external_listing_id", { length: 255 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    price: integer("price"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    location: varchar("location", { length: 255 }),
    propertyType: varchar("property_type", { length: 50 }),
    url: text("url"),
    firstSeenAt: timestamp("first_seen_at", { withTimezone: true }).defaultNow().notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    sourceExternalListingIdUnique: uniqueIndex("properties_source_external_listing_id_unique").on(
      table.source,
      table.externalListingId,
    ),
    statusIdx: index("properties_status_idx").on(table.status),
    priceIdx: index("properties_price_idx").on(table.price),
    bedroomsIdx: index("properties_bedrooms_idx").on(table.bedrooms),
    locationIdx: index("properties_location_idx").on(table.location),
    propertyTypeIdx: index("properties_property_type_idx").on(table.propertyType),
    lastSeenAtIdx: index("properties_last_seen_at_idx").on(table.lastSeenAt),
  }),
);

export const syncStateTable = pgTable(
  "sync_state",
  {
    key: varchar("key", { length: 120 }).primaryKey(),
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    lastSyncAtIdx: index("sync_state_last_sync_at_idx").on(table.lastSyncAt),
  }),
);
