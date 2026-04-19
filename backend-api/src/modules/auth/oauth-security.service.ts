import { createHash } from "node:crypto";

import { OAuthInvalidStateNonceError, OAuthReplayDetectedError } from "./auth.errors";
import type { SocialAuthProvider } from "./user-identities.types";

const STATE_NONCE_PATTERN = /^[A-Za-z0-9._~-]{16,256}$/;

type OAuthAttemptInput = {
  scope: "login" | "link";
  provider: SocialAuthProvider;
  sessionToken: string;
  state: string;
  nonce: string;
  userId?: string;
};

export class OAuthReplayProtectionService {
  private readonly attempts = new Map<string, number>();

  constructor(private readonly ttlMs = 10 * 60 * 1000) {}

  registerAttempt(input: OAuthAttemptInput): void {
    if (!this.isValidStateOrNonce(input.state) || !this.isValidStateOrNonce(input.nonce)) {
      throw new OAuthInvalidStateNonceError();
    }

    if (input.state === input.nonce) {
      throw new OAuthInvalidStateNonceError();
    }

    const now = Date.now();
    this.pruneExpired(now);

    const sessionBoundKey = this.hashParts([
      input.scope,
      input.provider,
      input.sessionToken,
      input.state,
      input.nonce,
      input.userId ?? "",
    ]);

    const stateNonceKey = this.hashParts([
      input.scope,
      input.provider,
      input.state,
      input.nonce,
      input.userId ?? "",
    ]);

    const replayDetected = [sessionBoundKey, stateNonceKey].some((key) => {
      const expiresAt = this.attempts.get(key);
      return typeof expiresAt === "number" && expiresAt > now;
    });

    if (replayDetected) {
      throw new OAuthReplayDetectedError();
    }

    const expiresAt = now + this.ttlMs;
    this.attempts.set(sessionBoundKey, expiresAt);
    this.attempts.set(stateNonceKey, expiresAt);
  }

  resetForTests(): void {
    this.attempts.clear();
  }

  private isValidStateOrNonce(value: string): boolean {
    return STATE_NONCE_PATTERN.test(value);
  }

  private hashParts(parts: string[]): string {
    return createHash("sha256").update(parts.join("|")).digest("hex");
  }

  private pruneExpired(now: number): void {
    for (const [key, expiresAt] of this.attempts.entries()) {
      if (expiresAt <= now) {
        this.attempts.delete(key);
      }
    }
  }
}

export const oauthReplayProtectionService = new OAuthReplayProtectionService();
