import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { saveCertificate, listCertificates } from "@/lib/data/determinations";
import { sendEmail } from "@/lib/email/resend";
import { certificateIssuedEmail } from "@/lib/email/templates";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "api");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers });
  }

  try {
    const user = await getSessionUser();
    const body = await req.json();

    const required = ["determinationId", "exporterName", "consigneeName", "hsCode", "originCountry", "destinationCountry"];
    for (const k of required) {
      if (!body?.[k]) return NextResponse.json({ error: `${k} is required` }, { status: 400, headers });
    }

    const result = await saveCertificate({
      workspaceId: user.workspaceId,
      determinationId: String(body.determinationId),
      hsCode: String(body.hsCode),
      originCountry: String(body.originCountry),
      destinationCountry: String(body.destinationCountry),
      exporterName: String(body.exporterName),
      exporterAddress: body.exporterAddress ? String(body.exporterAddress) : undefined,
      consigneeName: String(body.consigneeName),
      consigneeAddress: body.consigneeAddress ? String(body.consigneeAddress) : undefined
    });

    // Email the user — non-blocking.
    if (user.email && !user.isDemo) {
      const tpl = certificateIssuedEmail({
        reference: result.reference,
        hsCode: String(body.hsCode),
        originCountry: String(body.originCountry),
        destinationCountry: String(body.destinationCountry)
      });
      void sendEmail({ to: user.email, subject: tpl.subject, html: tpl.html, text: tpl.text });
    }

    return NextResponse.json({ ok: true, ...result, isDemo: user.isDemo }, { headers });
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
