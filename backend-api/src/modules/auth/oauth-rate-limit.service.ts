import { env } from "../../config/env";
import { OAuthRateLimitExceededError } from "./auth.errors";

type Bucket = {
  count: number;
  resetAt: number;
};

export class OAuthRateLimitService {
  private readonly buckets = new Map<string, Bucket>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  checkAndConsume(scope: "oauth-login" | "oauth-link", identifier: string): void {
    const now = Date.now();
    this.pruneExpired(now);

    const key = `${scope}:${identifier}`;
    const current = this.buckets.get(key);

    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs });
      return;
    }

    if (current.count >= this.maxRequests) {
      throw new OAuthRateLimitExceededError();
    }

    current.count += 1;
    this.buckets.set(key, current);
  }

  resetForTests(): void {
    this.buckets.clear();
  }

  configureForTests(maxRequests: number, windowMs: number = this.windowMs): void {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.buckets.clear();
  }

  private pruneExpired(now: number): void {
    for (const [key, value] of this.buckets.entries()) {
      if (value.resetAt <= now) {
        this.buckets.delete(key);
      }
    }
  }
}

export const oauthRateLimitService = new OAuthRateLimitService(
  env.NODE_ENV === "test" ? 3 : 20,
  60_000,
);
