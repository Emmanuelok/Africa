import { describe, it, expect } from "vitest";
import { generateSync } from "otplib";
import {
  generateTotpSecret,
  buildOtpAuthUrl,
  verifyTotpToken,
  generateRecoveryCodes,
  hashRecoveryCode,
  consumeRecoveryCode
} from "@/lib/auth/totp";

describe("TOTP secret + verify", () => {
  it("generates a non-empty base32 secret", () => {
    const s = generateTotpSecret();
    expect(s).toMatch(/^[A-Z2-7]{16,}$/);
  });

  it("verifyTotpToken accepts the current code for the secret", () => {
    const s = generateTotpSecret();
    const code = generateSync({ secret: s });
    expect(verifyTotpToken(code, s)).toBe(true);
  });

  it("rejects wrong tokens", () => {
    const s = generateTotpSecret();
    expect(verifyTotpToken("000000", s)).toBe(false);
  });

  it("rejects non-6-digit input", () => {
    const s = generateTotpSecret();
    expect(verifyTotpToken("abc123", s)).toBe(false);
    expect(verifyTotpToken("12345", s)).toBe(false);
  });
});

describe("otpauth URL", () => {
  it("contains issuer + account", () => {
    const url = buildOtpAuthUrl("user@example.com", "JBSWY3DPEHPK3PXP");
    expect(url).toContain("otpauth://totp/");
    expect(url).toContain("Sokoni");
    expect(url).toContain("user%40example.com");
  });
});

describe("recovery codes", () => {
  it("generates the requested number, all unique", () => {
    const codes = generateRecoveryCodes(8);
    expect(codes).toHaveLength(8);
    expect(new Set(codes).size).toBe(8);
  });

  it("formats as XXXXX-XXXXX", () => {
    for (const c of generateRecoveryCodes(4)) {
      expect(c).toMatch(/^[A-Z0-9]{5}-[A-Z0-9]{5}$/);
    }
  });

  it("hashRecoveryCode is deterministic and ignores dashes/case", () => {
    expect(hashRecoveryCode("ABCDE-12345")).toBe(hashRecoveryCode("abcde12345"));
  });

  it("consumeRecoveryCode returns shortened list on hit", () => {
    const codes = generateRecoveryCodes(3);
    const hashed = codes.map(hashRecoveryCode);
    const remaining = consumeRecoveryCode(codes[1], hashed);
    expect(remaining).not.toBeNull();
    expect(remaining).toHaveLength(2);
    expect(remaining).not.toContain(hashRecoveryCode(codes[1]));
  });

  it("consumeRecoveryCode returns null on miss", () => {
    const codes = generateRecoveryCodes(3);
    const hashed = codes.map(hashRecoveryCode);
    expect(consumeRecoveryCode("NOPE0-NOPE0", hashed)).toBeNull();
  });
});
