import { describe, expect, it, vi } from "vitest";

import { NotificationPreferencesService } from "../src/modules/notification-preferences/notification-preferences.service";

describe("NotificationPreferencesService", () => {
  it("returns current preference for a user", async () => {
    const getOrCreateByUserId = vi.fn().mockResolvedValue({
      userId: "user-1",
      mode: "instant",
      createdAt: new Date("2026-04-19T12:00:00.000Z"),
      updatedAt: new Date("2026-04-19T12:00:00.000Z"),
    });

    const service = new NotificationPreferencesService({ getOrCreateByUserId } as never);

    const result = await service.getUserPreference("user-1");

    expect(result.mode).toBe("instant");
    expect(getOrCreateByUserId).toHaveBeenCalledWith("user-1");
  });

  it("updates user notification mode", async () => {
    const updateMode = vi.fn().mockResolvedValue({
      userId: "user-1",
      mode: "digest",
      createdAt: new Date("2026-04-19T12:00:00.000Z"),
      updatedAt: new Date("2026-04-19T13:00:00.000Z"),
    });

    const service = new NotificationPreferencesService({ updateMode } as never);

    const result = await service.updateUserPreference("user-1", "digest");

    expect(result.mode).toBe("digest");
    expect(updateMode).toHaveBeenCalledWith("user-1", "digest");
  });
});
