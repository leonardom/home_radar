import type { SearchFilter } from "../filters/filters.types";
import type { PropertyCandidate, PropertyFilterMatch } from "./matching.types";

const normalize = (value: string): string => value.trim().toLowerCase();

const hasAnyKeyword = (property: PropertyCandidate, keywords: string[]): boolean => {
  if (keywords.length === 0) {
    return true;
  }

  const haystack = `${property.location ?? ""} ${property.description ?? ""}`.toLowerCase();

  return keywords.some((keyword) => haystack.includes(keyword.toLowerCase()));
};

export class MatchingService {
  isPropertyMatch(property: PropertyCandidate, filter: SearchFilter): boolean {
    if (filter.priceMin != null && (property.price == null || property.price < filter.priceMin)) {
      return false;
    }

    if (filter.priceMax != null && (property.price == null || property.price > filter.priceMax)) {
      return false;
    }

    if (
      filter.bedroomsMin != null &&
      (property.bedrooms == null || property.bedrooms < filter.bedroomsMin)
    ) {
      return false;
    }

    if (filter.location != null) {
      if (!property.location) {
        return false;
      }

      const filterLocation = normalize(filter.location);
      const propertyLocation = normalize(property.location);
      if (!propertyLocation.includes(filterLocation)) {
        return false;
      }
    }

    if (!hasAnyKeyword(property, filter.keywords)) {
      return false;
    }

    if (filter.propertyType != null) {
      if (property.propertyType == null || filter.propertyType !== property.propertyType) {
        return false;
      }
    }

    return true;
  }

  getMatchReasons(
    property: PropertyCandidate,
    filter: SearchFilter,
  ): PropertyFilterMatch["matchReason"] {
    const reasons: PropertyFilterMatch["matchReason"] = [];

    if (filter.priceMin != null || filter.priceMax != null) {
      reasons.push("price_range");
    }

    if (filter.bedroomsMin != null) {
      reasons.push("minimum_bedrooms");
    }

    if (filter.location != null) {
      reasons.push("location");
    }

    if (filter.keywords.length > 0) {
      reasons.push("keywords");
    }

    if (filter.propertyType != null) {
      reasons.push("property_type");
    }

    return reasons;
  }

  matchPropertyAgainstFilter(
    property: PropertyCandidate,
    filter: SearchFilter,
    now: Date = new Date(),
  ): PropertyFilterMatch | null {
    if (!this.isPropertyMatch(property, filter)) {
      return null;
    }

    return {
      propertyId: property.id,
      filterId: filter.id,
      userId: filter.userId,
      matchReason: this.getMatchReasons(property, filter),
      matchedAt: now,
    };
  }

  matchPropertyAgainstFilters(
    property: PropertyCandidate,
    filters: SearchFilter[],
    now: Date = new Date(),
  ): PropertyFilterMatch[] {
    const matches: PropertyFilterMatch[] = [];

    for (const filter of filters) {
      const match = this.matchPropertyAgainstFilter(property, filter, now);
      if (match) {
        matches.push(match);
      }
    }

    return matches;
  }
}
