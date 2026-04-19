import type { Match } from "../matches/matches.types";
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
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

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
      notifications.push(notification);
    }

    return notifications;
  }

  async createForMatchEvent(event: MatchCreatedNotificationEvent): Promise<Notification> {
    const { match } = event.payload;

    return this.notificationsRepository.createNotification({
      userId: match.userId,
      matchId: match.id,
      channel: "email",
      subject: "New property match found",
      body: `Property ${match.propertyId} matched your saved filter criteria.`,
    });
  }
}
