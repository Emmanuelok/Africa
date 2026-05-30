import { NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { getDb, schema } from "@/lib/db/client";
import { getSessionUser } from "@/lib/server/session";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/server/workspace";
import { audit, ipAndUaFromRequest } from "@/lib/server/audit";
import { getIdempotent, rememberIdempotent, readIdempotencyKey } from "@/lib/server/idempotency";
import { logFor } from "@/lib/log";

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().min(2).max(120),
  country: z.string().length(2).optional().nullable()
});

export async function POST(req: Request) {
  const logger = logFor(req, { route: "/api/workspaces" });
  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.json(
      { error: "Workspace creation requires a real account. Sign up at /register." },
      { status: 403 }
    );
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Workspace creation requires a configured database." },
      { status: 503 }
    );
  }

  const idem = readIdempotencyKey(req);
  if (idem) {
    const prev = await getIdempotent(`ws:${user.id}`, idem);
    if (prev) return NextResponse.json(prev.body, { status: prev.status });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  const name = parsed.data.name.trim();
  const country = parsed.data.country ? parsed.data.country.toUpperCase() : null;

  const created = await db
    .insert(schema.workspaces)
    .values({ name, country, plan: "free" })
    .returning({ id: schema.workspaces.id, name: schema.workspaces.name });

  await db.insert(schema.workspaceMembers).values({
    workspaceId: created[0].id,
    userId: user.id,
    role: "owner"
  });

  cookies().set(ACTIVE_WORKSPACE_COOKIE, created[0].id, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });

  const { ipAddress, userAgent } = ipAndUaFromRequest(req);
  audit({
    workspaceId: created[0].id,
    userId: user.id,
    action: "workspace.member_invited",
    target: created[0].id,
    metadata: { event: "workspace_created", name },
    ipAddress,
    userAgent
  });

  logger.info({ workspaceId: created[0].id, name }, "workspace created");

  const response = { ok: true, id: created[0].id, name: created[0].name };
  if (idem) await rememberIdempotent(`ws:${user.id}`, idem, { status: 200, body: response });
  return NextResponse.json(response);
}
