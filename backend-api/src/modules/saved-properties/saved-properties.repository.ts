import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "../../config/db";
import { propertiesTable, savedPropertiesTable } from "../../database/schema";
import type {
  SavePropertyResult,
  SavedProperty,
  SavedPropertyListOptions,
  SavedPropertyRecord,
} from "./saved-properties.types";

const mapSavedPropertyRecord = (
  row: typeof savedPropertiesTable.$inferSelect,
): SavedPropertyRecord => {
  return {
    id: row.id,
    userId: row.userId,
    propertyId: row.propertyId,
    createdAt: row.createdAt,
  };
};

const toSavedProperty = (
  saved: SavedPropertyRecord,
  property: typeof propertiesTable.$inferSelect,
): SavedProperty => {
  return {
    id: saved.id,
    userId: saved.userId,
    propertyId: saved.propertyId,
    savedAt: saved.createdAt,
    property: {
      id: property.id,
      source: property.source,
      externalListingId: property.externalListingId,
      title: property.title,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      location: property.location,
      propertyType: property.propertyType as SavedProperty["property"]["propertyType"],
      url: property.url,
      status: property.status as SavedProperty["property"]["status"],
      lastSeenAt: property.lastSeenAt,
    },
  };
};

const sortColumn = {
  savedAt: savedPropertiesTable.createdAt,
  price: propertiesTable.price,
  lastSeenAt: propertiesTable.lastSeenAt,
} as const;

export class SavedPropertiesRepository {
  async saveProperty(userId: string, propertyId: string): Promise<SavePropertyResult | null> {
    const inserted = await db
      .insert(savedPropertiesTable)
      .values({
        userId,
        propertyId,
      })
      .onConflictDoNothing({
        target: [savedPropertiesTable.userId, savedPropertiesTable.propertyId],
      })
      .returning()
      .then((rows) => rows.at(0) ?? null);

    const saved = inserted
      ? mapSavedPropertyRecord(inserted)
      : await this.findSavedRecordByUserAndProperty(userId, propertyId);

    if (!saved) {
      return null;
    }

    const property = await this.findPropertyById(saved.propertyId);
    if (!property) {
      return null;
    }

    return {
      item: toSavedProperty(saved, property),
      created: inserted !== null,
    };
  }

  async listSavedByUser(
    userId: string,
    options: SavedPropertyListOptions,
  ): Promise<SavedProperty[]> {
    const orderByColumn = sortColumn[options.sortBy];
    const direction = options.sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn);

    const rows = await db
      .select({
        saved: savedPropertiesTable,
        property: propertiesTable,
      })
      .from(savedPropertiesTable)
      .innerJoin(propertiesTable, eq(savedPropertiesTable.propertyId, propertiesTable.id))
      .where(eq(savedPropertiesTable.userId, userId))
      .orderBy(direction, desc(savedPropertiesTable.createdAt))
      .limit(options.limit)
      .offset(options.offset);

    return rows.map((row) => toSavedProperty(mapSavedPropertyRecord(row.saved), row.property));
  }

  async removeSavedByUserAndProperty(userId: string, propertyId: string): Promise<boolean> {
    const deleted = await db
      .delete(savedPropertiesTable)
      .where(
        and(
          eq(savedPropertiesTable.userId, userId),
          eq(savedPropertiesTable.propertyId, propertyId),
        ),
      )
      .returning({ id: savedPropertiesTable.id })
      .then((rows) => rows.at(0) ?? null);

    return deleted !== null;
  }

  async isSavedByUser(userId: string, propertyId: string): Promise<boolean> {
    const row = await this.findSavedRecordByUserAndProperty(userId, propertyId);
    return row !== null;
  }

  async propertyExists(propertyId: string): Promise<boolean> {
    const row = await db
      .select({ exists: sql<number>`1` })
      .from(propertiesTable)
      .where(eq(propertiesTable.id, propertyId))
      .limit(1)
      .then((rows) => rows.at(0) ?? null);

    return row !== null;
  }

  private async findSavedRecordByUserAndProperty(
    userId: string,
    propertyId: string,
  ): Promise<SavedPropertyRecord | null> {
    const row = await db
      .select()
      .from(savedPropertiesTable)
      .where(
        and(
          eq(savedPropertiesTable.userId, userId),
          eq(savedPropertiesTable.propertyId, propertyId),
        ),
      )
      .limit(1)
      .then((rows) => rows.at(0) ?? null);

    return row ? mapSavedPropertyRecord(row) : null;
  }

  private async findPropertyById(
    propertyId: string,
  ): Promise<typeof propertiesTable.$inferSelect | null> {
    return db
      .select()
      .from(propertiesTable)
      .where(eq(propertiesTable.id, propertyId))
      .limit(1)
      .then((rows) => rows.at(0) ?? null);
  }
}
