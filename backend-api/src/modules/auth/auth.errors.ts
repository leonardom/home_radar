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
