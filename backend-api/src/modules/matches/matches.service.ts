import type { PropertyFilterMatch } from "../matching/matching.types";
import { MatchesRepository } from "./matches.repository";
import type { Match } from "./matches.types";

export class MatchesService {
  constructor(private readonly matchesRepository: MatchesRepository) {}

  async persistTriggeredMatches(matches: PropertyFilterMatch[]): Promise<Match[]> {
    const dedupedByUserProperty = new Map<string, PropertyFilterMatch>();

    for (const match of matches) {
      const key = `${match.userId}:${match.propertyId}`;
      const existing = dedupedByUserProperty.get(key);

      if (!existing) {
        dedupedByUserProperty.set(key, match);
        continue;
      }

      const mergedReasons = [...new Set([...existing.matchReason, ...match.matchReason])];
      const newest = existing.matchedAt >= match.matchedAt ? existing : match;

      dedupedByUserProperty.set(key, {
        ...newest,
        matchReason: mergedReasons,
      });
    }

    const persisted: Match[] = [];

    for (const match of dedupedByUserProperty.values()) {
      const row = await this.matchesRepository.createMatch({
        userId: match.userId,
        propertyId: match.propertyId,
        filterId: match.filterId,
        matchReasons: match.matchReason,
        matchedAt: match.matchedAt,
      });

      persisted.push(row);
    }

    return persisted;
  }

  async listUserMatches(userId: string): Promise<Match[]> {
    return this.matchesRepository.listMatchesByUser(userId);
  }
}
