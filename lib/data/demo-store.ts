// Demo data used when DATABASE_URL isn't set. Lets the dashboard, API key
// listings, and history pages render coherently before customers connect
// a real DB. Same shape as the DB tables so swapping is trivial.

export type DemoDetermination = {
  id: string;
  description: string;
  hsCode: string;
  confidence: number;
  originCountry: string;
  destinationCountry: string;
  quantity: number;
  fobValueUsd: number;
  qualifies: "yes" | "no" | "marginal";
  ruleApplied: string;
  mfnRate: number;
  afcftaRate: number;
  savingsUsd: number;
  createdAt: string;
};

export type DemoCertificate = {
  id: string;
  reference: string;
  determinationId: string;
  hsCode: string;
  originCountry: string;
  destinationCountry: string;
  exporterName: string;
  consigneeName: string;
  endorsedByAuthority: boolean;
  createdAt: string;
};

export type DemoApiKey = {
  id: string;
  name: string;
  prefix: string;
  maskedKey: string;
  scopes?: string[];
  lastUsedAt: string | null;
  createdAt: string;
};

export const DEMO_DETERMINATIONS: DemoDetermination[] = [
  {
    id: "det_demo_001",
    description: "Washed Arabica green coffee beans, AA grade, screen 17/64, 60kg jute bags",
    hsCode: "0901.11",
    confidence: 0.96,
    originCountry: "KE",
    destinationCountry: "NG",
    quantity: 1500,
    fobValueUsd: 9300,
    qualifies: "yes",
    ruleApplied: "Wholly Obtained (Article 5)",
    mfnRate: 12.5,
    afcftaRate: 2.5,
    savingsUsd: 930,
    createdAt: "2026-05-17T14:22:00Z"
  },
  {
    id: "det_demo_002",
    description: "Chrome-tanned full-grain calfskin leather, 1.0-1.2mm, finished",
    hsCode: "4107.11",
    confidence: 0.88,
    originCountry: "ET",
    destinationCountry: "EG",
    quantity: 800,
    fobValueUsd: 14400,
    qualifies: "yes",
    ruleApplied: "Change of Tariff Heading + 45% RVC",
    mfnRate: 10.0,
    afcftaRate: 0,
    savingsUsd: 1440,
    createdAt: "2026-05-15T09:14:00Z"
  },
  {
    id: "det_demo_003",
    description: "100% combed cotton wax-print fabric, 110gsm, 45-inch width",
    hsCode: "5208.52",
    confidence: 0.92,
    originCountry: "CI",
    destinationCountry: "GH",
    quantity: 5000,
    fobValueUsd: 22500,
    qualifies: "marginal",
    ruleApplied: "Yarn-forward (Textiles Annex)",
    mfnRate: 15.0,
    afcftaRate: 7.5,
    savingsUsd: 1687,
    createdAt: "2026-05-12T11:48:00Z"
  },
  {
    id: "det_demo_004",
    description: "Raw shea butter, unrefined, food grade, 25kg drums",
    hsCode: "1515.90",
    confidence: 0.94,
    originCountry: "GH",
    destinationCountry: "MA",
    quantity: 2500,
    fobValueUsd: 6250,
    qualifies: "yes",
    ruleApplied: "Wholly Obtained (Article 5)",
    mfnRate: 8.0,
    afcftaRate: 0,
    savingsUsd: 500,
    createdAt: "2026-05-10T16:03:00Z"
  },
  {
    id: "det_demo_005",
    description: "Hibiscus dried flowers, ISO-certified, 50kg woven bags",
    hsCode: "1211.90",
    confidence: 0.85,
    originCountry: "SD",
    destinationCountry: "SN",
    quantity: 3200,
    fobValueUsd: 11200,
    qualifies: "yes",
    ruleApplied: "Wholly Obtained (Article 5)",
    mfnRate: 5.0,
    afcftaRate: 0,
    savingsUsd: 560,
    createdAt: "2026-05-08T08:30:00Z"
  }
];

export const DEMO_CERTIFICATES: DemoCertificate[] = [
  {
    id: "cert_demo_001",
    reference: "AFCFTA-K9P4XJ02",
    determinationId: "det_demo_001",
    hsCode: "0901.11",
    originCountry: "KE",
    destinationCountry: "NG",
    exporterName: "Highlands Coffee Cooperative",
    consigneeName: "Lagos Roasters Ltd",
    endorsedByAuthority: true,
    createdAt: "2026-05-17T14:25:00Z"
  },
  {
    id: "cert_demo_002",
    reference: "AFCFTA-J2K7M3P9",
    determinationId: "det_demo_002",
    hsCode: "4107.11",
    originCountry: "ET",
    destinationCountry: "EG",
    exporterName: "Highlands Coffee Cooperative",
    consigneeName: "Cairo Footwear Manufacturing",
    endorsedByAuthority: false,
    createdAt: "2026-05-15T09:18:00Z"
  },
  {
    id: "cert_demo_003",
    reference: "AFCFTA-H4B7N1Q5",
    determinationId: "det_demo_004",
    hsCode: "1515.90",
    originCountry: "GH",
    destinationCountry: "MA",
    exporterName: "Highlands Coffee Cooperative",
    consigneeName: "Atlas Cosmetics Casablanca",
    endorsedByAuthority: true,
    createdAt: "2026-05-10T16:08:00Z"
  }
];

export const DEMO_API_KEYS: DemoApiKey[] = [
  {
    id: "key_demo_001",
    name: "production-erp",
    prefix: "sk_live_",
    maskedKey: "sk_live_••••••••••••XbnZ",
    lastUsedAt: "2026-05-18T10:14:00Z",
    createdAt: "2026-04-22T11:02:00Z"
  },
  {
    id: "key_demo_002",
    name: "staging-erp",
    prefix: "sk_test_",
    maskedKey: "sk_test_••••••••••••Mq2R",
    lastUsedAt: "2026-05-16T08:21:00Z",
    createdAt: "2026-04-22T11:03:00Z"
  }
];

// Aggregated dashboard metrics — derived from the demo set above.
export function demoMetrics() {
  const det = DEMO_DETERMINATIONS;
  const cert = DEMO_CERTIFICATES;
  return {
    totalDeterminations: det.length,
    totalCertificates: cert.length,
    totalSavingsUsd: det.reduce((s, d) => s + d.savingsUsd, 0),
    qualifyingRate: det.filter((d) => d.qualifies === "yes").length / det.length,
    totalFobValueUsd: det.reduce((s, d) => s + d.fobValueUsd, 0)
  };
}
