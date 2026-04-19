import { UsersRepository } from "../users/users.repository";
import type { EmailSender } from "./email.sender";
import { NotificationsRepository } from "./notifications.repository";
import type { Notification } from "./notifications.types";

export type NotificationDeliverySummary = {
  queued: number;
  sent: number;
  failed: number;
};

export interface NotificationDeliveryLogger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

const defaultLogger: NotificationDeliveryLogger = {
  info(message, meta) {
    console.info(message, meta);
  },
  warn(message, meta) {
    console.warn(message, meta);
  },
  error(message, meta) {
    console.error(message, meta);
  },
};

export class NotificationsDeliveryService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly emailSender: EmailSender,
    private readonly maxAttempts: number = 3,
    private readonly logger: NotificationDeliveryLogger = defaultLogger,
  ) {}

  async deliverPending(limit: number = 100): Promise<NotificationDeliverySummary> {
    const pending = await this.notificationsRepository.listPending(limit, this.maxAttempts);

    let sent = 0;
    let failed = 0;

    for (const notification of pending) {
      const attempted = await this.notificationsRepository.markAttempt(notification.id);

      if (!attempted) {
        this.logger.warn("Notification not found when marking attempt", {
          notificationId: notification.id,
        });
        failed += 1;
        continue;
      }

      const user = await this.usersRepository.findById(notification.userId);

      if (!user || user.status !== "active") {
        await this.handleDeliveryFailure(
          attempted,
          "User not found or inactive for notification delivery",
        );
        failed += 1;
        continue;
      }

      try {
        await this.emailSender.send({
          to: user.email,
          subject: attempted.subject,
          body: attempted.body,
        });

        await this.notificationsRepository.markSent(attempted.id);
        this.logger.info("Notification delivered", {
          notificationId: attempted.id,
          userId: attempted.userId,
          attemptCount: attempted.attemptCount,
        });
        sent += 1;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        await this.handleDeliveryFailure(attempted, message);
        failed += 1;
      }
    }

    return {
      queued: pending.length,
      sent,
      failed,
    };
  }

  private async handleDeliveryFailure(notification: Notification, reason: string): Promise<void> {
    const exhausted = notification.attemptCount >= this.maxAttempts;

    if (exhausted) {
      await this.notificationsRepository.markFailed(notification.id, reason);
      this.logger.error("Notification delivery exhausted retries", {
        notificationId: notification.id,
        userId: notification.userId,
        attemptCount: notification.attemptCount,
        reason,
      });
      return;
    }

    await this.notificationsRepository.recordAttemptFailure(notification.id, reason);
    this.logger.warn("Notification delivery attempt failed", {
      notificationId: notification.id,
      userId: notification.userId,
      attemptCount: notification.attemptCount,
      reason,
    });
  }
}
