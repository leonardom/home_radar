import { describe, expect, it } from "vitest";
import { cn } from "../lib/utils";

describe("cn", () => {
  it("merges class names and resolves conflicts", () => {
    const classes = cn("p-2", "text-sm", "p-4");

    expect(classes).toContain("p-4");
    expect(classes).toContain("text-sm");
    expect(classes).not.toContain("p-2");
  });
});
