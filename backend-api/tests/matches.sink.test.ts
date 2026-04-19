import { describe, expect, it, vi } from "vitest";

import { DatabaseMatchingSink } from "../src/modules/matches/matches.sink";

describe("DatabaseMatchingSink", () => {
  it("persists matches and creates notifications", async () => {
    const persisted = [
      {
        id: "match-1",
        userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        propertyId: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
        filterId: "ceffb7eb-cded-4a75-8a5e-53f7f3f577f7",
        matchReasons: ["price_range"],
        matchedAt: new Date("2026-04-18T12:00:00.000Z"),
        createdAt: new Date("2026-04-18T12:00:00.000Z"),
      },
    ];

    const persistTriggeredMatches = vi.fn().mockResolvedValue(persisted);
    const createForMatches = vi.fn().mockResolvedValue([]);
    const sink = new DatabaseMatchingSink(
      { persistTriggeredMatches } as never,
      { createForMatches } as never,
    );

    const matches = [
      {
        userId: "01a4c5ea-7d51-4dc5-9ae2-7726a983eb30",
        propertyId: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6",
        filterId: "ceffb7eb-cded-4a75-8a5e-53f7f3f577f7",
        matchReason: ["price_range"],
        matchedAt: new Date("2026-04-18T12:00:00.000Z"),
      },
    ];

    await sink.consume(matches, {
      id: "event-1",
      type: "property.created",
      occurredAt: new Date("2026-04-18T12:00:00.000Z"),
      payload: { propertyId: "6bf9032e-d7fb-405a-9df8-7281d5f6f3e6" },
    });

    expect(persistTriggeredMatches).toHaveBeenCalledWith(matches);
    expect(createForMatches).toHaveBeenCalledWith(persisted);
  });
});
