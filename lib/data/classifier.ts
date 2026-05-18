// Lightweight HS-code classifier driven by keyword matching.
// In production this is replaced by an Anthropic Claude call with the
// product description + a system prompt anchored to the HS 2022 nomenclature.

import { TARIFF_BOOK, type TariffEntry } from "./tariffs";

type KeywordMap = { keywords: string[]; hsPrefix: string; description: string };

const KEYWORD_MAP: KeywordMap[] = [
  { keywords: ["coffee", "arabica", "robusta", "green bean"], hsPrefix: "0901", description: "Coffee beans (green or roasted)" },
  { keywords: ["tea", "rooibos", "ctc", "orthodox"], hsPrefix: "0902", description: "Tea, black or green" },
  { keywords: ["cocoa", "cacao", "bean"], hsPrefix: "1801", description: "Cocoa beans, whole or broken" },
  { keywords: ["cashew"], hsPrefix: "0801", description: "Cashew nuts (raw or processed)" },
  { keywords: ["date", "fig", "pineapple"], hsPrefix: "0804", description: "Dates, figs, pineapples" },
  { keywords: ["vanilla", "bourbon vanilla"], hsPrefix: "0905", description: "Vanilla beans" },
  { keywords: ["sesame", "oilseed"], hsPrefix: "1207", description: "Sesame and other oil seeds" },
  { keywords: ["shea", "butter"], hsPrefix: "1515", description: "Vegetable fats — shea, palm kernel, others" },
  { keywords: ["chrome", "chromium", "ferrochrome"], hsPrefix: "2610", description: "Chromium ores and concentrates" },
  { keywords: ["crude", "petroleum", "oil"], hsPrefix: "2709", description: "Crude petroleum oils" },
  { keywords: ["lithium carbonate", "carbonate"], hsPrefix: "2836", description: "Carbonates including lithium" },
  { keywords: ["fertilizer", "dap", "map", "tsp", "phosphate", "urea"], hsPrefix: "3105", description: "Mineral or chemical fertilizers" },
  { keywords: ["rubber", "latex"], hsPrefix: "4001", description: "Natural rubber, latex" },
  { keywords: ["leather", "calfskin", "hide", "skin"], hsPrefix: "4107", description: "Finished bovine/equine leather" },
  { keywords: ["textile", "fabric", "ankara", "wax print", "cotton fabric", "cloth"], hsPrefix: "5208", description: "Woven cotton fabrics" },
  { keywords: ["gold", "bullion"], hsPrefix: "7108", description: "Gold, unwrought or semi-manufactured" },
  { keywords: ["copper", "cathode"], hsPrefix: "7403", description: "Refined copper and copper alloys" },
  { keywords: ["cobalt"], hsPrefix: "8105", description: "Cobalt and articles thereof" }
];

export type Classification = {
  hsPrefix: string;
  description: string;
  confidence: number; // 0..1
  tariff: TariffEntry | null;
  alternates: Array<{ hsPrefix: string; description: string; confidence: number }>;
};

export function classifyProduct(description: string): Classification {
  const lc = description.toLowerCase();
  const scored = KEYWORD_MAP.map((m) => {
    const hits = m.keywords.filter((k) => lc.includes(k)).length;
    const longestHit = Math.max(0, ...m.keywords.filter((k) => lc.includes(k)).map((k) => k.length));
    return { ...m, score: hits * 10 + longestHit };
  })
    .filter((m) => m.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    // Fallback — pick first agricultural HS as low-confidence guess
    const fallback = KEYWORD_MAP[0];
    return {
      hsPrefix: fallback.hsPrefix,
      description: "Unable to classify with high confidence — please review",
      confidence: 0.18,
      tariff: TARIFF_BOOK.find((t) => t.hsPrefix === fallback.hsPrefix) ?? null,
      alternates: []
    };
  }

  const top = scored[0];
  const total = scored.reduce((s, x) => s + x.score, 0);
  const confidence = Math.min(0.98, 0.55 + (top.score / total) * 0.4);

  return {
    hsPrefix: top.hsPrefix,
    description: top.description,
    confidence,
    tariff: TARIFF_BOOK.find((t) => t.hsPrefix === top.hsPrefix) ?? null,
    alternates: scored.slice(1, 4).map((s) => ({
      hsPrefix: s.hsPrefix,
      description: s.description,
      confidence: Math.min(0.6, (s.score / total) * 0.8)
    }))
  };
}

// Origin determination engine
export type OriginInputs = {
  hsChapter: string; // e.g. "0901"
  wholeObtained?: boolean; // for ag/mineral chapters
  inputsImportedFromOutsideAfrica?: boolean; // for industrial
  changeOfTariffHeading?: boolean;
  regionalValueContent?: number; // 0..100 (percent value added in AfCFTA)
  underwentSubstantialTransformation?: boolean;
};

export type OriginResult = {
  qualifies: "yes" | "no" | "marginal";
  rule: string;
  reasoning: string[];
};

export function determineOrigin(inputs: OriginInputs): OriginResult {
  const chapter = parseInt(inputs.hsChapter.slice(0, 2), 10);

  // Chapters 1-15, 25-27 — wholly obtained rule
  if ((chapter >= 1 && chapter <= 15) || (chapter >= 25 && chapter <= 27)) {
    if (inputs.wholeObtained) {
      return {
        qualifies: "yes",
        rule: "Wholly Obtained (WO)",
        reasoning: [
          "Goods in this HS chapter qualify when all raw materials are grown, harvested, mined, or born within an AfCFTA State Party.",
          "You confirmed all inputs originate within Africa.",
          "Eligible for AfCFTA preferential rate."
        ]
      };
    }
    return {
      qualifies: "no",
      rule: "Wholly Obtained (WO)",
      reasoning: [
        "Agricultural and mineral goods in HS chapters 1-15 and 25-27 require all materials to be wholly obtained in an AfCFTA state.",
        "You indicated that not all inputs are African-origin.",
        "Goods do not qualify for AfCFTA preferential treatment — MFN rate applies."
      ]
    };
  }

  // Chapters 50-63 (textiles) — yarn-forward, two-stage transformation
  if (chapter >= 50 && chapter <= 63) {
    if (inputs.underwentSubstantialTransformation && inputs.changeOfTariffHeading && (inputs.regionalValueContent ?? 0) >= 35) {
      return {
        qualifies: "yes",
        rule: "Yarn-forward / Double transformation",
        reasoning: [
          "Textile and apparel goods (HS 50-63) require yarn-forward processing: yarn spun and fabric woven/knitted within an AfCFTA state.",
          `You confirmed substantial transformation occurred with ${inputs.regionalValueContent}% regional value content.`,
          "Cut-and-sew from imported fabric does not satisfy this rule — but your operations exceed that threshold."
        ]
      };
    }
    return {
      qualifies: "no",
      rule: "Yarn-forward / Double transformation",
      reasoning: [
        "Textiles require both yarn spinning and fabric formation inside AfCFTA states (the 'yarn-forward' rule).",
        "Either change-of-heading was not satisfied or regional value content was below 35%.",
        "Goods do not qualify for AfCFTA preferential treatment."
      ]
    };
  }

  // Industrial / processed chapters (16-24, 28-49, 64-83, 90-97)
  // Rule of thumb: CTH OR ≥40% RVC
  const cth = !!inputs.changeOfTariffHeading;
  const rvc = inputs.regionalValueContent ?? 0;
  if (cth || rvc >= 40) {
    return {
      qualifies: "yes",
      rule: "Change of Tariff Heading (CTH) or ≥40% Regional Value Content",
      reasoning: [
        "Processed and industrial goods qualify either by changing tariff heading from inputs to output, or by adding ≥40% value within AfCFTA states.",
        cth ? "Change of tariff heading: confirmed." : `Regional value content: ${rvc}% (≥40% threshold met).`,
        "Eligible for AfCFTA preferential rate."
      ]
    };
  }

  if (rvc >= 30) {
    return {
      qualifies: "marginal",
      rule: "Change of Tariff Heading (CTH) or ≥40% Regional Value Content",
      reasoning: [
        `Regional value content of ${rvc}% is below the 40% threshold but close.`,
        "Consider sourcing more inputs from AfCFTA states, or applying for a product-specific rule under the AfCFTA Annex 2 schedule.",
        "Marginal — request confirmation from your national AfCFTA focal point before claiming preferences."
      ]
    };
  }

  return {
    qualifies: "no",
    rule: "Change of Tariff Heading (CTH) or ≥40% Regional Value Content",
    reasoning: [
      "Neither change of tariff heading nor 40% regional value content was satisfied.",
      `Regional value content: ${rvc}%. Required: ≥40%.`,
      "Goods do not qualify for AfCFTA preferential treatment — MFN rate applies."
    ]
  };
}
