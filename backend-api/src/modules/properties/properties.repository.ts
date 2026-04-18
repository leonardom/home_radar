import { and, eq, gte, ilike, inArray, lte, ne } from "drizzle-orm";

import { db } from "../../config/db";
import { propertiesTable } from "../../database/schema";
import type { SearchFilter } from "../filters/filters.types";
import type { PropertyCandidate } from "../matching/matching.types";
import type { Property, UpsertPropertyInput } from "./properties.types";

const mapProperty = (row: typeof propertiesTable.$inferSelect): Property => {
  return {
    id: row.id,
    source: row.source,
    externalListingId: row.externalListingId,
    title: row.title,
    price: row.price,
    bedrooms: row.bedrooms,
    bathrooms: row.bathrooms,
    location: row.location,
    propertyType: row.propertyType as Property["propertyType"],
    url: row.url,
    firstSeenAt: row.firstSeenAt,
    lastSeenAt: row.lastSeenAt,
    status: row.status as Property["status"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

const mapPropertyCandidate = (row: typeof propertiesTable.$inferSelect): PropertyCandidate => {
  return {
    id: row.id,
    price: row.price,
    bedrooms: row.bedrooms,
    location: row.location,
    description: row.title,
    propertyType: row.propertyType as PropertyCandidate["propertyType"],
  };
};

export class PropertiesRepository {
  async upsertProperty(input: UpsertPropertyInput): Promise<Property> {
    const property = await db
      .insert(propertiesTable)
      .values({
        source: input.source,
        externalListingId: input.externalListingId,
        title: input.title,
        price: input.price,
        bedrooms: input.bedrooms,
        bathrooms: input.bathrooms,
        location: input.location,
        propertyType: input.propertyType,
        url: input.url,
        firstSeenAt: input.firstSeenAt,
        lastSeenAt: input.lastSeenAt,
        status: input.status,
      })
      .onConflictDoUpdate({
        target: [propertiesTable.source, propertiesTable.externalListingId],
        set: {
          title: input.title,
          price: input.price,
          bedrooms: input.bedrooms,
          bathrooms: input.bathrooms,
          location: input.location,
          propertyType: input.propertyType,
          url: input.url,
          firstSeenAt: input.firstSeenAt,
          lastSeenAt: input.lastSeenAt,
          status: input.status,
          updatedAt: new Date(),
        },
      })
      .returning()
      .then((rows) => rows.at(0));

    if (!property) {
      throw new Error("Failed to upsert property");
    }

    return mapProperty(property);
  }

  async findBySourceIdentity(source: string, externalListingId: string): Promise<Property | null> {
    const property = await db
      .select()
      .from(propertiesTable)
      .where(
        and(
          eq(propertiesTable.source, source),
          eq(propertiesTable.externalListingId, externalListingId),
        ),
      )
      .then((rows) => rows.at(0) ?? null);

    return property ? mapProperty(property) : null;
  }

  async findPropertyById(propertyId: string): Promise<PropertyCandidate | null> {
    const row = await db
      .select()
      .from(propertiesTable)
      .where(and(eq(propertiesTable.id, propertyId), eq(propertiesTable.status, "active")))
      .then((rows) => rows.at(0) ?? null);

    return row ? mapPropertyCandidate(row) : null;
  }

  async findCandidatePropertiesForFilter(filter: SearchFilter): Promise<PropertyCandidate[]> {
    const clauses = [eq(propertiesTable.status, "active")];

    if (filter.priceMin != null) {
      clauses.push(gte(propertiesTable.price, filter.priceMin));
    }

    if (filter.priceMax != null) {
      clauses.push(lte(propertiesTable.price, filter.priceMax));
    }

    if (filter.bedroomsMin != null) {
      clauses.push(gte(propertiesTable.bedrooms, filter.bedroomsMin));
    }

    if (filter.location != null) {
      clauses.push(ilike(propertiesTable.location, `%${filter.location}%`));
    }

    if (filter.propertyType != null) {
      clauses.push(eq(propertiesTable.propertyType, filter.propertyType));
    }

    const rows = await db
      .select()
      .from(propertiesTable)
      .where(and(...clauses));

    return rows.map(mapPropertyCandidate);
  }

  async markInactiveMissingForSource(
    source: string,
    seenExternalListingIds: string[],
    now: Date = new Date(),
  ): Promise<number> {
    if (seenExternalListingIds.length === 0) {
      const rows = await db
        .update(propertiesTable)
        .set({ status: "inactive", updatedAt: now })
        .where(and(eq(propertiesTable.source, source), ne(propertiesTable.status, "inactive")))
        .returning({ id: propertiesTable.id });

      return rows.length;
    }

    const activeRows = await db
      .select({ id: propertiesTable.id })
      .from(propertiesTable)
      .where(and(eq(propertiesTable.source, source), eq(propertiesTable.status, "active")));

    const activeIds = activeRows.map((row) => row.id);
    if (activeIds.length === 0) {
      return 0;
    }

    const keepRows = await db
      .select({ id: propertiesTable.id })
      .from(propertiesTable)
      .where(
        and(
          eq(propertiesTable.source, source),
          inArray(propertiesTable.externalListingId, seenExternalListingIds),
        ),
      );

    const keepIdSet = new Set(keepRows.map((row) => row.id));
    const deactivateIds = activeIds.filter((id) => !keepIdSet.has(id));

    if (deactivateIds.length === 0) {
      return 0;
    }

    const updated = await db
      .update(propertiesTable)
      .set({ status: "inactive", updatedAt: now })
      .where(inArray(propertiesTable.id, deactivateIds))
      .returning({ id: propertiesTable.id });

    return updated.length;
  }
}
