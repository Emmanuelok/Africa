import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/session";
import { getMembership, listEvents, postEvent, isDemoProjectId } from "@/lib/data/projects";
import { rateLimit, clientIdentifier, rateLimitResponseHeaders } from "@/lib/ratelimit";

export const runtime = "nodejs";

// Poll the room feed. Cheap; the UI calls this on an interval for near-live
// collaboration.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const role = await getMembership(params.id, user.id);
  if (!role && !user.isDemo) return NextResponse.json({ error: "Not a member" }, { status: 403 });
  const events = await listEvents(params.id, user.id, { limit: 150 });
  return NextResponse.json({ events });
}

const Body = z.object({
  kind: z.enum(["message", "note", "question", "answer"]).default("message"),
  body: z.string().min(1).max(8000),
  determinationId: z.string().uuid().optional(),
  certificateId: z.string().uuid().optional()
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const ip = clientIdentifier(req);
  const rl = await rateLimit(ip, "api");
  const headers = rateLimitResponseHeaders(rl);
  if (!rl.success) return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers });

  const user = await getSessionUser();
  const role = await getMembership(params.id, user.id);

  // Demo rooms accept posts (rendered locally) so the experience is explorable.
  if (!role && !user.isDemo && !isDemoProjectId(params.id)) {
    return NextResponse.json({ error: "Not a member of this project." }, { status: 403, headers });
  }
  if (role === "viewer") {
    return NextResponse.json({ error: "Viewers can read but not post. Ask the owner for editor access." }, { status: 403, headers });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400, headers });
  }

  const event = await postEvent({
    projectId: params.id,
    user: { id: user.id, name: user.name, email: user.email },
    kind: parsed.data.kind,
    body: parsed.data.body,
    determinationId: parsed.data.determinationId,
    certificateId: parsed.data.certificateId
  });
  return NextResponse.json({ ok: true, event }, { headers });
}
