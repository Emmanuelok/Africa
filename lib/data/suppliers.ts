export type Supplier = {
  id: string;
  name: string;
  country: string; // ISO-2
  city: string;
  founded: number;
  employees: string;
  categories: string[];
  verified: boolean;
  kybLevel: "Basic" | "Standard" | "Gold" | "Platinum";
  rating: number; // 0-5
  ordersFulfilled: number;
  responseHrs: number;
  afcftaApproved: boolean;
  description: string;
};

export const SUPPLIERS: Supplier[] = [
  {
    id: "s-ke-001",
    name: "Highlands Coffee Cooperative",
    country: "KE",
    city: "Nyeri",
    founded: 1998,
    employees: "250-500",
    categories: ["Coffee", "Tea"],
    verified: true,
    kybLevel: "Gold",
    rating: 4.8,
    ordersFulfilled: 1240,
    responseHrs: 3,
    afcftaApproved: true,
    description:
      "Cooperative of 12 estates producing AA, AB, and PB Arabica grades. Rainforest Alliance and Fair Trade certified."
  },
  {
    id: "s-ci-002",
    name: "Cocoa Atlantique SARL",
    country: "CI",
    city: "Abidjan",
    founded: 2008,
    employees: "100-250",
    categories: ["Cocoa", "Cashew"],
    verified: true,
    kybLevel: "Platinum",
    rating: 4.9,
    ordersFulfilled: 3120,
    responseHrs: 2,
    afcftaApproved: true,
    description:
      "Leading Ivorian exporter of premium cocoa beans, cocoa butter, and raw cashew. ICCO-registered."
  },
  {
    id: "s-ng-003",
    name: "Lagos Textile Mills Ltd",
    country: "NG",
    city: "Lagos",
    founded: 1985,
    employees: "1000+",
    categories: ["Textiles", "Apparel"],
    verified: true,
    kybLevel: "Gold",
    rating: 4.5,
    ordersFulfilled: 890,
    responseHrs: 6,
    afcftaApproved: true,
    description:
      "Vertically integrated mill producing Ankara, wax prints, and cotton fabrics. Compliant with OEKO-TEX 100."
  },
  {
    id: "s-za-004",
    name: "Kalahari Minerals Trading",
    country: "ZA",
    city: "Johannesburg",
    founded: 2002,
    employees: "50-100",
    categories: ["Metals", "Chromium", "Manganese"],
    verified: true,
    kybLevel: "Platinum",
    rating: 4.7,
    ordersFulfilled: 510,
    responseHrs: 4,
    afcftaApproved: true,
    description:
      "Mineral trader specializing in chrome ore, manganese, and ferro-alloys. Mine-to-port logistics handled in-house."
  },
  {
    id: "s-eg-005",
    name: "Nile Agro Exports",
    country: "EG",
    city: "Alexandria",
    founded: 1992,
    employees: "250-500",
    categories: ["Citrus", "Dates", "Spices"],
    verified: true,
    kybLevel: "Gold",
    rating: 4.6,
    ordersFulfilled: 2210,
    responseHrs: 5,
    afcftaApproved: true,
    description:
      "Major Egyptian exporter of fresh citrus, Medjool dates, and dried herbs. GlobalGAP certified packhouse."
  },
  {
    id: "s-rw-006",
    name: "Kigali Specialty Tea Co.",
    country: "RW",
    city: "Kigali",
    founded: 2015,
    employees: "50-100",
    categories: ["Tea", "Coffee"],
    verified: true,
    kybLevel: "Standard",
    rating: 4.7,
    ordersFulfilled: 420,
    responseHrs: 2,
    afcftaApproved: true,
    description:
      "High-altitude orthodox black tea and washed Bourbon coffee. Member of East African Tea Trade Association."
  },
  {
    id: "s-gh-007",
    name: "Accra Shea Collective",
    country: "GH",
    city: "Tamale",
    founded: 2011,
    employees: "100-250",
    categories: ["Shea", "Cosmetics", "Soaps"],
    verified: true,
    kybLevel: "Gold",
    rating: 4.9,
    ordersFulfilled: 1610,
    responseHrs: 3,
    afcftaApproved: true,
    description:
      "Women-led collective producing unrefined shea butter, soaps, and cosmetic intermediates from 4,200 producers."
  },
  {
    id: "s-ma-008",
    name: "Atlas Phosphates",
    country: "MA",
    city: "Casablanca",
    founded: 1978,
    employees: "1000+",
    categories: ["Fertilizers", "Phosphates"],
    verified: true,
    kybLevel: "Platinum",
    rating: 4.6,
    ordersFulfilled: 730,
    responseHrs: 8,
    afcftaApproved: true,
    description:
      "Producer of DAP, MAP, and TSP fertilizers from Khouribga reserves. Vessel-loading capacity at Jorf Lasfar."
  },
  {
    id: "s-tz-009",
    name: "Mwanza Cotton Ginners",
    country: "TZ",
    city: "Mwanza",
    founded: 1996,
    employees: "250-500",
    categories: ["Cotton", "Sesame"],
    verified: true,
    kybLevel: "Standard",
    rating: 4.4,
    ordersFulfilled: 380,
    responseHrs: 7,
    afcftaApproved: false,
    description:
      "Lake-zone ginnery supplying cotton lint, seed cake, and oilseed sesame. Bonded warehouse at Dar es Salaam port."
  },
  {
    id: "s-et-010",
    name: "Addis Leather Works",
    country: "ET",
    city: "Addis Ababa",
    founded: 2004,
    employees: "500-1000",
    categories: ["Leather", "Footwear"],
    verified: true,
    kybLevel: "Gold",
    rating: 4.5,
    ordersFulfilled: 1100,
    responseHrs: 4,
    afcftaApproved: true,
    description:
      "Sheep- and goat-skin leather tannery with finished leather and contract footwear assembly lines."
  }
];

export function getSupplier(id: string) {
  return SUPPLIERS.find((s) => s.id === id);
}
