import type { MatchingSink } from "../matching/matching.trigger.service";
import type { MatchingTriggerEvent } from "../matching/matching.trigger.events";
import type { PropertyFilterMatch } from "../matching/matching.types";
import { MatchesService } from "./matches.service";

export class DatabaseMatchingSink implements MatchingSink {
  constructor(private readonly matchesService: MatchesService) {}

  async consume(matches: PropertyFilterMatch[], event: MatchingTriggerEvent): Promise<void> {
    void event;
    await this.matchesService.persistTriggeredMatches(matches);
  }
}
