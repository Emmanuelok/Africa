import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { statusFromCode } from "@/lib/kyb/smile";

export const runtime = "nodejs";

// Smile Identity posts back to this endpoint when verification completes.
// We extract workspace id from partner_params.user_id ("ws-<workspaceId>")
// and persist the result.
export async function POST(req: Request) {
  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: true, ignored: "no_db" });
  }

  try {
    const body = await req.json();
    const userId = String(body?.PartnerParams?.user_id ?? body?.partner_params?.user_id ?? "");
    const resultCode = String(body?.ResultCode ?? body?.result_code ?? "");
    const reason = String(body?.ResultText ?? body?.result_text ?? "");
    const smileJobId = String(body?.SmileJobID ?? body?.smile_job_id ?? "");

    const match = userId.match(/^ws-(.+)$/);
    if (!match) {
      return NextResponse.json({ error: "Unknown partner_params" }, { status: 400 });
    }
    const workspaceId = match[1];
    const status = statusFromCode(resultCode);

    await db
      .update(schema.workspaces)
      .set({
        kybStatus: status,
        kybJobId: smileJobId || null,
        kybRejectionReason: status === "rejected" ? reason || null : null,
        kybVerifiedAt: status === "verified" ? new Date() : null
      })
      .where(eq(schema.workspaces.id, workspaceId));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/kyb/callback]", err);
    return NextResponse.json({ error: "Callback handling failed" }, { status: 500 });
  }
}
