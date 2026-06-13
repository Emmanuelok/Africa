import { describe, it, expect, beforeAll } from "vitest";

// Integration tests for the v1 public API. Hits the real route handlers
// in demo mode (no DATABASE_URL → v1-auth returns synthetic ok). No real
// network, no real DB — exercises auth, scope, request shape, and response
// invariants.

import { POST as classifyPost } from "@/app/api/v1/classify/route";
import { POST as originPost } from "@/app/api/v1/determine-origin/route";
import { GET as tariffGet } from "@/app/api/v1/tariff/route";
import { POST as certPost } from "@/app/api/v1/certificates/route";
import { POST as shipmentPost } from "@/app/api/v1/shipments/route";

// Synthetic key for tests. The dash keeps it out of secret-scanner patterns
// (Stripe's sk_test_<24 alnum>) while still matching our extractKey regex,
// which allows [A-Za-z0-9_-].
const KEY = "sk_test_unit-test-not-a-real-key";

function makeReq(url: string, init?: RequestInit & { headers?: Record<string, string> }): Request {
  const headers = new Headers(init?.headers);
  if (!headers.has("authorization")) headers.set("authorization", `Bearer ${KEY}`);
  return new Request(url, { ...init, headers });
}

beforeAll(() => {
  // Make sure rate-limit defaults to allow (no Upstash configured in tests)
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
});

describe("POST /api/v1/classify", () => {
  it("401 without Authorization header", async () => {
    const req = new Request("https://x/api/v1/classify", { method: "POST", body: JSON.stringify({ description: "coffee" }) });
    const res = await classifyPost(req);
    expect(res.status).toBe(401);
  });

  it("401 on malformed Authorization scheme", async () => {
    const req = makeReq("https://x/api/v1/classify", {
      method: "POST",
      headers: { authorization: "Basic abc" },
      body: JSON.stringify({ description: "coffee" })
    });
    const res = await classifyPost(req);
    expect(res.status).toBe(401);
  });

  it("400 when description missing", async () => {
    const req = makeReq("https://x/api/v1/classify", { method: "POST", body: JSON.stringify({}) });
    const res = await classifyPost(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error?.code).toBe("invalid_request");
  });

  it("classifies coffee and returns the documented shape", async () => {
    const req = makeReq("https://x/api/v1/classify", {
      method: "POST",
      body: JSON.stringify({ description: "Washed Arabica green coffee beans, AA grade" })
    });
    const res = await classifyPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hs_code).toBe("0901");
    expect(typeof json.confidence).toBe("number");
    expect(json.confidence).toBeLessThanOrEqual(1);
    expect(json.confidence).toBeGreaterThan(0);
    expect(["ai", "keyword", "cache"]).toContain(json.source);
    expect(Array.isArray(json.alternates)).toBe(true);
  });
});

describe("POST /api/v1/determine-origin", () => {
  it("400 without hs_code / origin / destination", async () => {
    const req = makeReq("https://x/api/v1/determine-origin", { method: "POST", body: JSON.stringify({}) });
    const res = await originPost(req);
    expect(res.status).toBe(400);
  });

  it("ag chapter wholly obtained → qualifies", async () => {
    const req = makeReq("https://x/api/v1/determine-origin", {
      method: "POST",
      body: JSON.stringify({ hs_code: "0901", origin: "KE", destination: "NG", whole_obtained: true })
    });
    const res = await originPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.qualifies).toBe("yes");
    expect(json.rule_applied).toMatch(/Wholly Obtained/);
    expect(json.origin).toBe("KE");
    expect(json.destination).toBe("NG");
  });

  it("industrial without CTH or RVC → does not qualify", async () => {
    const req = makeReq("https://x/api/v1/determine-origin", {
      method: "POST",
      body: JSON.stringify({ hs_code: "8501", origin: "KE", destination: "NG" })
    });
    const json = await (await originPost(req)).json();
    expect(json.qualifies).toBe("no");
  });
});

describe("GET /api/v1/tariff", () => {
  it("400 without hs", async () => {
    const res = await tariffGet(makeReq("https://x/api/v1/tariff"));
    expect(res.status).toBe(400);
  });

  it("returns rates for a known HS-4 code", async () => {
    const res = await tariffGet(makeReq("https://x/api/v1/tariff?hs=0901&origin=KE&destination=NG"));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hs_code).toBe("0901");
    expect(json.origin).toBe("KE");
    expect(typeof json.mfn_rate === "number" || json.mfn_rate === null).toBe(true);
  });
});

describe("POST /api/v1/certificates", () => {
  it("400 when required fields missing", async () => {
    const req = makeReq("https://x/api/v1/certificates", { method: "POST", body: JSON.stringify({}) });
    const res = await certPost(req);
    expect(res.status).toBe(400);
  });

  it("issues a certificate when payload is complete (demo path)", async () => {
    const req = makeReq("https://x/api/v1/certificates", {
      method: "POST",
      body: JSON.stringify({
        determination_id: "det_demo_001",
        hs_code: "0901.11",
        origin: "KE",
        destination: "NG",
        exporter: { name: "Highlands Coffee Cooperative", address: "Nyeri, Kenya" },
        consignee: { name: "Lagos Roasters Ltd", address: "Apapa, Lagos" }
      })
    });
    const res = await certPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.reference).toMatch(/^AFCFTA-[A-Z0-9]{8}$/);
    expect(json.qr_verification_url).toContain("/verify/");
    expect(json.pdf_url).toBeTruthy();
    expect(json.issued_at).toBeTruthy();
  });
});

describe("POST /api/v1/shipments", () => {
  it("400 without description/origin/destination", async () => {
    const req = makeReq("https://x/api/v1/shipments", { method: "POST", body: JSON.stringify({}) });
    const res = await shipmentPost(req);
    expect(res.status).toBe(400);
  });

  it("runs the full pipeline and returns the documented shape", async () => {
    const req = makeReq("https://x/api/v1/shipments", {
      method: "POST",
      body: JSON.stringify({
        description: "Washed Arabica green coffee beans, AA grade",
        origin: "KE",
        destination: "NG",
        fob_value_usd: 9300
      })
    });
    const res = await shipmentPost(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.determination_id).toBeTruthy();
    expect(json.classification?.hs_code).toBe("0901");
    expect(json.origin?.qualifies).toBeTruthy();
    expect(typeof json.tariff?.savings_usd).toBe("number");
    // No certificate unless explicitly requested + parties supplied
    expect(json.certificate).toBeNull();
  });

  it("attaches a certificate when generate_certificate + parties supplied", async () => {
    const req = makeReq("https://x/api/v1/shipments", {
      method: "POST",
      body: JSON.stringify({
        description: "Cocoa beans from Côte d'Ivoire, dried, fermented",
        origin: "CI",
        destination: "MA",
        fob_value_usd: 12000,
        whole_obtained: true,
        generate_certificate: true,
        exporter: { name: "Abidjan Cocoa Coop" },
        consignee: { name: "Casablanca Chocolate Co" }
      })
    });
    const json = await (await shipmentPost(req)).json();
    expect(json.certificate?.reference).toMatch(/^AFCFTA-[A-Z0-9]{8}$/);
  });

  it("respects Idempotency-Key — second call with same key returns the same body", async () => {
    const key = "test-idem-" + Math.random().toString(36).slice(2, 10);
    const body = JSON.stringify({
      description: "Sesame seeds, sortexed, food grade",
      origin: "SD",
      destination: "EG",
      fob_value_usd: 5000
    });
    const reqA = makeReq("https://x/api/v1/shipments", {
      method: "POST",
      body,
      headers: { authorization: `Bearer ${KEY}`, "idempotency-key": key }
    });
    const reqB = makeReq("https://x/api/v1/shipments", {
      method: "POST",
      body,
      headers: { authorization: `Bearer ${KEY}`, "idempotency-key": key }
    });
    const a = await (await shipmentPost(reqA)).json();
    const b = await (await shipmentPost(reqB)).json();
    expect(a.determination_id).toBe(b.determination_id);
    expect(a.classification.hs_code).toBe(b.classification.hs_code);
  });
});
