export class InvalidCredentialsError extends Error {
  constructor() {
    super("Invalid credentials");
    this.name = "InvalidCredentialsError";
  }
}

export class InvalidRefreshTokenError extends Error {
  constructor() {
    super("Invalid refresh token");
    this.name = "InvalidRefreshTokenError";
  }
}

export class OAuthIdentityEmailRequiredError extends Error {
  constructor() {
    super("OAuth identity requires a verified email");
    this.name = "OAuthIdentityEmailRequiredError";
  }
}

export class OAuthInvalidStateNonceError extends Error {
  constructor() {
    super("Invalid OAuth state or nonce");
    this.name = "OAuthInvalidStateNonceError";
  }
}

export class OAuthReplayDetectedError extends Error {
  constructor() {
    super("OAuth replay detected");
    this.name = "OAuthReplayDetectedError";
  }
}

export class OAuthRateLimitExceededError extends Error {
  constructor() {
    super("OAuth rate limit exceeded");
    this.name = "OAuthRateLimitExceededError";
  }
}
