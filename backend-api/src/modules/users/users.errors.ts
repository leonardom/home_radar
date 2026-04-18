export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Email already exists: ${email}`);
    this.name = "DuplicateEmailError";
  }
}

export class ProfileNotFoundError extends Error {
  constructor() {
    super("Profile not found");
    this.name = "ProfileNotFoundError";
  }
}
