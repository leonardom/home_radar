import { RefreshTokensRepository } from "../auth/refresh-tokens.repository";
import { DuplicateEmailError, ProfileNotFoundError } from "./users.errors";
import type { User } from "./user.types";
import type { UpdateProfileRequest } from "./users.schemas";
import { UsersRepository } from "./users.repository";

export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly refreshTokensRepository: RefreshTokensRepository,
  ) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.usersRepository.findById(userId);

    if (!user || user.status !== "active") {
      throw new ProfileNotFoundError();
    }

    return user;
  }

  async updateProfile(userId: string, payload: UpdateProfileRequest): Promise<User> {
    const user = await this.usersRepository.updateProfile(userId, payload);

    if (!user) {
      throw new ProfileNotFoundError();
    }

    return user;
  }

  async deleteProfile(userId: string): Promise<void> {
    const deleted = await this.usersRepository.softDeleteById(userId);

    if (!deleted) {
      throw new ProfileNotFoundError();
    }

    await this.refreshTokensRepository.revokeByUserId(userId);
  }

  isDuplicateEmailError(error: unknown): boolean {
    return error instanceof DuplicateEmailError;
  }
}
