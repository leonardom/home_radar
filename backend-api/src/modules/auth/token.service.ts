import { createHash, randomBytes, randomUUID } from "node:crypto";

import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";

import { env } from "../../config/env";
import type { AccessTokenPayload } from "./auth.types";

const ACCESS_TOKEN_SECONDS = 15 * 60;

export class TokenService {
  createAccessToken(input: { sub: string; email: string }): { token: string; expiresIn: number } {
    const payload: AccessTokenPayload = {
      sub: input.sub,
      email: input.email,
      jti: randomUUID(),
      type: "access",
    };

    const token = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
    });

    return {
      token,
      expiresIn: ACCESS_TOKEN_SECONDS,
    };
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  }

  generateRefreshToken(): string {
    return randomBytes(48).toString("base64url");
  }

  hashRefreshToken(refreshToken: string): string {
    return createHash("sha256").update(refreshToken).digest("hex");
  }

  getRefreshTokenExpiresAt(): Date {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + env.JWT_REFRESH_EXPIRES_DAYS);
    return expiresAt;
  }
}
