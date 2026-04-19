import { describe, expect, it, vi } from "vitest";

import { NotificationsDeliveryService } from "../src/modules/notifications/notifications.delivery.service";

describe("NotificationsDeliveryService", () => {
  it("sends pending notifications and marks as sent", async () => {
    const listPending = vi.fn().mockResolvedValue([
      {
        id: "notification-1",
        userId: "user-1",
        subject: "New match",
        body: "Body",
      },
    ]);
    const markSent = vi.fn().mockResolvedValue({ id: "notification-1", status: "sent" });
    const markFailed = vi.fn();
    const findById = vi
      .fn()
      .mockResolvedValue({ id: "user-1", email: "user@example.com", status: "active" });
    const send = vi.fn().mockResolvedValue(undefined);

    const service = new NotificationsDeliveryService(
      { listPending, markSent, markFailed } as never,
      { findById } as never,
      { send } as never,
    );

    const summary = await service.deliverPending(10);

    expect(summary).toEqual({ queued: 1, sent: 1, failed: 0 });
    expect(send).toHaveBeenCalledWith({
      to: "user@example.com",
      subject: "New match",
      body: "Body",
    });
    expect(markSent).toHaveBeenCalledWith("notification-1");
    expect(markFailed).not.toHaveBeenCalled();
  });

  it("marks notification as failed when email send fails", async () => {
    const listPending = vi.fn().mockResolvedValue([
      {
        id: "notification-2",
        userId: "user-2",
        subject: "New match",
        body: "Body",
      },
    ]);
    const markSent = vi.fn();
    const markFailed = vi.fn().mockResolvedValue({ id: "notification-2", status: "failed" });
    const findById = vi
      .fn()
      .mockResolvedValue({ id: "user-2", email: "user2@example.com", status: "active" });
    const send = vi.fn().mockRejectedValue(new Error("SMTP timeout"));

    const service = new NotificationsDeliveryService(
      { listPending, markSent, markFailed } as never,
      { findById } as never,
      { send } as never,
    );

    const summary = await service.deliverPending(10);

    expect(summary).toEqual({ queued: 1, sent: 0, failed: 1 });
    expect(markFailed).toHaveBeenCalledWith("notification-2", "SMTP timeout");
    expect(markSent).not.toHaveBeenCalled();
  });
});
