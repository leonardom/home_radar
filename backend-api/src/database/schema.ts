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
  name: varchar("name", { length: 120 }).notNull().default("User"),
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

export const syncDeadLettersTable = pgTable(
  "sync_dead_letters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    syncKey: varchar("sync_key", { length: 120 }).notNull(),
    source: varchar("source", { length: 100 }),
    externalListingId: varchar("external_listing_id", { length: 255 }),
    payload: text("payload").notNull(),
    errorMessage: text("error_message").notNull(),
    failedAt: timestamp("failed_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    syncKeyIdx: index("sync_dead_letters_sync_key_idx").on(table.syncKey),
    failedAtIdx: index("sync_dead_letters_failed_at_idx").on(table.failedAt),
  }),
);

export const matchesTable = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    propertyId: uuid("property_id")
      .notNull()
      .references(() => propertiesTable.id, { onDelete: "cascade" }),
    filterId: uuid("filter_id").references(() => searchFiltersTable.id, { onDelete: "set null" }),
    matchReasons: text("match_reasons").array().notNull().default([]),
    matchedAt: timestamp("matched_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    userPropertyUnique: uniqueIndex("matches_user_property_unique").on(
      table.userId,
      table.propertyId,
    ),
    userIdIdx: index("matches_user_id_idx").on(table.userId),
    propertyIdIdx: index("matches_property_id_idx").on(table.propertyId),
    filterIdIdx: index("matches_filter_id_idx").on(table.filterId),
    matchedAtIdx: index("matches_matched_at_idx").on(table.matchedAt),
  }),
);

export const notificationPreferencesTable = pgTable(
  "notification_preferences",
  {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    mode: varchar("mode", { length: 20 }).notNull().default("instant"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    modeIdx: index("notification_preferences_mode_idx").on(table.mode),
  }),
);

export const notificationsTable = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    matchId: uuid("match_id")
      .notNull()
      .references(() => matchesTable.id, { onDelete: "cascade" }),
    channel: varchar("channel", { length: 20 }).notNull().default("email"),
    subject: varchar("subject", { length: 255 }).notNull(),
    body: text("body").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    failureReason: text("failure_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    matchChannelUnique: uniqueIndex("notifications_match_channel_unique").on(
      table.matchId,
      table.channel,
    ),
    userIdIdx: index("notifications_user_id_idx").on(table.userId),
    statusIdx: index("notifications_status_idx").on(table.status),
    createdAtIdx: index("notifications_created_at_idx").on(table.createdAt),
  }),
);
