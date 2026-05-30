import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, safeEqual } from "@/lib/auth/password";
import { generateCertReference } from "@/lib/data/determinations";
import { sign, generateSecret } from "@/lib/webhooks/dispatch";
import { pickActiveWorkspace, type WorkspaceSummary } from "@/lib/server/workspace";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const hash = await hashPassword("correct-horse-battery");
    expect(await verifyPassword("correct-horse-battery", hash)).toBe(true);
  });

  it("rejects a wrong password", async () => {
    const hash = await hashPassword("correct-horse-battery");
    expect(await verifyPassword("wrong-password", hash)).toBe(false);
  });

  it("produces different hashes for the same password (salt)", async () => {
    const a = await hashPassword("samepass1234");
    const b = await hashPassword("samepass1234");
    expect(a).not.toBe(b);
  });

  it("verifyPassword is false for empty inputs", async () => {
    expect(await verifyPassword("", "")).toBe(false);
  });
});

describe("safeEqual", () => {
  it("true for equal strings", () => {
    expect(safeEqual("token", "token")).toBe(true);
  });
  it("false for different strings", () => {
    expect(safeEqual("token", "toker")).toBe(false);
  });
  it("false for different lengths", () => {
    expect(safeEqual("tok", "token")).toBe(false);
  });
});

describe("generateCertReference", () => {
  it("matches the AFCFTA-XXXXXXXX format", () => {
    expect(generateCertReference()).toMatch(/^AFCFTA-[A-Z0-9]{8}$/);
  });
  it("is unambiguous (no 0,1,I,O)", () => {
    const ref = generateCertReference().replace("AFCFTA-", "");
    expect(ref).not.toMatch(/[01IO]/);
  });
  it("generates unique references", () => {
    const refs = new Set(Array.from({ length: 100 }, () => generateCertReference()));
    expect(refs.size).toBe(100);
  });
});

describe("webhook signing", () => {
  it("generateSecret has the whsec_ prefix", () => {
    expect(generateSecret().startsWith("whsec_")).toBe(true);
  });

  it("sign is deterministic for the same inputs", () => {
    const a = sign('{"a":1}', "whsec_test", 1700000000);
    const b = sign('{"a":1}', "whsec_test", 1700000000);
    expect(a).toBe(b);
  });

  it("sign changes with the body", () => {
    const a = sign('{"a":1}', "whsec_test", 1700000000);
    const b = sign('{"a":2}', "whsec_test", 1700000000);
    expect(a).not.toBe(b);
  });

  it("sign embeds the timestamp", () => {
    expect(sign("{}", "whsec_test", 1700000000)).toMatch(/^t=1700000000,v1=[0-9a-f]+$/);
  });
});

describe("pickActiveWorkspace", () => {
  const ws: WorkspaceSummary[] = [
    { id: "a", name: "A", plan: "free", role: "member" },
    { id: "b", name: "B", plan: "pro", role: "owner" },
    { id: "c", name: "C", plan: "bulk", role: "admin" }
  ];

  it("returns null for an empty list", () => {
    expect(pickActiveWorkspace([], null)).toBeNull();
  });

  it("honours a valid preferred id", () => {
    expect(pickActiveWorkspace(ws, "c")?.id).toBe("c");
  });

  it("falls back to owner when preferred id is invalid", () => {
    expect(pickActiveWorkspace(ws, "missing")?.id).toBe("b");
  });

  it("prefers owner over admin/member when no preference", () => {
    expect(pickActiveWorkspace(ws, null)?.role).toBe("owner");
  });
});
