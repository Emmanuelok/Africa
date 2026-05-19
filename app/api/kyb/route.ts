import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import {
  submitBusinessVerification,
  isSmileConfigured,
  SUPPORTED_COUNTRIES,
  BUSINESS_TYPES
} from "@/lib/kyb/smile";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "checkout");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) {
    return NextResponse.json({ error: "Too many KYB attempts. Slow down." }, { status: 429, headers });
  }

  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.json(
      { error: "KYB requires a real account. Create one at /register." },
      { status: 403, headers }
    );
  }

  const body = await req.json();
  const country = String(body?.country ?? "").toUpperCase();
  const businessType = String(body?.businessType ?? "");
  const registrationNumber = String(body?.registrationNumber ?? "").trim();
  const businessName = String(body?.businessName ?? "").trim();

  if (!SUPPORTED_COUNTRIES.includes(country as (typeof SUPPORTED_COUNTRIES)[number])) {
    return NextResponse.json(
      { error: `Country not yet supported. Available: ${SUPPORTED_COUNTRIES.join(", ")}` },
      { status: 400, headers }
    );
  }
  if (!BUSINESS_TYPES.find((b) => b.code === businessType)) {
    return NextResponse.json({ error: "Invalid business type" }, { status: 400, headers });
  }
  if (!registrationNumber || !businessName) {
    return NextResponse.json(
      { error: "businessName and registrationNumber are required" },
      { status: 400, headers }
    );
  }

  const result = await submitBusinessVerification({
    workspaceId: user.workspaceId,
    country: country as (typeof SUPPORTED_COUNTRIES)[number],
    businessType: businessType as (typeof BUSINESS_TYPES)[number]["code"],
    registrationNumber,
    businessName
  });

  const db = getDb();
  if (db) {
    await db
      .update(schema.workspaces)
      .set({
        kybStatus: result.status,
        kybProvider: isSmileConfigured() ? "smile" : "none",
        kybJobId: result.smileJobId ?? null,
        kybBusinessType: businessType,
        kybRegistrationNumber: registrationNumber,
        kybRejectionReason: result.status === "rejected" ? result.resultText ?? null : null,
        kybVerifiedAt: result.status === "verified" ? new Date() : null
      })
      .where(eq(schema.workspaces.id, user.workspaceId));

    const { ipAddress, userAgent } = ipAndUaFromRequest(req);
    audit({
      workspaceId: user.workspaceId,
      userId: user.id,
      action: "workspace.member_invited", // closest existing action; expand taxonomy later
      target: user.workspaceId,
      metadata: { kybStatus: result.status, provider: isSmileConfigured() ? "smile" : "none" },
      ipAddress,
      userAgent
    });
  }

  return NextResponse.json(
    {
      ok: true,
      status: result.status,
      configured: isSmileConfigured(),
      message: !isSmileConfigured()
        ? "KYB recorded locally. Smile Identity is not configured — set SMILE_API_KEY in production."
        : result.status === "verified"
          ? "Business verified."
          : result.status === "pending"
            ? "Verification submitted. We'll notify you when Smile responds (usually within a few hours)."
            : `Verification rejected: ${result.resultText ?? "see Smile Identity dashboard"}.`,
      jobId: result.smileJobId
    },
    { headers }
  );
}
