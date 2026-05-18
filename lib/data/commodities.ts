export type Commodity = {
  symbol: string;
  name: string;
  category: "Agriculture" | "Metals" | "Energy" | "Soft";
  unit: string;
  price: number; // USD
  change24h: number; // percent
  topProducers: string[]; // country codes
  hsCode: string;
};

// Indicative prices (May 2026 ballpark). Mock — refresh from real feeds in production.
export const COMMODITIES: Commodity[] = [
  {
    symbol: "COCOA",
    name: "Cocoa Beans",
    category: "Soft",
    unit: "MT",
    price: 8420,
    change24h: 1.42,
    topProducers: ["CI", "GH", "CM", "NG"],
    hsCode: "1801.00"
  },
  {
    symbol: "COFFEE-A",
    name: "Coffee (Arabica)",
    category: "Soft",
    unit: "MT",
    price: 7180,
    change24h: -0.62,
    topProducers: ["ET", "KE", "UG", "RW"],
    hsCode: "0901.11"
  },
  {
    symbol: "COBALT",
    name: "Cobalt",
    category: "Metals",
    unit: "MT",
    price: 33500,
    change24h: 2.18,
    topProducers: ["CD", "ZM", "MA"],
    hsCode: "8105.20"
  },
  {
    symbol: "COPPER",
    name: "Copper Cathode",
    category: "Metals",
    unit: "MT",
    price: 9685,
    change24h: 0.34,
    topProducers: ["ZM", "CD", "ZA"],
    hsCode: "7403.11"
  },
  {
    symbol: "GOLD",
    name: "Gold",
    category: "Metals",
    unit: "oz",
    price: 2980,
    change24h: 0.18,
    topProducers: ["ZA", "GH", "ML", "BF"],
    hsCode: "7108.13"
  },
  {
    symbol: "LITHIUM",
    name: "Lithium Carbonate",
    category: "Metals",
    unit: "MT",
    price: 14200,
    change24h: -1.04,
    topProducers: ["ZW", "NA", "CD"],
    hsCode: "2836.91"
  },
  {
    symbol: "CASHEW",
    name: "Cashew Nuts (raw)",
    category: "Agriculture",
    unit: "MT",
    price: 1390,
    change24h: 0.84,
    topProducers: ["CI", "TZ", "GW", "BJ"],
    hsCode: "0801.31"
  },
  {
    symbol: "SESAME",
    name: "Sesame Seeds",
    category: "Agriculture",
    unit: "MT",
    price: 1820,
    change24h: 0.42,
    topProducers: ["SD", "ET", "NG", "TZ"],
    hsCode: "1207.40"
  },
  {
    symbol: "VANILLA",
    name: "Vanilla (Bourbon)",
    category: "Soft",
    unit: "kg",
    price: 96,
    change24h: -2.10,
    topProducers: ["MG", "UG", "KE"],
    hsCode: "0905.10"
  },
  {
    symbol: "OIL-NG",
    name: "Crude (Bonny Light)",
    category: "Energy",
    unit: "bbl",
    price: 78.4,
    change24h: 0.62,
    topProducers: ["NG", "AO", "GA", "DZ"],
    hsCode: "2709.00"
  },
  {
    symbol: "TEA",
    name: "Tea (CTC)",
    category: "Agriculture",
    unit: "kg",
    price: 2.45,
    change24h: 0.12,
    topProducers: ["KE", "RW", "UG", "MW"],
    hsCode: "0902.40"
  },
  {
    symbol: "RUBBER",
    name: "Natural Rubber",
    category: "Agriculture",
    unit: "MT",
    price: 2150,
    change24h: -0.28,
    topProducers: ["CI", "LR", "NG", "CM"],
    hsCode: "4001.21"
  }
];
