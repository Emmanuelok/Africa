import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";

export const runtime = "nodejs";

const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const URL_RE = /^https:\/\/[^\s]+$/;

// PATCH /api/workspace — partial update of profile + branding + preferences.
// All fields optional. Branding fields silently ignored on non-forwarder plans.
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  const db = getDb();

  if (!db || user.isDemo) {
    return NextResponse.json(
      { ok: true, isDemo: true, message: "Settings persistence requires a database in production." },
      { status: user.isDemo ? 200 : 503 }
    );
  }

  const body = await req.json();
  const updates: Partial<typeof schema.workspaces.$inferInsert> = {};

  if (typeof body?.name === "string") {
    const name = body.name.trim().slice(0, 120);
    if (name.length < 2) return NextResponse.json({ error: "name too short" }, { status: 400 });
    updates.name = name;
  }
  if (typeof body?.defaultOriginCountry === "string") {
    updates.defaultOriginCountry = body.defaultOriginCountry.toUpperCase().slice(0, 2) || null;
  }
  if (typeof body?.defaultLocale === "string") {
    if (!["en", "fr", "pt", "ar", "sw"].includes(body.defaultLocale)) {
      return NextResponse.json({ error: "unsupported locale" }, { status: 400 });
    }
    updates.defaultLocale = body.defaultLocale;
  }

  // Branding — only honoured on the Forwarder tier.
  if (user.plan === "forwarder") {
    if (typeof body?.brandName === "string") updates.brandName = body.brandName.trim().slice(0, 80) || null;
    if (typeof body?.brandLogoUrl === "string") {
      if (body.brandLogoUrl && !URL_RE.test(body.brandLogoUrl)) {
        return NextResponse.json({ error: "brandLogoUrl must be https://" }, { status: 400 });
      }
      updates.brandLogoUrl = body.brandLogoUrl || null;
    }
    if (typeof body?.brandPrimaryColor === "string") {
      if (body.brandPrimaryColor && !HEX_RE.test(body.brandPrimaryColor)) {
        return NextResponse.json({ error: "brandPrimaryColor must be #rrggbb" }, { status: 400 });
      }
      updates.brandPrimaryColor = body.brandPrimaryColor || null;
    }
    if (typeof body?.brandFooterNote === "string") {
      updates.brandFooterNote = body.brandFooterNote.trim().slice(0, 200) || null;
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await db
    .update(schema.workspaces)
    .set(updates)
    .where(eq(schema.workspaces.id, user.workspaceId));

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: user.workspaceId,
    userId: user.id,
    action: "workspace.member_invited", // closest existing; expand taxonomy later
    target: user.workspaceId,
    metadata: { event: "settings_updated", keys: Object.keys(updates) },
    ipAddress,
    userAgent
  });

  return NextResponse.json({ ok: true });
}
