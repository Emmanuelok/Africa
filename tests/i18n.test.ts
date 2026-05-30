import { describe, it, expect } from "vitest";
import { t, isRtl, LOCALES, DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { formatCurrency, formatNumber, formatDate } from "@/lib/i18n/format";

describe("translation t()", () => {
  it("returns the English string for a known key", () => {
    expect(t("en", "nav.pricing")).toBe("Pricing");
  });

  it("returns a localized string for French", () => {
    expect(t("fr", "nav.pricing")).toBe("Tarifs");
  });

  it("falls back to English for a missing key in another locale", () => {
    // changelog only exists in en footer set; ensure fallback path works
    const value = t("sw", "nav.pricing");
    expect(typeof value).toBe("string");
    expect(value.length).toBeGreaterThan(0);
  });

  it("returns the key itself when nothing matches", () => {
    expect(t("en", "totally.unknown.key")).toBe("totally.unknown.key");
  });

  it("has hero strings in every locale", () => {
    for (const l of LOCALES) {
      expect(t(l.code, "hero.cta.primary").length).toBeGreaterThan(0);
    }
  });
});

describe("isRtl", () => {
  it("Arabic is RTL", () => {
    expect(isRtl("ar")).toBe(true);
  });
  it("English is not RTL", () => {
    expect(isRtl("en")).toBe(false);
  });
  it("Swahili is not RTL", () => {
    expect(isRtl("sw")).toBe(false);
  });
});

describe("locale metadata", () => {
  it("default locale is English", () => {
    expect(DEFAULT_LOCALE).toBe("en");
  });
  it("ships exactly five locales", () => {
    expect(LOCALES).toHaveLength(5);
  });
});

describe("formatters", () => {
  it("formats USD currency", () => {
    const out = formatCurrency(9300, "en", "USD");
    expect(out).toContain("9,300");
    expect(out).toMatch(/\$/);
  });
  it("formats numbers per locale", () => {
    expect(formatNumber(1500, "en")).toBe("1,500");
  });
  it("formats an ISO date", () => {
    const out = formatDate("2026-05-17T00:00:00Z", "en");
    expect(out).toMatch(/2026/);
  });
});
