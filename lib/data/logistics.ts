export type LogisticsProvider = {
  id: string;
  name: string;
  hq: string; // ISO-2
  corridors: string[]; // e.g. "Abidjan-Lagos"
  modes: ("Sea" | "Road" | "Rail" | "Air")[];
  services: string[];
  customsBroker: boolean;
  rating: number;
};

export const LOGISTICS: LogisticsProvider[] = [
  {
    id: "l-001",
    name: "Abidjan-Lagos Freight Co.",
    hq: "CI",
    corridors: ["Abidjan–Lagos", "Abidjan–Ouagadougou", "Tema–Lagos"],
    modes: ["Road", "Sea"],
    services: ["Bonded trucking", "Customs clearance", "Cross-border escort"],
    customsBroker: true,
    rating: 4.6
  },
  {
    id: "l-002",
    name: "East Africa Rail Logistics",
    hq: "KE",
    corridors: ["Mombasa–Nairobi–Kampala", "Mombasa–Kigali", "Dar–Mwanza"],
    modes: ["Rail", "Road"],
    services: ["SGR container haul", "ICD warehousing", "EAC customs transit (T1)"],
    customsBroker: true,
    rating: 4.4
  },
  {
    id: "l-003",
    name: "TransAfrica Shipping Lines",
    hq: "ZA",
    corridors: ["Durban–Dar", "Cape Town–Walvis Bay", "Maputo–Beira"],
    modes: ["Sea"],
    services: ["Container", "Break-bulk", "Cold chain"],
    customsBroker: false,
    rating: 4.5
  },
  {
    id: "l-004",
    name: "Sahel Cross-Border Express",
    hq: "BF",
    corridors: ["Tema–Ouagadougou", "Cotonou–Niamey", "Lomé–Ouagadougou"],
    modes: ["Road"],
    services: ["TIR carnet", "Sahel security escort", "Bonded warehouse"],
    customsBroker: true,
    rating: 4.2
  },
  {
    id: "l-005",
    name: "North-South Corridor Freight",
    hq: "ZM",
    corridors: ["Durban–Lusaka–Lubumbashi", "Beira–Harare", "Walvis Bay–Lusaka"],
    modes: ["Road", "Rail"],
    services: ["Copperbelt logistics", "Customs transit", "Reefer trucking"],
    customsBroker: true,
    rating: 4.5
  },
  {
    id: "l-006",
    name: "Nile Valley Forwarders",
    hq: "EG",
    corridors: ["Alexandria–Khartoum", "Aswan–Khartoum", "Cairo–Addis (multimodal)"],
    modes: ["Sea", "Road", "Rail"],
    services: ["River barge", "Customs brokerage", "Air freight forwarding"],
    customsBroker: true,
    rating: 4.3
  }
];
