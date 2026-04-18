export class DuplicateEmailError extends Error {
  constructor(email: string) {
    super(`Email already exists: ${email}`);
    this.name = "DuplicateEmailError";
  }
}
