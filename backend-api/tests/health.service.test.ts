import { describe, expect, it, vi } from "vitest";

import { HealthService } from "../src/modules/health/health.service";

describe("HealthService", () => {
  it("returns ok status when database check succeeds", async () => {
    const checkDatabase = vi.fn().mockResolvedValue(undefined);
    const service = new HealthService({ checkDatabase } as never);

    const result = await service.getStatus();

    expect(checkDatabase).toHaveBeenCalledTimes(1);
    expect(result.status).toBe("ok");
    expect(result.database).toBe("connected");
    expect(result.auth.clerk.mode).toBe("optional");
    expect(result.auth.clerk.providers.google).toBe(false);
    expect(result.auth.clerk.providers.facebook).toBe(false);
    expect(result.auth.clerk.ready).toBe(false);
    expect(result.auth.clerk.issues.length).toBeGreaterThan(0);
    expect(typeof result.timestamp).toBe("string");
  });
});
