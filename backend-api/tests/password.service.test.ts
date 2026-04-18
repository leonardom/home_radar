import { describe, expect, it } from "vitest";

import { PasswordService } from "../src/modules/auth/password.service";

describe("PasswordService", () => {
  it("hashes and verifies password", async () => {
    const service = new PasswordService();
    const password = "StrongPass123";

    const hash = await service.hashPassword(password);
    const isValid = await service.verifyPassword(password, hash);

    expect(hash).not.toBe(password);
    expect(isValid).toBe(true);
  });

  it("fails verification for wrong password", async () => {
    const service = new PasswordService();
    const hash = await service.hashPassword("StrongPass123");

    const isValid = await service.verifyPassword("WrongPass123", hash);

    expect(isValid).toBe(false);
  });
});
