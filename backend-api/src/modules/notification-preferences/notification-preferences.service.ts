import { NotificationPreferencesRepository } from "./notification-preferences.repository";
import type { NotificationMode, NotificationPreference } from "./notification-preferences.types";

export class NotificationPreferencesService {
  constructor(
    private readonly notificationPreferencesRepository: NotificationPreferencesRepository,
  ) {}

  async getUserPreference(userId: string): Promise<NotificationPreference> {
    return this.notificationPreferencesRepository.getOrCreateByUserId(userId);
  }

  async updateUserPreference(
    userId: string,
    mode: NotificationMode,
  ): Promise<NotificationPreference> {
    return this.notificationPreferencesRepository.updateMode(userId, mode);
  }
}
