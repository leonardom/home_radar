import { describe, expect, it, vi } from "vitest";

import { NotificationsService } from "../src/modules/notifications/notifications.service";

describe("NotificationsService", () => {
  it("creates email notifications for users in instant mode", async () => {
    const createNotification = vi.fn().mockResolvedValue({ id: "notification-1" });
    const getOrCreateByUserId = vi.fn().mockResolvedValue({ mode: "instant" });
    const service = new NotificationsService(
      { createNotification } as never,
      { getOrCreateByUserId } as never,
    );

    const matches = [
      {
        id: "match-1",
        userId: "user-1",
        propertyId: "property-1",
        filterId: "filter-1",
        matchReasons: ["price_range"],
        matchedAt: new Date("2026-04-19T12:00:00.000Z"),
        createdAt: new Date("2026-04-19T12:00:00.000Z"),
      },
    ];

    await service.createForMatches(matches as never);

    expect(createNotification).toHaveBeenCalledWith({
      userId: "user-1",
      matchId: "match-1",
      channel: "email",
      subject: "New property match found",
      body: "Property property-1 matched your saved filter criteria.",
    });
  });

  it("skips immediate notification creation for digest mode", async () => {
    const createNotification = vi.fn();
    const getOrCreateByUserId = vi.fn().mockResolvedValue({ mode: "digest" });
    const service = new NotificationsService(
      { createNotification } as never,
      { getOrCreateByUserId } as never,
    );

    const matches = [
      {
        id: "match-2",
        userId: "user-2",
        propertyId: "property-2",
        filterId: "filter-2",
        matchReasons: ["location"],
        matchedAt: new Date("2026-04-19T12:00:00.000Z"),
        createdAt: new Date("2026-04-19T12:00:00.000Z"),
      },
    ];

    const result = await service.createForMatches(matches as never);

    expect(result).toEqual([]);
    expect(createNotification).not.toHaveBeenCalled();
  });
});
