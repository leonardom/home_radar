import type { Match } from "../matches/matches.types";
import { NotificationPreferencesRepository } from "../notification-preferences/notification-preferences.repository";
import type { MatchCreatedNotificationEvent } from "./notifications.events";
import { NotificationsRepository } from "./notifications.repository";
import type { Notification } from "./notifications.types";

const generateEventId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

export class NotificationsService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
    private readonly notificationPreferencesRepository: NotificationPreferencesRepository,
  ) {}

  async createForMatches(matches: Match[]): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const match of matches) {
      const event: MatchCreatedNotificationEvent = {
        id: generateEventId(),
        type: "match.created",
        occurredAt: new Date(),
        payload: { match },
      };

      const notification = await this.createForMatchEvent(event);
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  }

  async createForMatchEvent(event: MatchCreatedNotificationEvent): Promise<Notification | null> {
    const { match } = event.payload;
    const preference = await this.notificationPreferencesRepository.getOrCreateByUserId(
      match.userId,
    );

    if (preference.mode !== "instant") {
      return null;
    }

    return this.notificationsRepository.createNotification({
      userId: match.userId,
      matchId: match.id,
      channel: "email",
      subject: "New property match found",
      body: `Property ${match.propertyId} matched your saved filter criteria.`,
    });
  }
}
