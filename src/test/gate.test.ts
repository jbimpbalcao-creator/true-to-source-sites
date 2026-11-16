import { describe, expect, it } from "vitest";
import { gateCookieOptions, matchesCredential } from "@/lib/gate.server";
import { gateSchema } from "@/lib/gate-schema";

describe("Fixed entry", () => {
  it("keeps the encrypted session available in a cross-site preview frame", () => {
    expect(gateCookieOptions.sameSite).toBe("none");
    expect(gateCookieOptions.partitioned).toBe(true);
    expect(gateCookieOptions.secure).toBe(true);
    expect(gateCookieOptions.httpOnly).toBe(true);
  });
  it("accepts an exact credential match", () => {
    expect(matchesCredential("test-only-value", "test-only-value")).toBe(true);
  });
  it("rejects a wrong credential even with a different length", () => {
    expect(matchesCredential("wrong", "test-only-value")).toBe(false);
  });
  it("requires the specified Admin username exactly", () => {
    expect(matchesCredential("admin", "Admin")).toBe(false);
    expect(matchesCredential("Admin", "Admin")).toBe(true);
  });
  it("rejects missing entry credentials", () => {
    expect(gateSchema.safeParse({ username: "Admin", password: "" }).success).toBe(false);
  });
});