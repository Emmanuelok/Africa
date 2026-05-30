import { describe, it, expect } from "vitest";
import { classifyProduct, determineOrigin } from "@/lib/data/classifier";

describe("classifyProduct", () => {
  it("classifies coffee to HS 0901 with high confidence", () => {
    const r = classifyProduct("Washed Arabica green coffee beans, AA grade");
    expect(r.hsPrefix).toBe("0901");
    expect(r.confidence).toBeGreaterThan(0.5);
    expect(r.tariff).not.toBeNull();
  });

  it("classifies cocoa to HS 1801", () => {
    expect(classifyProduct("raw cocoa beans from Côte d'Ivoire").hsPrefix).toBe("1801");
  });

  it("classifies leather to HS 4107", () => {
    expect(classifyProduct("chrome-tanned full-grain calfskin leather").hsPrefix).toBe("4107");
  });

  it("classifies copper cathode to HS 7403", () => {
    expect(classifyProduct("refined copper cathode 99.99%").hsPrefix).toBe("7403");
  });

  it("returns a low-confidence fallback for unknown products", () => {
    const r = classifyProduct("xyzzy nonsense widget gadget");
    expect(r.confidence).toBeLessThan(0.3);
    expect(r.description).toMatch(/review/i);
  });

  it("confidence never exceeds 0.98", () => {
    const r = classifyProduct("coffee arabica robusta green bean");
    expect(r.confidence).toBeLessThanOrEqual(0.98);
  });

  it("returns up to 3 alternates", () => {
    const r = classifyProduct("cocoa cashew sesame leather copper gold");
    expect(r.alternates.length).toBeLessThanOrEqual(3);
  });
});

describe("determineOrigin", () => {
  it("agricultural goods wholly obtained → qualifies", () => {
    const r = determineOrigin({ hsChapter: "0901", wholeObtained: true });
    expect(r.qualifies).toBe("yes");
    expect(r.rule).toMatch(/Wholly Obtained/);
  });

  it("agricultural goods not wholly obtained → does not qualify", () => {
    const r = determineOrigin({ hsChapter: "0901", wholeObtained: false });
    expect(r.qualifies).toBe("no");
  });

  it("textiles need yarn-forward + CTH + RVC≥35 → qualifies", () => {
    const r = determineOrigin({
      hsChapter: "5208",
      underwentSubstantialTransformation: true,
      changeOfTariffHeading: true,
      regionalValueContent: 40
    });
    expect(r.qualifies).toBe("yes");
    expect(r.rule).toMatch(/Yarn-forward/);
  });

  it("textiles below RVC threshold → does not qualify", () => {
    const r = determineOrigin({
      hsChapter: "5208",
      underwentSubstantialTransformation: true,
      changeOfTariffHeading: true,
      regionalValueContent: 20
    });
    expect(r.qualifies).toBe("no");
  });

  it("industrial goods with CTH → qualifies", () => {
    const r = determineOrigin({ hsChapter: "8501", changeOfTariffHeading: true });
    expect(r.qualifies).toBe("yes");
  });

  it("industrial goods with ≥40% RVC → qualifies", () => {
    const r = determineOrigin({ hsChapter: "8501", regionalValueContent: 45 });
    expect(r.qualifies).toBe("yes");
  });

  it("industrial goods 30-39% RVC → marginal", () => {
    const r = determineOrigin({ hsChapter: "8501", regionalValueContent: 33 });
    expect(r.qualifies).toBe("marginal");
  });

  it("every result carries reasoning lines", () => {
    const r = determineOrigin({ hsChapter: "0901", wholeObtained: true });
    expect(r.reasoning.length).toBeGreaterThan(0);
    expect(typeof r.reasoning[0]).toBe("string");
  });
});
