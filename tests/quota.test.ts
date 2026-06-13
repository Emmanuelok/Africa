import { describe, it, expect } from "vitest";
import { PLAN_LIMITS, checkQuota } from "@/lib/server/quota";
import { readIdempotencyKey } from "@/lib/server/idempotency";
import { API_SCOPES } from "@/lib/api/v1-auth";
import { parseCsv, PLAN_BULK_LIMITS, ASYNC_THRESHOLD_ROWS } from "@/lib/data/bulk";

describe("PLAN_LIMITS", () => {
  it("free tier caps certificates at 0", () => {
    expect(PLAN_LIMITS.free.certificatesPerMonth).toBe(0);
  });
  it("pro tier allows 5 certificates/month", () => {
    expect(PLAN_LIMITS.pro.certificatesPerMonth).toBe(5);
  });
  it("forwarder is unlimited across quotas", () => {
    expect(PLAN_LIMITS.forwarder.certificatesPerMonth).toBe(Infinity);
    expect(PLAN_LIMITS.forwarder.determinationsPerMonth).toBe(Infinity);
    expect(PLAN_LIMITS.forwarder.apiKeysMax).toBe(Infinity);
  });
  it("member caps scale with tier", () => {
    expect(PLAN_LIMITS.free.membersMax).toBeLessThan(PLAN_LIMITS.bulk.membersMax);
  });
});

describe("checkQuota (demo / unlimited paths)", () => {
  it("passes for forwarder regardless of quota", async () => {
    const r = await checkQuota("demo-workspace", "forwarder", "certificatesPerMonth");
    expect(r.ok).toBe(true);
  });
  it("passes in demo workspace even on the free tier", async () => {
    const r = await checkQuota("demo-workspace", "free", "certificatesPerMonth");
    expect(r.ok).toBe(true);
  });
});

describe("readIdempotencyKey", () => {
  function reqWith(headers: Record<string, string>): Request {
    return new Request("https://sokoni.africa/api/certificates", { method: "POST", headers });
  }
  it("returns the trimmed key", () => {
    expect(readIdempotencyKey(reqWith({ "idempotency-key": "  abc-123  " }))).toBe("abc-123");
  });
  it("returns null when absent", () => {
    expect(readIdempotencyKey(reqWith({}))).toBeNull();
  });
  it("rejects keys longer than 255 chars", () => {
    expect(readIdempotencyKey(reqWith({ "idempotency-key": "x".repeat(256) }))).toBeNull();
  });
});

describe("API_SCOPES", () => {
  it("covers every v1 endpoint", () => {
    expect(API_SCOPES).toContain("classify");
    expect(API_SCOPES).toContain("determine-origin");
    expect(API_SCOPES).toContain("tariff");
    expect(API_SCOPES).toContain("certificates");
    expect(API_SCOPES).toContain("shipments");
  });
});

describe("bulk CSV parsing", () => {
  it("parses a well-formed CSV with headers", () => {
    const { rows, error } = parseCsv("description,origin,destination\ncoffee,KE,NG\nleather,ET,EG");
    expect(error).toBeUndefined();
    expect(rows).toHaveLength(2);
    expect(rows[0].description).toBe("coffee");
    expect(rows[1].origin).toBe("ET");
  });
  it("skips empty lines", () => {
    const { rows } = parseCsv("description,origin\ncoffee,KE\n\n\nleather,ET\n");
    expect(rows).toHaveLength(2);
  });
  it("plan limits increase with tier", () => {
    expect(PLAN_BULK_LIMITS.free).toBeLessThan(PLAN_BULK_LIMITS.pro);
    expect(PLAN_BULK_LIMITS.pro).toBeLessThan(PLAN_BULK_LIMITS.bulk);
    expect(PLAN_BULK_LIMITS.bulk).toBeLessThan(PLAN_BULK_LIMITS.forwarder);
  });
  it("async threshold sits below the bulk plan limit", () => {
    expect(ASYNC_THRESHOLD_ROWS).toBeLessThan(PLAN_BULK_LIMITS.bulk);
  });
});
