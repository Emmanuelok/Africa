// One-shot: extract African countries from world-atlas (Natural Earth) at 50m
// resolution and write to lib/data/africa-geo.json so the client doesn't pull
// the full world TopoJSON. Run with `node scripts/build-africa-geo.mjs`.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { feature } from "topojson-client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const topo = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "node_modules", "world-atlas", "countries-110m.json"),
    "utf8"
  )
);

const world = feature(topo, topo.objects.countries);

// ISO 3166-1 numeric → ISO-2, with name
const AFRICA = {
  "012": { iso2: "DZ", name: "Algeria" },
  "024": { iso2: "AO", name: "Angola" },
  "204": { iso2: "BJ", name: "Benin" },
  "072": { iso2: "BW", name: "Botswana" },
  "854": { iso2: "BF", name: "Burkina Faso" },
  "108": { iso2: "BI", name: "Burundi" },
  "120": { iso2: "CM", name: "Cameroon" },
  "132": { iso2: "CV", name: "Cape Verde" },
  "140": { iso2: "CF", name: "Central African Republic" },
  "148": { iso2: "TD", name: "Chad" },
  "174": { iso2: "KM", name: "Comoros" },
  "178": { iso2: "CG", name: "Congo" },
  "180": { iso2: "CD", name: "DR Congo" },
  "384": { iso2: "CI", name: "Côte d'Ivoire" },
  "262": { iso2: "DJ", name: "Djibouti" },
  "818": { iso2: "EG", name: "Egypt" },
  "226": { iso2: "GQ", name: "Equatorial Guinea" },
  "232": { iso2: "ER", name: "Eritrea" },
  "748": { iso2: "SZ", name: "Eswatini" },
  "231": { iso2: "ET", name: "Ethiopia" },
  "266": { iso2: "GA", name: "Gabon" },
  "270": { iso2: "GM", name: "Gambia" },
  "288": { iso2: "GH", name: "Ghana" },
  "324": { iso2: "GN", name: "Guinea" },
  "624": { iso2: "GW", name: "Guinea-Bissau" },
  "404": { iso2: "KE", name: "Kenya" },
  "426": { iso2: "LS", name: "Lesotho" },
  "430": { iso2: "LR", name: "Liberia" },
  "434": { iso2: "LY", name: "Libya" },
  "450": { iso2: "MG", name: "Madagascar" },
  "454": { iso2: "MW", name: "Malawi" },
  "466": { iso2: "ML", name: "Mali" },
  "478": { iso2: "MR", name: "Mauritania" },
  "480": { iso2: "MU", name: "Mauritius" },
  "504": { iso2: "MA", name: "Morocco" },
  "508": { iso2: "MZ", name: "Mozambique" },
  "516": { iso2: "NA", name: "Namibia" },
  "562": { iso2: "NE", name: "Niger" },
  "566": { iso2: "NG", name: "Nigeria" },
  "646": { iso2: "RW", name: "Rwanda" },
  "678": { iso2: "ST", name: "Sao Tome & Principe" },
  "686": { iso2: "SN", name: "Senegal" },
  "690": { iso2: "SC", name: "Seychelles" },
  "694": { iso2: "SL", name: "Sierra Leone" },
  "706": { iso2: "SO", name: "Somalia" },
  "710": { iso2: "ZA", name: "South Africa" },
  "728": { iso2: "SS", name: "South Sudan" },
  "729": { iso2: "SD", name: "Sudan" },
  "834": { iso2: "TZ", name: "Tanzania" },
  "768": { iso2: "TG", name: "Togo" },
  "788": { iso2: "TN", name: "Tunisia" },
  "800": { iso2: "UG", name: "Uganda" },
  "732": { iso2: "EH", name: "Western Sahara" },
  "894": { iso2: "ZM", name: "Zambia" },
  "716": { iso2: "ZW", name: "Zimbabwe" }
};

const features = world.features
  .filter((f) => AFRICA[String(f.id).padStart(3, "0")])
  .map((f) => {
    const meta = AFRICA[String(f.id).padStart(3, "0")];
    return {
      type: "Feature",
      id: meta.iso2,
      properties: { iso2: meta.iso2, name: meta.name },
      geometry: f.geometry
    };
  });

const out = { type: "FeatureCollection", features };
const outPath = path.join(__dirname, "..", "lib", "data", "africa-geo.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(out));

const kb = (fs.statSync(outPath).size / 1024).toFixed(1);
console.log(`Wrote ${features.length} African features → ${outPath} (${kb} KB)`);
