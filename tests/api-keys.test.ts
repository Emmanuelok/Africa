import { describe, it, expect } from "vitest";
import { generateApiKey, sha256, maskKey, safeHashEqual, extractKey } from "@/lib/api/keys";

describe("generateApiKey", () => {
  it("produces a live key with the right prefix", () => {
    const k = generateApiKey("live");
    expect(k.plaintext.startsWith("sk_live_")).toBe(true);
    expect(k.prefix).toBe("sk_live_");
  });

  it("produces a test key with the right prefix", () => {
    expect(generateApiKey("test").plaintext.startsWith("sk_test_")).toBe(true);
  });

  it("hash matches sha256 of the plaintext", () => {
    const k = generateApiKey();
    expect(k.hash).toBe(sha256(k.plaintext));
  });

  it("suffix is the last 4 chars of the random segment", () => {
    const k = generateApiKey();
    expect(k.plaintext.endsWith(k.suffix)).toBe(true);
    expect(k.suffix).toHaveLength(4);
  });

  it("generates unique keys", () => {
    const a = generateApiKey();
    const b = generateApiKey();
    expect(a.plaintext).not.toBe(b.plaintext);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe("sha256", () => {
  it("is deterministic", () => {
    expect(sha256("hello")).toBe(sha256("hello"));
  });
  it("produces 64 hex chars", () => {
    expect(sha256("anything")).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("maskKey", () => {
  it("masks the middle and keeps prefix + suffix", () => {
    const masked = maskKey("sk_live_", "XbnZ");
    expect(masked.startsWith("sk_live_")).toBe(true);
    expect(masked.endsWith("XbnZ")).toBe(true);
    expect(masked).toContain("•");
  });
});

describe("safeHashEqual", () => {
  it("true for identical strings", () => {
    expect(safeHashEqual("abc123", "abc123")).toBe(true);
  });
  it("false for different strings of same length", () => {
    expect(safeHashEqual("abc123", "abc124")).toBe(false);
  });
  it("false for different lengths", () => {
    expect(safeHashEqual("abc", "abcd")).toBe(false);
  });
});

describe("extractKey", () => {
  function reqWith(auth?: string): Request {
    return new Request("https://sokoni.africa/api/v1/classify", {
      headers: auth ? { authorization: auth } : {}
    });
  }
  it("extracts a valid live key", () => {
    expect(extractKey(reqWith("Bearer sk_live_abcDEF123_-xyz"))).toBe("sk_live_abcDEF123_-xyz");
  });
  it("extracts a valid test key", () => {
    expect(extractKey(reqWith("Bearer sk_test_abc123"))).toBe("sk_test_abc123");
  });
  it("returns null without a header", () => {
    expect(extractKey(reqWith())).toBeNull();
  });
  it("returns null for a malformed scheme", () => {
    expect(extractKey(reqWith("Basic sk_live_abc"))).toBeNull();
  });
  it("returns null for a non-sokoni token", () => {
    expect(extractKey(reqWith("Bearer abc123"))).toBeNull();
  });
});
