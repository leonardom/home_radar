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
        attemptCount: 0,
      },
    ]);
    const markAttempt = vi.fn().mockResolvedValue({
      id: "notification-1",
      userId: "user-1",
      subject: "New match",
      body: "Body",
      attemptCount: 1,
    });
    const markSent = vi.fn().mockResolvedValue({ id: "notification-1", status: "sent" });
    const markFailed = vi.fn();
    const recordAttemptFailure = vi.fn();
    const findById = vi
      .fn()
      .mockResolvedValue({ id: "user-1", email: "user@example.com", status: "active" });
    const send = vi.fn().mockResolvedValue(undefined);

    const service = new NotificationsDeliveryService(
      { listPending, markAttempt, markSent, markFailed, recordAttemptFailure } as never,
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
    expect(recordAttemptFailure).not.toHaveBeenCalled();
  });

  it("records attempt failure when send fails but retries remain", async () => {
    const listPending = vi.fn().mockResolvedValue([
      {
        id: "notification-2",
        userId: "user-2",
        subject: "New match",
        body: "Body",
        attemptCount: 0,
      },
    ]);
    const markAttempt = vi.fn().mockResolvedValue({
      id: "notification-2",
      userId: "user-2",
      subject: "New match",
      body: "Body",
      attemptCount: 1,
    });
    const markSent = vi.fn();
    const markFailed = vi.fn();
    const recordAttemptFailure = vi
      .fn()
      .mockResolvedValue({ id: "notification-2", status: "pending" });
    const findById = vi
      .fn()
      .mockResolvedValue({ id: "user-2", email: "user2@example.com", status: "active" });
    const send = vi.fn().mockRejectedValue(new Error("SMTP timeout"));

    const service = new NotificationsDeliveryService(
      { listPending, markAttempt, markSent, markFailed, recordAttemptFailure } as never,
      { findById } as never,
      { send } as never,
      3,
    );

    const summary = await service.deliverPending(10);

    expect(summary).toEqual({ queued: 1, sent: 0, failed: 1 });
    expect(recordAttemptFailure).toHaveBeenCalledWith("notification-2", "SMTP timeout");
    expect(markFailed).not.toHaveBeenCalled();
    expect(markSent).not.toHaveBeenCalled();
  });

  it("marks notification as failed when retries are exhausted", async () => {
    const listPending = vi.fn().mockResolvedValue([
      {
        id: "notification-3",
        userId: "user-3",
        subject: "New match",
        body: "Body",
        attemptCount: 2,
      },
    ]);
    const markAttempt = vi.fn().mockResolvedValue({
      id: "notification-3",
      userId: "user-3",
      subject: "New match",
      body: "Body",
      attemptCount: 3,
    });
    const markSent = vi.fn();
    const markFailed = vi.fn().mockResolvedValue({ id: "notification-3", status: "failed" });
    const recordAttemptFailure = vi.fn();
    const findById = vi
      .fn()
      .mockResolvedValue({ id: "user-3", email: "user3@example.com", status: "active" });
    const send = vi.fn().mockRejectedValue(new Error("SendGrid timeout"));

    const service = new NotificationsDeliveryService(
      { listPending, markAttempt, markSent, markFailed, recordAttemptFailure } as never,
      { findById } as never,
      { send } as never,
      3,
    );

    const summary = await service.deliverPending(10);

    expect(summary).toEqual({ queued: 1, sent: 0, failed: 1 });
    expect(markFailed).toHaveBeenCalledWith("notification-3", "SendGrid timeout");
    expect(recordAttemptFailure).not.toHaveBeenCalled();
    expect(markSent).not.toHaveBeenCalled();
  });
});
