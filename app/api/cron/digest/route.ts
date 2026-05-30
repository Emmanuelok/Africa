import { NextResponse } from "next/server";
import { and, gte, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { sendEmail } from "@/lib/email/resend";

export const runtime = "nodejs";

// Weekly digest (Mondays 06:00 UTC via vercel.json). Summarises the last 7
// days of activity per workspace and emails each member. Authorized with
// CRON_SECRET like the cleanup job.
function authorize(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";

export async function GET(req: Request) {
  if (!authorize(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const summary: Record<string, number | string> = { ranAt: new Date().toISOString() };
  if (!db) {
    summary.skipped = "no database configured";
    return NextResponse.json(summary);
  }

  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let workspacesProcessed = 0;
  let emailsSent = 0;

  try {
    const allWorkspaces = await db.select().from(schema.workspaces);

    for (const ws of allWorkspaces) {
      // Aggregate last-7-day stats for this workspace.
      const [dets, certs, notifs] = await Promise.all([
        db.select().from(schema.determinations).where(
          and(eq(schema.determinations.workspaceId, ws.id), gte(schema.determinations.createdAt, since))
        ),
        db.select().from(schema.certificates).where(
          and(eq(schema.certificates.workspaceId, ws.id), gte(schema.certificates.createdAt, since))
        ),
        db.select().from(schema.notifications).where(
          and(eq(schema.notifications.workspaceId, ws.id), gte(schema.notifications.createdAt, since))
        )
      ]);

      // Nothing happened — skip the email entirely.
      if (dets.length === 0 && certs.length === 0 && notifs.length === 0) continue;

      const savings = dets.reduce((s, d) => s + Number(d.savingsUsd ?? 0), 0);
      const qualifying = dets.filter((d) => d.qualifies === "yes").length;

      // Members to email.
      const members = await db
        .select({ email: schema.users.email, name: schema.users.name })
        .from(schema.workspaceMembers)
        .innerJoin(schema.users, eq(schema.workspaceMembers.userId, schema.users.id))
        .where(eq(schema.workspaceMembers.workspaceId, ws.id));

      workspacesProcessed += 1;

      const html = digestHtml({
        workspaceName: ws.name,
        determinations: dets.length,
        qualifying,
        certificates: certs.length,
        savingsUsd: savings
      });

      for (const m of members) {
        if (!m.email) continue;
        const sent = await sendEmail({
          to: m.email,
          subject: `Your Sokoni weekly summary — ${ws.name}`,
          html,
          text: `This week on ${ws.name}: ${dets.length} determinations (${qualifying} qualifying), ${certs.length} certificates, $${Math.round(savings)} in AfCFTA savings. ${SITE}/dashboard`
        });
        if (sent) emailsSent += 1;
      }
    }

    summary.workspacesProcessed = workspacesProcessed;
    summary.emailsSent = emailsSent;
  } catch (err) {
    console.error("[cron:digest]", err);
    summary.error = String((err as Error).message ?? err);
    return NextResponse.json(summary, { status: 500 });
  }

  console.log("[cron:digest]", summary);
  return NextResponse.json(summary);
}

function digestHtml(d: {
  workspaceName: string;
  determinations: number;
  qualifying: number;
  certificates: number;
  savingsUsd: number;
}): string {
  const savings = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(d.savingsUsd);
  return `<!doctype html><html><body style="margin:0;padding:24px;background:#fbf8f1;font-family:system-ui,sans-serif;color:#0f0f0e;">
    <table cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;">
      <tr><td style="padding:20px 24px;border-bottom:1px solid #efece6;">
        <strong style="font-size:18px;">Sokoni<span style="color:#b8401f">.</span></strong>
      </td></tr>
      <tr><td style="padding:24px;">
        <h1 style="font-size:20px;margin:0 0 4px;">This week on ${escapeHtml(d.workspaceName)}</h1>
        <p style="font-size:14px;color:#85857d;margin:0 0 20px;">Your 7-day AfCFTA activity summary.</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:12px;background:#f5f7ee;border-radius:10px;text-align:center;width:33%;">
              <div style="font-size:24px;font-weight:700;">${d.determinations}</div>
              <div style="font-size:11px;color:#85857d;text-transform:uppercase;">Determinations</div>
            </td>
            <td style="width:8px;"></td>
            <td style="padding:12px;background:#f5f7ee;border-radius:10px;text-align:center;width:33%;">
              <div style="font-size:24px;font-weight:700;">${d.certificates}</div>
              <div style="font-size:11px;color:#85857d;text-transform:uppercase;">Certificates</div>
            </td>
            <td style="width:8px;"></td>
            <td style="padding:12px;background:#eef3e8;border-radius:10px;text-align:center;width:33%;">
              <div style="font-size:24px;font-weight:700;color:#3f6b3f;">${savings}</div>
              <div style="font-size:11px;color:#85857d;text-transform:uppercase;">Saved</div>
            </td>
          </tr>
        </table>
        <p style="font-size:14px;color:#3c3c39;margin:20px 0 0;">
          ${d.qualifying} of ${d.determinations} shipments qualified for AfCFTA preferential rates.
        </p>
        <p style="margin:24px 0;">
          <a href="${SITE}/dashboard" style="display:inline-block;background:#b8401f;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;">Open dashboard →</a>
        </p>
      </td></tr>
      <tr><td style="padding:16px 24px;border-top:1px solid #efece6;font-size:11px;color:#85857d;">
        Weekly summaries can be turned off in
        <a href="${SITE}/dashboard/settings/notifications" style="color:#b8401f">notification preferences</a>.
      </td></tr>
    </table>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] ?? c));
}
