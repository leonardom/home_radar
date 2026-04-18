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
    expect(typeof result.timestamp).toBe("string");
  });
});
