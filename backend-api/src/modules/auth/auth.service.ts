import { randomUUID } from "node:crypto";

import {
  InvalidCredentialsError,
  InvalidRefreshTokenError,
  OAuthIdentityEmailRequiredError,
} from "./auth.errors";
import { RefreshTokensRepository } from "./refresh-tokens.repository";
import { TokenService } from "./token.service";
import type {
  AuthTokensResponse,
  LoginRequest,
  OAuthLoginRequest,
  SessionExchangeRequest,
} from "./token.schemas";
import { UsersRepository } from "../users/users.repository";
import { PasswordService } from "./password.service";
import { AuthIdentityService, ProviderIdentityConflictError } from "./auth-identity.service";
import { ClerkTokenAdapter } from "./clerk-token.adapter";
import { UserIdentitiesRepository } from "./user-identities.repository";
import type { User } from "../users/user.types";

const CLERK_MANAGED_PASSWORD_PLACEHOLDER = "clerk-managed-auth-no-local-password";

export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
    private readonly userIdentitiesRepository: UserIdentitiesRepository,
    private readonly clerkTokenAdapter: ClerkTokenAdapter,
    private readonly authIdentityService: AuthIdentityService,
  ) {}

  async login(payload: LoginRequest): Promise<AuthTokensResponse> {
    const user = await this.usersRepository.findByEmail(payload.email);

    if (!user || user.status !== "active") {
      throw new InvalidCredentialsError();
    }

    const isValidPassword = await this.passwordService.verifyPassword(
      payload.password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new InvalidCredentialsError();
    }

    return this.issueTokens(user.id, user.email);
  }

  async refresh(refreshToken: string): Promise<AuthTokensResponse> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    const tokenRecord = await this.refreshTokensRepository.findActiveByTokenHash(tokenHash);

    if (!tokenRecord) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.usersRepository.findById(tokenRecord.userId);

    if (!user || user.status !== "active") {
      await this.refreshTokensRepository.revokeById(tokenRecord.id);
      throw new InvalidRefreshTokenError();
    }

    await this.refreshTokensRepository.revokeById(tokenRecord.id);

    return this.issueTokens(user.id, user.email);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.tokenService.hashRefreshToken(refreshToken);
    await this.refreshTokensRepository.revokeByTokenHash(tokenHash);
  }

  async oauthLogin(payload: OAuthLoginRequest): Promise<AuthTokensResponse> {
    return this.exchangeClerkSession({
      provider: payload.provider,
      sessionToken: payload.sessionToken,
    });
  }

  async exchangeClerkSession(payload: SessionExchangeRequest): Promise<AuthTokensResponse> {
    const verifiedIdentity = await this.clerkTokenAdapter.verifySessionToken(
      payload.sessionToken,
      payload.provider,
    );

    const resolved = await this.authIdentityService.resolveUserByProviderOrVerifiedEmail({
      provider: payload.provider,
      providerUserId: verifiedIdentity.providerUserId,
      email: verifiedIdentity.email ?? undefined,
      emailVerified: verifiedIdentity.emailVerified,
    });

    if (resolved) {
      return this.issueTokens(resolved.user.id, resolved.user.email);
    }

    if (!verifiedIdentity.email || !verifiedIdentity.emailVerified) {
      throw new OAuthIdentityEmailRequiredError();
    }

    const user = await this.provisionClerkUser({
      email: verifiedIdentity.email,
      fullName: verifiedIdentity.fullName,
      firstName: verifiedIdentity.firstName,
      lastName: verifiedIdentity.lastName,
    });

    try {
      await this.userIdentitiesRepository.linkIdentity({
        userId: user.id,
        provider: payload.provider,
        providerUserId: verifiedIdentity.providerUserId,
        email: user.email,
      });
    } catch (error: unknown) {
      if (error instanceof ProviderIdentityConflictError) {
        throw error;
      }

      throw error;
    }

    return this.issueTokens(user.id, user.email);
  }

  private async issueTokens(userId: string, email: string): Promise<AuthTokensResponse> {
    const access = this.tokenService.createAccessToken({
      sub: userId,
      email,
    });

    const refreshToken = this.tokenService.generateRefreshToken();
    const refreshHash = this.tokenService.hashRefreshToken(refreshToken);
    const refreshExpiresAt = this.tokenService.getRefreshTokenExpiresAt();

    await this.refreshTokensRepository.create({
      userId,
      tokenHash: refreshHash,
      expiresAt: refreshExpiresAt,
    });

    return {
      accessToken: access.token,
      refreshToken,
      tokenType: "Bearer",
      expiresIn: access.expiresIn,
    };
  }

  private async provisionClerkUser(input: {
    email: string | null;
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
  }): Promise<User> {
    if (!input.email) {
      throw new OAuthIdentityEmailRequiredError();
    }

    const fallbackName = input.email.split("@")[0] || "User";
    const composedName = [input.firstName, input.lastName].filter(Boolean).join(" ").trim();
    const name = (input.fullName ?? composedName) || fallbackName;

    return this.usersRepository.createUser({
      name,
      email: input.email,
      passwordHash: `${CLERK_MANAGED_PASSWORD_PLACEHOLDER}:${randomUUID()}`,
      status: "active",
    });
  }
}
