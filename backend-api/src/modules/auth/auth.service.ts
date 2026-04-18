import { InvalidCredentialsError, InvalidRefreshTokenError } from "./auth.errors";
import { RefreshTokensRepository } from "./refresh-tokens.repository";
import { TokenService } from "./token.service";
import type { AuthTokensResponse, LoginRequest } from "./token.schemas";
import { UsersRepository } from "../users/users.repository";
import { PasswordService } from "./password.service";

export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenService: TokenService,
    private readonly refreshTokensRepository: RefreshTokensRepository,
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
}
