import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { log } from "@/lib/log";

export const runtime = "nodejs";

// Operator endpoint for posting / updating status incidents. Gated by
// STATUS_ADMIN_SECRET (Authorization: Bearer <secret>) so it can be driven
// from a runbook / on-call tool without a full admin UI.
function authorized(req: Request): boolean {
  const secret = process.env.STATUS_ADMIN_SECRET;
  if (!secret) return false;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

const CreateBody = z.object({
  title: z.string().min(3).max(200),
  status: z.enum(["investigating", "identified", "monitoring", "resolved"]).default("investigating"),
  impact: z.enum(["none", "minor", "major", "critical"]).default("minor"),
  components: z.array(z.string()).default([]),
  body: z.string().max(4000).optional()
});

const UpdateBody = z.object({
  id: z.string().uuid(),
  status: z.enum(["investigating", "identified", "monitoring", "resolved"]).optional(),
  body: z.string().max(4000).optional()
});

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const json = await req.json().catch(() => ({}));
  const parsed = CreateBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const rows = await db
    .insert(schema.statusIncidents)
    .values({
      title: parsed.data.title,
      status: parsed.data.status,
      impact: parsed.data.impact,
      components: parsed.data.components,
      body: parsed.data.body,
      resolvedAt: parsed.data.status === "resolved" ? new Date() : null
    })
    .returning({ id: schema.statusIncidents.id });

  log.warn({ incidentId: rows[0].id, impact: parsed.data.impact, title: parsed.data.title }, "status incident opened");
  return NextResponse.json({ ok: true, id: rows[0].id });
}

export async function PATCH(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Database not configured" }, { status: 503 });

  const json = await req.json().catch(() => ({}));
  const parsed = UpdateBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 });

  const update: Partial<typeof schema.statusIncidents.$inferInsert> = {};
  if (parsed.data.status) {
    update.status = parsed.data.status;
    if (parsed.data.status === "resolved") update.resolvedAt = new Date();
  }
  if (parsed.data.body !== undefined) update.body = parsed.data.body;

  await db.update(schema.statusIncidents).set(update).where(eq(schema.statusIncidents.id, parsed.data.id));
  log.info({ incidentId: parsed.data.id, status: parsed.data.status }, "status incident updated");
  return NextResponse.json({ ok: true });
}
