import { UsersRepository } from "../users/users.repository";
import type { User } from "../users/user.types";
import { UserIdentitiesRepository } from "./user-identities.repository";
import type { AuthProvider, UserIdentity } from "./user-identities.types";

export type ResolvedIdentityUser = {
  user: User;
  identity: UserIdentity;
  resolution: "provider_identity" | "verified_email_link";
};

export class ProviderIdentityConflictError extends Error {
  constructor() {
    super("Provider identity is already linked to another user");
    this.name = "ProviderIdentityConflictError";
  }
}

export class AuthIdentityService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly userIdentitiesRepository: UserIdentitiesRepository,
  ) {}

  async resolveUserByProviderOrVerifiedEmail(input: {
    provider: AuthProvider;
    providerUserId: string;
    email?: string;
    emailVerified?: boolean;
  }): Promise<ResolvedIdentityUser | null> {
    const existingIdentity = await this.userIdentitiesRepository.findByProviderIdentity(
      input.provider,
      input.providerUserId,
    );

    if (existingIdentity) {
      const user = await this.usersRepository.findById(existingIdentity.userId);
      if (!user || user.status !== "active") {
        return null;
      }

      return {
        user,
        identity: existingIdentity,
        resolution: "provider_identity",
      };
    }

    if (!input.email || !input.emailVerified) {
      return null;
    }

    const user = await this.usersRepository.findByEmail(input.email.toLowerCase());
    if (!user || user.status !== "active") {
      return null;
    }

    const linked = await this.userIdentitiesRepository.linkIdentity({
      userId: user.id,
      provider: input.provider,
      providerUserId: input.providerUserId,
      email: user.email,
    });

    if (linked.userId !== user.id) {
      throw new ProviderIdentityConflictError();
    }

    return {
      user,
      identity: linked,
      resolution: "verified_email_link",
    };
  }
}
