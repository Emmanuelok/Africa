import { NextResponse } from "next/server";
import { authenticateApiKey, recordUsage } from "@/lib/api/v1-auth";
import { lookupTariff } from "@/lib/data/tariffs";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const t0 = Date.now();
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(req.url);
  const hsCode = (url.searchParams.get("hs") ?? "").trim();
  const origin = (url.searchParams.get("origin") ?? "").toUpperCase();
  const destination = (url.searchParams.get("destination") ?? "").toUpperCase();

  if (!hsCode) {
    recordUsage({ apiKeyId: auth.keyId, endpoint: "GET /v1/tariff", statusCode: 400, durationMs: Date.now() - t0 });
    return NextResponse.json({ error: { code: "invalid_request", message: "hs query param required" } }, { status: 400 });
  }

  const tariff = lookupTariff(hsCode.slice(0, 4));
  recordUsage({ apiKeyId: auth.keyId, endpoint: "GET /v1/tariff", statusCode: 200, durationMs: Date.now() - t0 });
  return NextResponse.json({
    hs_code: hsCode,
    origin,
    destination,
    mfn_rate: tariff?.mfnRate ?? null,
    afcfta_rate: tariff?.afcftaRate ?? null,
    description: tariff?.description ?? null
  });
}
