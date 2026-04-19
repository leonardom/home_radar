import { UsersRepository } from "../users/users.repository";
import type { EmailSender } from "./email.sender";
import { NotificationsRepository } from "./notifications.repository";

export type NotificationDeliverySummary = {
  queued: number;
  sent: number;
  failed: number;
};

export class NotificationsDeliveryService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly usersRepository: UsersRepository,
    private readonly emailSender: EmailSender,
  ) {}

  async deliverPending(limit: number = 100): Promise<NotificationDeliverySummary> {
    const pending = await this.notificationsRepository.listPending(limit);

    let sent = 0;
    let failed = 0;

    for (const notification of pending) {
      const user = await this.usersRepository.findById(notification.userId);

      if (!user || user.status !== "active") {
        await this.notificationsRepository.markFailed(
          notification.id,
          "User not found or inactive for notification delivery",
        );
        failed += 1;
        continue;
      }

      try {
        await this.emailSender.send({
          to: user.email,
          subject: notification.subject,
          body: notification.body,
        });

        await this.notificationsRepository.markSent(notification.id);
        sent += 1;
      } catch (error: unknown) {
        await this.notificationsRepository.markFailed(
          notification.id,
          error instanceof Error ? error.message : String(error),
        );
        failed += 1;
      }
    }

    return {
      queued: pending.length,
      sent,
      failed,
    };
  }
}
