import { NextResponse } from "next/server";
import { authenticateApiKey, recordUsage } from "@/lib/api/v1-auth";
import { lookupTariff } from "@/lib/data/tariffs";
import { determineOrigin } from "@/lib/data/classifier";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const t0 = Date.now();
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  try {
    const body = await req.json();
    const hsCode = String(body?.hs_code ?? body?.hsCode ?? "").trim();
    const origin = String(body?.origin_country ?? body?.origin ?? "").trim().toUpperCase();
    const destination = String(body?.destination_country ?? body?.destination ?? "").trim().toUpperCase();

    if (!hsCode || !origin || !destination) {
      recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/determine-origin", statusCode: 400, durationMs: Date.now() - t0 });
      return NextResponse.json(
        { error: { code: "invalid_request", message: "hs_code, origin, destination are required" } },
        { status: 400 }
      );
    }

    const result = determineOrigin({
      hsChapter: hsCode.slice(0, 4),
      wholeObtained: Boolean(body?.whole_obtained ?? body?.wholeObtained),
      changeOfTariffHeading: Boolean(body?.has_cth ?? body?.changeOfTariffHeading),
      regionalValueContent: Number(body?.rvc_percent ?? body?.regionalValueContent ?? 0),
      underwentSubstantialTransformation: Boolean(body?.substantial_transformation ?? body?.underwentSubstantialTransformation)
    });

    const tariff = lookupTariff(hsCode.slice(0, 4));

    recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/determine-origin", statusCode: 200, durationMs: Date.now() - t0 });
    return NextResponse.json({
      qualifies: result.qualifies,
      rule_applied: result.rule,
      reasoning: result.reasoning,
      preferential_rate: tariff?.afcftaRate ?? 0,
      mfn_rate: tariff?.mfnRate ?? 0,
      hs_code: hsCode,
      origin,
      destination
    });
  } catch (err) {
    console.error("[/api/v1/determine-origin]", err);
    recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/determine-origin", statusCode: 500, durationMs: Date.now() - t0 });
    return NextResponse.json({ error: { code: "internal_error", message: "Determination failed" } }, { status: 500 });
  }
}
