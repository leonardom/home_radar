import { describe, expect, it, vi } from "vitest";

import { NotificationsService } from "../src/modules/notifications/notifications.service";

describe("NotificationsService", () => {
  it("creates email notifications for persisted matches", async () => {
    const createNotification = vi.fn().mockResolvedValue({ id: "notification-1" });
    const service = new NotificationsService({ createNotification } as never);

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
});
