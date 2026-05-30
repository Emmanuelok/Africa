import { NextResponse } from "next/server";
import { authenticateApiKey, recordUsage } from "@/lib/api/v1-auth";
import { saveCertificate } from "@/lib/data/determinations";
import { rateLimit, rateLimitResponseHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const t0 = Date.now();
  const auth = await authenticateApiKey(req, "certificates");
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const rl = await rateLimit(`key:${auth.keyId}`, "api");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/certificates", statusCode: 429, durationMs: Date.now() - t0 });
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers });
  }

  try {
    const body = await req.json();

    const required = ["determination_id", "exporter", "consignee", "hs_code", "origin", "destination"];
    for (const k of required) {
      if (!body?.[k]) {
        recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/certificates", statusCode: 400, durationMs: Date.now() - t0 });
        return NextResponse.json({ error: { code: "invalid_request", message: `${k} is required` } }, { status: 400, headers });
      }
    }

    const result = await saveCertificate({
      workspaceId: auth.workspaceId,
      determinationId: String(body.determination_id),
      hsCode: String(body.hs_code),
      originCountry: String(body.origin).toUpperCase(),
      destinationCountry: String(body.destination).toUpperCase(),
      exporterName: String(body.exporter?.name ?? ""),
      exporterAddress: body.exporter?.address ? String(body.exporter.address) : undefined,
      consigneeName: String(body.consignee?.name ?? ""),
      consigneeAddress: body.consignee?.address ? String(body.consignee.address) : undefined
    });

    const origin = new URL(req.url).origin;
    const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? origin}/verify/${result.reference}`;

    recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/certificates", statusCode: 200, durationMs: Date.now() - t0 });
    return NextResponse.json(
      {
        certificate_id: result.id,
        reference: result.reference,
        pdf_url: result.pdfUrl ?? `${origin}/api/certificates/${result.id}/pdf`,
        qr_verification_url: verifyUrl,
        issued_at: new Date().toISOString()
      },
      { headers }
    );
  } catch (err) {
    console.error("[/api/v1/certificates]", err);
    recordUsage({ apiKeyId: auth.keyId, endpoint: "POST /v1/certificates", statusCode: 500, durationMs: Date.now() - t0 });
    return NextResponse.json({ error: { code: "internal_error", message: "Certificate creation failed" } }, { status: 500 });
  }
}
