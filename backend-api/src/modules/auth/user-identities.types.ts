export type AuthProvider = "password" | "google" | "facebook";

export type SocialAuthProvider = Extract<AuthProvider, "google" | "facebook">;

export type UserIdentity = {
  id: string;
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
  email: string | null;
  createdAt: Date;
};

export type LinkUserIdentityInput = {
  userId: string;
  provider: AuthProvider;
  providerUserId: string;
  email?: string | null;
};
