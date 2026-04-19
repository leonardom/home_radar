import type { MatchingSink } from "../matching/matching.trigger.service";
import type { MatchingTriggerEvent } from "../matching/matching.trigger.events";
import type { PropertyFilterMatch } from "../matching/matching.types";
import { NotificationsService } from "../notifications/notifications.service";
import { MatchesService } from "./matches.service";

export class DatabaseMatchingSink implements MatchingSink {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async consume(matches: PropertyFilterMatch[], event: MatchingTriggerEvent): Promise<void> {
    void event;
    const persistedMatches = await this.matchesService.persistTriggeredMatches(matches);
    await this.notificationsService.createForMatches(persistedMatches);
  }
}
