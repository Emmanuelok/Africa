import { stringify } from "yaml";
import { spec } from "@/lib/openapi";

export const runtime = "nodejs";
export const dynamic = "force-static";

// YAML variant of the same spec. Some tools (Speakeasy, internal API
// gateways) only ingest YAML. Single source of truth lives in lib/openapi.ts.
export async function GET() {
  const yaml = stringify(spec, { aliasDuplicateObjects: false, lineWidth: 120 });
  return new Response(yaml, {
    status: 200,
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400"
    }
  });
}
