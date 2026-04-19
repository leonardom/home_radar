import type { NotificationPreference } from "./notification-preferences.types";

export type DigestBucket = "daily" | "weekly";

export type DigestAggregationRequest = {
  userId: string;
  mode: Extract<NotificationPreference["mode"], "digest">;
  bucket: DigestBucket;
  from: Date;
  to: Date;
};

export interface DigestScheduler {
  schedule(request: DigestAggregationRequest): Promise<void>;
}
