import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/session";
import { saveCertificate, listCertificates } from "@/lib/data/determinations";
import { sendEmail } from "@/lib/email/resend";
import { certificateIssuedEmail } from "@/lib/email/templates";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";
import { dispatch } from "@/lib/webhooks/dispatch";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { notify } from "@/lib/server/notify";
import { checkQuota } from "@/lib/server/quota";
import { getIdempotent, rememberIdempotent, readIdempotencyKey } from "@/lib/server/idempotency";

export const runtime = "nodejs";

const Body = z.object({
  determinationId: z.string().min(1).max(80),
  hsCode: z.string().min(1).max(20),
  originCountry: z.string().length(2),
  destinationCountry: z.string().length(2),
  exporterName: z.string().min(1).max(200),
  exporterAddress: z.string().max(500).optional(),
  consigneeName: z.string().min(1).max(200),
  consigneeAddress: z.string().max(500).optional()
});

export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "api");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers });
  }

  try {
    const user = await getSessionUser();
    const idem = readIdempotencyKey(req);
    if (idem) {
      const prev = await getIdempotent(`cert:${user.workspaceId}`, idem);
      if (prev) return NextResponse.json(prev.body, { status: prev.status, headers });
    }

    const json = await req.json().catch(() => ({}));
    const parsed = Body.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input", issues: parsed.error.issues },
        { status: 400, headers }
      );
    }
    const body = parsed.data;

    const q = await checkQuota(user.workspaceId, user.plan, "certificatesPerMonth");
    if (!q.ok) {
      return NextResponse.json(
        { error: q.reason, used: q.used, limit: q.limit, code: "quota_exceeded" },
        { status: 402, headers }
      );
    }

    const result = await saveCertificate({
      workspaceId: user.workspaceId,
      determinationId: body.determinationId,
      hsCode: body.hsCode,
      originCountry: body.originCountry.toUpperCase(),
      destinationCountry: body.destinationCountry.toUpperCase(),
      exporterName: body.exporterName,
      exporterAddress: body.exporterAddress,
      consigneeName: body.consigneeName,
      consigneeAddress: body.consigneeAddress
    });

    if (user.email && !user.isDemo) {
      const tpl = certificateIssuedEmail({
        reference: result.reference,
        hsCode: body.hsCode,
        originCountry: body.originCountry,
        destinationCountry: body.destinationCountry
      });
      void sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    }

    const { ipAddress, userAgent } = ipAndUaFromRequest(req);
    audit({
      workspaceId: user.workspaceId,
      userId: user.id,
      action: "certificate.issued",
      target: result.id,
      metadata: { reference: result.reference, hsCode: body.hsCode },
      ipAddress,
      userAgent
    });

    void dispatch({
      workspaceId: user.workspaceId,
      event: "certificate.issued",
      object: {
        id: result.id,
        reference: result.reference,
        determination_id: body.determinationId,
        hs_code: body.hsCode,
        origin_country: body.originCountry,
        destination_country: body.destinationCountry,
        pdf_url: `/api/certificates/${result.id}/pdf`
      }
    });

    notify({
      workspaceId: user.workspaceId,
      userId: user.id,
      kind: "certificate.issued",
      title: `Certificate ${result.reference} issued`,
      body: `${body.exporterName} → ${body.consigneeName} · HS ${body.hsCode}`,
      target: "/dashboard/certificates"
    });

    const response = { ok: true, ...result, isDemo: user.isDemo };
    if (idem) await rememberIdempotent(`cert:${user.workspaceId}`, idem, { status: 200, body: response });
    return NextResponse.json(response, { headers });
  } catch (err) {
    console.error("[/api/certificates]", err);
    return NextResponse.json({ error: "Could not save certificate" }, { status: 500, headers });
  }
}

export async function GET() {
  const user = await getSessionUser();
  const rows = await listCertificates(user.workspaceId);
  return NextResponse.json({ certificates: rows });
}
