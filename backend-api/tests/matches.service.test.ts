import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PropertyFilterMatch } from "../src/modules/matching/matching.types";
import { MatchesService } from "../src/modules/matches/matches.service";

const fixtureMatch = (overrides: Partial<PropertyFilterMatch> = {}): PropertyFilterMatch => ({
  propertyId: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
  filterId: "ceffb7eb-cded-4a75-8a5e-53f7f3f577f7",
  userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
  matchReason: ["price_range"],
  matchedAt: new Date("2026-04-18T12:00:00.000Z"),
  ...overrides,
});

describe("MatchesService", () => {
  const createMatch = vi.fn();
  const listMatchesByUser = vi.fn();

  const service = new MatchesService({
    createMatch,
    listMatchesByUser,
  } as never);

  beforeEach(() => {
    createMatch.mockReset();
    listMatchesByUser.mockReset();
    createMatch.mockResolvedValue({ id: "match-1" });
  });

  it("deduplicates by user+property and merges reasons before persisting", async () => {
    await service.persistTriggeredMatches([
      fixtureMatch({
        matchReason: ["price_range"],
        matchedAt: new Date("2026-04-18T12:00:00.000Z"),
      }),
      fixtureMatch({ matchReason: ["location"], matchedAt: new Date("2026-04-18T12:05:00.000Z") }),
    ]);

    expect(createMatch).toHaveBeenCalledTimes(1);
    expect(createMatch).toHaveBeenCalledWith({
      userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
      propertyId: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
      filterId: "ceffb7eb-cded-4a75-8a5e-53f7f3f577f7",
      matchReasons: ["price_range", "location"],
      matchedAt: new Date("2026-04-18T12:05:00.000Z"),
    });
  });

  it("lists matches for a user", async () => {
    listMatchesByUser.mockResolvedValue([{ id: "match-1" }]);

    const result = await service.listUserMatches("01a4c5ea-7d51-4dc5-9ae2-7726a983eb30");

    expect(result).toEqual([{ id: "match-1" }]);
    expect(listMatchesByUser).toHaveBeenCalledWith("01a4c5ea-7d51-4dc5-9ae2-7726a983eb30");
  });
});
