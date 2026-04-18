import { and, eq } from "drizzle-orm";

import { db } from "../../config/db";
import { propertiesTable } from "../../database/schema";
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
}
