import { and, count, eq, gte, isNull, lte, or } from "drizzle-orm";

import { db } from "../../config/db";
import { searchFiltersTable } from "../../database/schema";
import type { CreateFilterBody, UpdateFilterBody } from "./filters.schemas";
import type { SearchFilter } from "./filters.types";
import type { PropertyCandidate } from "../matching/matching.types";

const mapFilter = (row: typeof searchFiltersTable.$inferSelect): SearchFilter => {
  return {
    id: row.id,
    userId: row.userId,
    priceMin: row.priceMin,
    priceMax: row.priceMax,
    bedroomsMin: row.bedroomsMin,
    bedroomsMax: row.bedroomsMax,
    bathroomsMin: row.bathroomsMin,
    bathroomsMax: row.bathroomsMax,
    location: row.location,
    propertyType: row.propertyType as SearchFilter["propertyType"],
    keywords: row.keywords,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
};

export class FiltersRepository {
  async createFilter(userId: string, payload: CreateFilterBody): Promise<SearchFilter> {
    const filter = await db
      .insert(searchFiltersTable)
      .values({
        userId,
        priceMin: payload.priceMin ?? null,
        priceMax: payload.priceMax ?? null,
        bedroomsMin: payload.bedroomsMin ?? null,
        bedroomsMax: payload.bedroomsMax ?? null,
        bathroomsMin: payload.bathroomsMin ?? null,
        bathroomsMax: payload.bathroomsMax ?? null,
        location: payload.location ?? null,
        propertyType: payload.propertyType ?? null,
        keywords: payload.keywords ?? [],
      })
      .returning()
      .then((rows) => rows.at(0));

    if (!filter) {
      throw new Error("Failed to create filter");
    }

    return mapFilter(filter);
  }

  async listFiltersByUser(userId: string): Promise<SearchFilter[]> {
    const rows = await db
      .select()
      .from(searchFiltersTable)
      .where(eq(searchFiltersTable.userId, userId));

    return rows.map(mapFilter);
  }

  async findFilterByIdForUser(filterId: string, userId: string): Promise<SearchFilter | null> {
    const row = await db
      .select()
      .from(searchFiltersTable)
      .where(and(eq(searchFiltersTable.id, filterId), eq(searchFiltersTable.userId, userId)))
      .then((rows) => rows.at(0) ?? null);

    return row ? mapFilter(row) : null;
  }

  async findCandidateFiltersForProperty(property: PropertyCandidate): Promise<SearchFilter[]> {
    const clauses = [
      or(isNull(searchFiltersTable.priceMin), lte(searchFiltersTable.priceMin, property.price)),
      or(isNull(searchFiltersTable.priceMax), gte(searchFiltersTable.priceMax, property.price)),
      or(
        isNull(searchFiltersTable.bedroomsMin),
        lte(searchFiltersTable.bedroomsMin, property.bedrooms),
      ),
    ];

    if (property.propertyType != null) {
      clauses.push(
        or(
          isNull(searchFiltersTable.propertyType),
          eq(searchFiltersTable.propertyType, property.propertyType),
        ),
      );
    }

    const rows = await db
      .select()
      .from(searchFiltersTable)
      .where(and(...clauses));

    return rows.map(mapFilter);
  }

  async updateFilterById(
    userId: string,
    filterId: string,
    payload: UpdateFilterBody,
  ): Promise<SearchFilter | null> {
    const updated = await db
      .update(searchFiltersTable)
      .set({
        ...(payload.priceMin !== undefined ? { priceMin: payload.priceMin } : {}),
        ...(payload.priceMax !== undefined ? { priceMax: payload.priceMax } : {}),
        ...(payload.bedroomsMin !== undefined ? { bedroomsMin: payload.bedroomsMin } : {}),
        ...(payload.bedroomsMax !== undefined ? { bedroomsMax: payload.bedroomsMax } : {}),
        ...(payload.bathroomsMin !== undefined ? { bathroomsMin: payload.bathroomsMin } : {}),
        ...(payload.bathroomsMax !== undefined ? { bathroomsMax: payload.bathroomsMax } : {}),
        ...(payload.location !== undefined ? { location: payload.location } : {}),
        ...(payload.propertyType !== undefined ? { propertyType: payload.propertyType } : {}),
        ...(payload.keywords !== undefined ? { keywords: payload.keywords } : {}),
        updatedAt: new Date(),
      })
      .where(and(eq(searchFiltersTable.id, filterId), eq(searchFiltersTable.userId, userId)))
      .returning()
      .then((rows) => rows.at(0) ?? null);

    return updated ? mapFilter(updated) : null;
  }

  async deleteFilterById(userId: string, filterId: string): Promise<boolean> {
    const deleted = await db
      .delete(searchFiltersTable)
      .where(and(eq(searchFiltersTable.id, filterId), eq(searchFiltersTable.userId, userId)))
      .returning({ id: searchFiltersTable.id })
      .then((rows) => rows.at(0));

    return Boolean(deleted);
  }

  async countFiltersByUser(userId: string): Promise<number> {
    const rows = await db
      .select({ value: count() })
      .from(searchFiltersTable)
      .where(eq(searchFiltersTable.userId, userId));

    return rows.at(0)?.value ?? 0;
  }
}
