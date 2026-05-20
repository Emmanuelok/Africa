import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";

export const runtime = "nodejs";

// Exports a complete dump of the workspace as JSON. GDPR-style portability.
// Includes determinations, certificates, audit log, webhook history,
// notifications, and members. Excludes secrets (API key hashes, webhook
// secrets) and other workspaces' data.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.json({ error: "Export requires a real account." }, { status: 403 });
  }

  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  // Membership check
  const m = await db
    .select()
    .from(schema.workspaceMembers)
    .where(and(
      eq(schema.workspaceMembers.workspaceId, params.id),
      eq(schema.workspaceMembers.userId, user.id)
    ))
    .limit(1);
  if (m.length === 0) {
    return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 });
  }

  const [workspace] = await db
    .select()
    .from(schema.workspaces)
    .where(eq(schema.workspaces.id, params.id))
    .limit(1);
  if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const [determinations, certificates, members, auditEntries, notifications, webhookEndpoints, apiKeys] =
    await Promise.all([
      db.select().from(schema.determinations).where(eq(schema.determinations.workspaceId, params.id)),
      db.select().from(schema.certificates).where(eq(schema.certificates.workspaceId, params.id)),
      db.select().from(schema.workspaceMembers).where(eq(schema.workspaceMembers.workspaceId, params.id)),
      db.select().from(schema.auditLog).where(eq(schema.auditLog.workspaceId, params.id)),
      db.select().from(schema.notifications).where(eq(schema.notifications.workspaceId, params.id)),
      db.select().from(schema.webhookEndpoints).where(eq(schema.webhookEndpoints.workspaceId, params.id)),
      db.select().from(schema.apiKeys).where(eq(schema.apiKeys.workspaceId, params.id))
    ]);

  // Redact sensitive fields.
  const dump = {
    exportedAt: new Date().toISOString(),
    exportedBy: { id: user.id, email: user.email },
    schemaVersion: "1.0",
    workspace: {
      id: workspace.id,
      name: workspace.name,
      country: workspace.country,
      plan: workspace.plan,
      createdAt: workspace.createdAt,
      kybStatus: workspace.kybStatus,
      kybVerifiedAt: workspace.kybVerifiedAt
    },
    members,
    determinations,
    certificates,
    auditLog: auditEntries.map((a) => ({ ...a, userAgent: a.userAgent ? "[redacted]" : null })),
    notifications,
    webhookEndpoints: webhookEndpoints.map(({ secret, ...rest }) => ({ ...rest, secret: "[redacted]" })),
    apiKeys: apiKeys.map(({ hashedKey, ...rest }) => ({ ...rest, hashedKey: "[redacted]" }))
  };

  const json = JSON.stringify(dump, null, 2);
  const filename = `sokoni-workspace-${workspace.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${new Date().toISOString().slice(0, 10)}.json`;

  return new Response(json, {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store"
    }
  });
}
