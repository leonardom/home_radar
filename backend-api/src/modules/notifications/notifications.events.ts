import type { Match } from "../matches/matches.types";

export type MatchCreatedNotificationEvent = {
  id: string;
  type: "match.created";
  occurredAt: Date;
  payload: {
    match: Match;
  };
};
