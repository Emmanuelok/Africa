export type Product = {
  id: string;
  name: string;
  category: string;
  supplierId: string;
  hsCode: string;
  pricePerUnit: number;
  currency: string;
  unit: string;
  moq: number; // minimum order quantity
  leadTimeDays: number;
  inStock: number;
  origin: string; // ISO-2
  image: string; // emoji as placeholder
  tags: string[];
  description: string;
  specs: Record<string, string>;
};

export const PRODUCTS: Product[] = [
  {
    id: "p-001",
    name: "AA Grade Arabica Green Coffee Beans",
    category: "Coffee",
    supplierId: "s-ke-001",
    hsCode: "0901.11",
    pricePerUnit: 6.20,
    currency: "USD",
    unit: "kg",
    moq: 1500,
    leadTimeDays: 14,
    inStock: 42000,
    origin: "KE",
    image: "☕",
    tags: ["Single origin", "Washed", "Specialty"],
    description:
      "Premium AA-grade washed Arabica from 1,800–2,100m altitude. Cup score 86+, bright acidity, blackcurrant notes.",
    specs: {
      "Screen size": "AA (≥17/64\")",
      "Moisture": "10-12%",
      "Defects (Cat 1)": "0",
      "Packaging": "60kg jute with GrainPro liner",
      "Certifications": "Rainforest Alliance, Fair Trade"
    }
  },
  {
    id: "p-002",
    name: "Premium Cocoa Beans (Main Crop)",
    category: "Cocoa",
    supplierId: "s-ci-002",
    hsCode: "1801.00",
    pricePerUnit: 8.42,
    currency: "USD",
    unit: "kg",
    moq: 25000,
    leadTimeDays: 21,
    inStock: 380000,
    origin: "CI",
    image: "🍫",
    tags: ["Main crop", "Fermented", "Sun-dried"],
    description:
      "Well-fermented, sun-dried cocoa beans. Bean count 95-105/100g. Suitable for premium chocolate production.",
    specs: {
      "Bean count": "95-105 / 100g",
      "Moisture": "<7.5%",
      "Mouldy beans": "<3%",
      "Packaging": "62.5kg jute bags",
      "Loadability": "12 MT/20'FCL"
    }
  },
  {
    id: "p-003",
    name: "Ankara Wax Print Fabric — 6 yard bundles",
    category: "Textiles",
    supplierId: "s-ng-003",
    hsCode: "5208.52",
    pricePerUnit: 18.50,
    currency: "USD",
    unit: "bundle",
    moq: 200,
    leadTimeDays: 28,
    inStock: 12500,
    origin: "NG",
    image: "🧵",
    tags: ["100% cotton", "Wax print", "African design"],
    description:
      "Authentic wax-print cotton in classic African motifs. 100% combed cotton, 110gsm, vat-dyed for color fastness.",
    specs: {
      "Composition": "100% combed cotton",
      "Weight": "110 gsm",
      "Width": "44/45 inches",
      "Bundle": "6 yards",
      "Certification": "OEKO-TEX 100"
    }
  },
  {
    id: "p-004",
    name: "Chrome Ore (Lumpy, 42% Cr2O3)",
    category: "Metals",
    supplierId: "s-za-004",
    hsCode: "2610.00",
    pricePerUnit: 240,
    currency: "USD",
    unit: "MT",
    moq: 5000,
    leadTimeDays: 30,
    inStock: 85000,
    origin: "ZA",
    image: "⛏️",
    tags: ["Metallurgical grade", "FOB Durban"],
    description:
      "Lumpy chrome ore from Bushveld Complex. Suitable for ferrochrome smelting. FOB Durban; CIF available.",
    specs: {
      "Cr2O3": "42% min",
      "Cr/Fe ratio": "1.5:1",
      "Size": "10-100mm",
      "Moisture": "<2%",
      "Loading port": "Durban / Maputo"
    }
  },
  {
    id: "p-005",
    name: "Medjool Dates (Jumbo)",
    category: "Agriculture",
    supplierId: "s-eg-005",
    hsCode: "0804.10",
    pricePerUnit: 7.80,
    currency: "USD",
    unit: "kg",
    moq: 1000,
    leadTimeDays: 10,
    inStock: 28000,
    origin: "EG",
    image: "🌴",
    tags: ["Jumbo grade", "Vacuum packed"],
    description:
      "Jumbo Medjool dates (>23g/piece), soft texture, deep caramel sweetness. Vacuum packed in 5kg cartons.",
    specs: {
      "Grade": "Jumbo (23g+)",
      "Moisture": "20-24%",
      "Packaging": "5kg vacuum carton",
      "Shelf life": "12 months at <15°C",
      "Certification": "GlobalGAP, HACCP"
    }
  },
  {
    id: "p-006",
    name: "Orthodox Black Tea — OP1 Grade",
    category: "Tea",
    supplierId: "s-rw-006",
    hsCode: "0902.40",
    pricePerUnit: 3.20,
    currency: "USD",
    unit: "kg",
    moq: 500,
    leadTimeDays: 18,
    inStock: 14000,
    origin: "RW",
    image: "🍵",
    tags: ["Orthodox", "High-grown", "Wiry leaf"],
    description:
      "Wiry, long-leaf orthodox black tea from 1,900m. Bright liquor, brisk character. Mombasa-auction grade equivalent.",
    specs: {
      "Grade": "OP1",
      "Moisture": "<5%",
      "Packaging": "40kg multi-wall paper sacks",
      "Origin": "Nyungwe estates",
      "Liquor": "Bright, brisk, full"
    }
  },
  {
    id: "p-007",
    name: "Unrefined Shea Butter (Grade A)",
    category: "Cosmetics",
    supplierId: "s-gh-007",
    hsCode: "1515.90",
    pricePerUnit: 5.40,
    currency: "USD",
    unit: "kg",
    moq: 1000,
    leadTimeDays: 21,
    inStock: 22000,
    origin: "GH",
    image: "🧴",
    tags: ["Unrefined", "Cold-pressed", "Women-led"],
    description:
      "Hand-crafted unrefined shea butter, ivory color, characteristic nutty aroma. Cosmetic and food grade.",
    specs: {
      "Free fatty acid": "<1%",
      "Peroxide value": "<10 meq/kg",
      "Moisture": "<0.05%",
      "Packaging": "25kg HDPE pail",
      "Certification": "Organic, Fair for Life"
    }
  },
  {
    id: "p-008",
    name: "DAP Fertilizer (18-46-0)",
    category: "Fertilizers",
    supplierId: "s-ma-008",
    hsCode: "3105.30",
    pricePerUnit: 685,
    currency: "USD",
    unit: "MT",
    moq: 1000,
    leadTimeDays: 25,
    inStock: 45000,
    origin: "MA",
    image: "🌾",
    tags: ["Granular", "Bulk shipment"],
    description:
      "Diammonium phosphate granular fertilizer, 18-46-0 NPK. Bulk vessel or 50kg bags. FOB Jorf Lasfar.",
    specs: {
      "N": "18% min",
      "P2O5": "46% min",
      "Granule size": "2-4mm (90%)",
      "Moisture": "<1.5%",
      "Loading": "20,000 MT/day"
    }
  },
  {
    id: "p-009",
    name: "Raw Cashew Nuts — KOR 48+",
    category: "Cashew",
    supplierId: "s-ci-002",
    hsCode: "0801.31",
    pricePerUnit: 1390,
    currency: "USD",
    unit: "MT",
    moq: 18,
    leadTimeDays: 14,
    inStock: 920,
    origin: "CI",
    image: "🥜",
    tags: ["Crop 2026", "KOR 48+", "FOB Abidjan"],
    description:
      "Current-crop raw cashew nuts, KOR 48 lb minimum, outturn validated by SGS pre-shipment inspection.",
    specs: {
      "KOR (kernel out-turn)": "48 lbs/80kg min",
      "Nut count": "200/kg max",
      "Moisture": "<10%",
      "Defects": "<12%",
      "Packaging": "80kg jute bags"
    }
  },
  {
    id: "p-010",
    name: "Finished Calfskin Leather (1.2mm)",
    category: "Leather",
    supplierId: "s-et-010",
    hsCode: "4107.11",
    pricePerUnit: 4.80,
    currency: "USD",
    unit: "sqft",
    moq: 5000,
    leadTimeDays: 30,
    inStock: 88000,
    origin: "ET",
    image: "👜",
    tags: ["Full grain", "Chrome-tanned", "Vegetable retan"],
    description:
      "Full-grain Ethiopian highland calfskin, chrome tanned with vegetable retan. Suited for leather goods and footwear uppers.",
    specs: {
      "Thickness": "1.0-1.2mm",
      "Tannage": "Chrome + veg retan",
      "Hide size": "18-22 sqft",
      "Colors": "12 stock + custom",
      "Certification": "LWG Gold"
    }
  },
  {
    id: "p-011",
    name: "Sesame Seeds (Hulled, 99.95%)",
    category: "Agriculture",
    supplierId: "s-tz-009",
    hsCode: "1207.40",
    pricePerUnit: 1820,
    currency: "USD",
    unit: "MT",
    moq: 18,
    leadTimeDays: 21,
    inStock: 540,
    origin: "TZ",
    image: "🌱",
    tags: ["Hulled", "Sortex cleaned", "Food grade"],
    description:
      "Mechanically hulled sesame, sortex-cleaned to 99.95% purity. Food-grade for bakery and confectionery.",
    specs: {
      "Purity": "99.95%",
      "FFA": "<1.5%",
      "Moisture": "<6%",
      "Oil content": "≥50%",
      "Packaging": "25kg PP bag"
    }
  },
  {
    id: "p-012",
    name: "Madagascar Bourbon Vanilla Beans",
    category: "Spices",
    supplierId: "s-rw-006",
    hsCode: "0905.10",
    pricePerUnit: 96,
    currency: "USD",
    unit: "kg",
    moq: 5,
    leadTimeDays: 14,
    inStock: 120,
    origin: "MG",
    image: "🌿",
    tags: ["Gourmet", "Grade A", "Hand-pollinated"],
    description:
      "Plump Grade-A Bourbon vanilla, 14-18cm, moisture 30-35%. Vacuum-packed in 500g tubes for freshness.",
    specs: {
      "Grade": "A (Gourmet)",
      "Length": "14-18 cm",
      "Moisture": "30-35%",
      "Vanillin": "1.8% min",
      "Packaging": "500g vacuum tubes"
    }
  }
];

export function getProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}
