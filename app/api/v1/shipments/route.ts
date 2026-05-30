import { NextResponse } from "next/server";
import { authenticateApiKey, recordUsage } from "@/lib/api/v1-auth";
import { classifyWithAI } from "@/lib/ai/classify";
import { determineOrigin } from "@/lib/data/classifier";
import { lookupTariff } from "@/lib/data/tariffs";
import { saveDetermination, saveCertificate } from "@/lib/data/determinations";
import { rateLimit, rateLimitResponseHeaders } from "@/lib/ratelimit";
import { getIdempotent, rememberIdempotent, readIdempotencyKey } from "@/lib/server/idempotency";

export const runtime = "nodejs";

// End-to-end pipeline: classify → determine origin → save determination
// → optionally generate a certificate. Documented at $1.80/call in the
// developer pricing.
export async function POST(req: Request) {
  const t0 = Date.now();
  const auth = await authenticateApiKey(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await rateLimit(`key:${auth.keyId}`, "api");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/shipments", statusCode: 429, durationMs: Date.now() - t0 });
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers });
  }

  const idem = readIdempotencyKey(req);
  if (idem) {
    const prev = await getIdempotent(`shipments:${auth.keyId}`, idem);
    if (prev) {
      recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/shipments", statusCode: prev.status, durationMs: Date.now() - t0 });
      return NextResponse.json(prev.body, { status: prev.status, headers });
    }
  }

  try {
    const body = await req.json();
    const description = String(body?.description ?? "").trim();
    const origin = String(body?.origin ?? "").toUpperCase();
    const destination = String(body?.destination ?? "").toUpperCase();
    const quantity = body?.quantity ? Number(body.quantity) : undefined;
    const fobValueUsd = body?.fob_value_usd ? Number(body.fob_value_usd) : undefined;
    const generateCertificate = Boolean(body?.generate_certificate);

    if (!description || !origin || !destination) {
      recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/shipments", statusCode: 400, durationMs: Date.now() - t0 });
      return NextResponse.json(
        { error: { code: "invalid_request", message: "description, origin, destination are required" } },
        { status: 400, headers }
      );
    }

    // 1. Classify
    const cls = await classifyWithAI(description);

    // 2. Determine origin
    const orig = determineOrigin({
      hsChapter: cls.hsPrefix,
      wholeObtained: body?.whole_obtained !== false,
      changeOfTariffHeading: Boolean(body?.has_cth ?? body?.change_of_tariff_heading),
      regionalValueContent: Number(body?.rvc_percent ?? body?.regional_value_content ?? 50),
      underwentSubstantialTransformation: Boolean(body?.substantial_transformation)
    });

    // 3. Tariff savings
    const tariff = lookupTariff(cls.hsPrefix);
    const mfn = tariff?.mfnRate ?? 0;
    const afcfta = tariff?.afcftaRate ?? 0;
    const savings = fobValueUsd ? ((mfn - afcfta) * fobValueUsd) / 100 : 0;

    // 4. Persist
    const det = await saveDetermination({
      workspaceId: auth.workspaceId,
      description,
      hsCode: cls.hsPrefix,
      confidence: cls.confidence,
      originCountry: origin,
      destinationCountry: destination,
      quantity,
      fobValueUsd,
      qualifies: orig.qualifies,
      ruleApplied: orig.rule,
      mfnRate: mfn,
      afcftaRate: afcfta,
      savingsUsd: savings
    });

    // 5. Optional certificate
    let certificate = null;
    if (generateCertificate && (orig.qualifies === "yes" || orig.qualifies === "marginal")) {
      const exporterName = String(body?.exporter?.name ?? "").trim();
      const consigneeName = String(body?.consignee?.name ?? "").trim();
      if (exporterName && consigneeName) {
        const cert = await saveCertificate({
          workspaceId: auth.workspaceId,
          determinationId: det.id,
          hsCode: cls.hsPrefix,
          originCountry: origin,
          destinationCountry: destination,
          exporterName,
          exporterAddress: body?.exporter?.address ? String(body.exporter.address) : undefined,
          consigneeName,
          consigneeAddress: body?.consignee?.address ? String(body.consignee.address) : undefined
        });
        const reqOrigin = new URL(req.url).origin;
        certificate = {
          id: cert.id,
          reference: cert.reference,
          pdf_url: cert.pdfUrl ?? `${reqOrigin}/api/certificates/${cert.id}/pdf`,
          qr_verification_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? reqOrigin}/verify/${cert.reference}`
        };
      }
    }

    recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/shipments", statusCode: 200, durationMs: Date.now() - t0 });
    const responseBody = {
      determination_id: det.id,
      classification: {
        hs_code: cls.hsPrefix,
        description: cls.description,
        confidence: cls.confidence,
        source: cls.source
      },
      origin: {
        qualifies: orig.qualifies,
        rule_applied: orig.rule,
        reasoning: orig.reasoning
      },
      tariff: {
        mfn_rate: mfn,
        preferential_rate: afcfta,
        savings_usd: Math.round(savings * 100) / 100
      },
      certificate
    };
    if (idem) await rememberIdempotent(`shipments:${auth.keyId}`, idem, { status: 200, body: responseBody });
    return NextResponse.json(
      responseBody,
      { headers }
    );
  } catch (err) {
    console.error("[/api/v1/shipments]", err);
    recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/shipments", statusCode: 500, durationMs: Date.now() - t0 });
    return NextResponse.json({ error: { code: "internal_error", message: "Shipment processing failed" } }, { status: 500 });
  }
}
