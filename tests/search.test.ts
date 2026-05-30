import { describe, it, expect } from "vitest";
import { search } from "@/lib/search/index";

describe("search", () => {
  it("returns nothing for queries shorter than 2 chars", () => {
    expect(search("a")).toEqual([]);
    expect(search("")).toEqual([]);
  });

  it("finds the AfCFTA concept doc", () => {
    const results = search("afcfta");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.href.includes("/docs"))).toBe(true);
  });

  it("finds Rules of Origin docs", () => {
    const results = search("rules of origin");
    expect(results.some((r) => r.title.toLowerCase().includes("rules of origin"))).toBe(true);
  });

  it("ranks exact title matches highly", () => {
    const results = search("pricing");
    expect(results[0].title.toLowerCase()).toContain("pricing");
  });

  it("requires all tokens to be present", () => {
    const results = search("zzzznonexistent term");
    expect(results).toEqual([]);
  });

  it("respects the limit argument", () => {
    const results = search("a e i", 3);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it("returns results with required shape", () => {
    const [first] = search("certificate");
    if (first) {
      expect(first).toHaveProperty("id");
      expect(first).toHaveProperty("title");
      expect(first).toHaveProperty("href");
      expect(first).toHaveProperty("kind");
    }
  });
});
