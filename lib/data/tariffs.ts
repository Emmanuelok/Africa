// Simplified AfCFTA tariff lookup. Real implementation would query the
// AfCFTA Tariff Book + MAcMap. Indicative MFN rates and AfCFTA preferential
// schedule (Category A = liberalised over 5 yrs, B = 10 yrs, C = sensitive).

export type TariffEntry = {
  hsPrefix: string; // e.g. "0901"
  description: string;
  mfnRate: number; // %
  afcftaCategory: "A" | "B" | "C";
  // Indicative preferential rate after current phase-down (May 2026)
  afcftaRate: number; // %
};

export const TARIFF_BOOK: TariffEntry[] = [
  { hsPrefix: "0901", description: "Coffee, roasted or not", mfnRate: 12.5, afcftaCategory: "A", afcftaRate: 2.5 },
  { hsPrefix: "0902", description: "Tea, black/green", mfnRate: 25.0, afcftaCategory: "A", afcftaRate: 5.0 },
  { hsPrefix: "1801", description: "Cocoa beans, whole or broken", mfnRate: 5.0, afcftaCategory: "A", afcftaRate: 0 },
  { hsPrefix: "0801", description: "Nuts (cashew, coconut, brazil)", mfnRate: 20.0, afcftaCategory: "A", afcftaRate: 4.0 },
  { hsPrefix: "0804", description: "Dates, figs, pineapples", mfnRate: 20.0, afcftaCategory: "A", afcftaRate: 4.0 },
  { hsPrefix: "0905", description: "Vanilla", mfnRate: 10.0, afcftaCategory: "A", afcftaRate: 2.0 },
  { hsPrefix: "1207", description: "Oil seeds — sesame, others", mfnRate: 10.0, afcftaCategory: "A", afcftaRate: 2.0 },
  { hsPrefix: "1515", description: "Vegetable fats — shea, others", mfnRate: 15.0, afcftaCategory: "A", afcftaRate: 3.0 },
  { hsPrefix: "2610", description: "Chromium ores and concentrates", mfnRate: 0, afcftaCategory: "A", afcftaRate: 0 },
  { hsPrefix: "2709", description: "Crude petroleum oils", mfnRate: 0, afcftaCategory: "A", afcftaRate: 0 },
  { hsPrefix: "2836", description: "Carbonates — lithium etc.", mfnRate: 5.0, afcftaCategory: "B", afcftaRate: 2.5 },
  { hsPrefix: "3105", description: "Mineral or chemical fertilizers", mfnRate: 5.0, afcftaCategory: "A", afcftaRate: 1.0 },
  { hsPrefix: "4001", description: "Natural rubber", mfnRate: 5.0, afcftaCategory: "A", afcftaRate: 1.0 },
  { hsPrefix: "4107", description: "Finished bovine/equine leather", mfnRate: 20.0, afcftaCategory: "B", afcftaRate: 10.0 },
  { hsPrefix: "5208", description: "Woven cotton fabrics", mfnRate: 25.0, afcftaCategory: "B", afcftaRate: 12.5 },
  { hsPrefix: "7108", description: "Gold, unwrought or semi-manufactured", mfnRate: 0, afcftaCategory: "A", afcftaRate: 0 },
  { hsPrefix: "7403", description: "Refined copper and copper alloys", mfnRate: 5.0, afcftaCategory: "A", afcftaRate: 1.0 },
  { hsPrefix: "8105", description: "Cobalt and articles thereof", mfnRate: 5.0, afcftaCategory: "B", afcftaRate: 2.5 }
];

export function lookupTariff(hsCode: string): TariffEntry | null {
  const prefix = hsCode.replace(/\./g, "").slice(0, 4);
  return TARIFF_BOOK.find((t) => t.hsPrefix === prefix) ?? null;
}

// Rules-of-Origin criteria per HS chapter (simplified)
export type RooCriterion = {
  hsChapter: string;
  rule: string;
  example: string;
};

export const ROO_CRITERIA: RooCriterion[] = [
  {
    hsChapter: "01-15 (Agriculture, animal, vegetable)",
    rule: "Wholly Obtained (WO)",
    example: "Coffee beans grown and harvested in Ethiopia — qualifies as Ethiopian-origin."
  },
  {
    hsChapter: "16-24 (Processed food, beverages)",
    rule: "Change of Tariff Heading (CTH) or ≤40% non-originating materials",
    example: "Cocoa beans (1801) processed into cocoa butter (1804) in Ghana — CTH satisfied."
  },
  {
    hsChapter: "25-27 (Mineral products)",
    rule: "Wholly Obtained (WO)",
    example: "Copper ore mined in Zambia — qualifies."
  },
  {
    hsChapter: "28-38 (Chemicals)",
    rule: "Chemical reaction or ≤50% non-originating materials",
    example: "Phosphoric acid made via chemical reaction from imported phosphate rock — qualifies."
  },
  {
    hsChapter: "39-40 (Plastics, rubber)",
    rule: "CTH or ≤45% non-originating materials",
    example: "Rubber bales (4001) compounded into latex (4002) — qualifies."
  },
  {
    hsChapter: "41-43 (Hides, leather)",
    rule: "Tanning + finishing within Africa, ≤40% non-originating",
    example: "Raw hides tanned and finished in Ethiopia — qualifies."
  },
  {
    hsChapter: "50-63 (Textiles, apparel)",
    rule: "Yarn-forward or double transformation",
    example: "Cotton spun, woven and printed in Nigeria — qualifies; cut-and-sew from imported fabric does not."
  },
  {
    hsChapter: "84-85 (Machinery, electrical)",
    rule: "CTH + ≥35% regional value content",
    example: "Components from multiple AfCFTA states assembled in Kenya, with ≥35% RVC — qualifies."
  },
  {
    hsChapter: "87 (Vehicles)",
    rule: "CTH + ≥40% RVC",
    example: "Vehicle assembled in South Africa, ≥40% RVC — qualifies; CKD imports do not."
  }
];
