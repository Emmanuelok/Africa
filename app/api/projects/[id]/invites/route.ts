import { NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/server/session";
import { getMembership, createInvite, listInvites } from "@/lib/data/projects";

export const runtime = "nodejs";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const role = await getMembership(params.id, user.id);
  if (role !== "owner" && !user.isDemo) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  const invites = await listInvites(params.id);
  return NextResponse.json({
    invites: invites.map((i) => ({ ...i, url: `${siteUrl()}/join/${i.token}` }))
  });
}

const Body = z.object({
  role: z.enum(["editor", "viewer"]).default("editor"),
  email: z.string().email().optional(),
  maxUses: z.number().int().min(1).max(1000).nullable().optional(),
  expiresInDays: z.number().int().min(1).max(365).nullable().optional()
});

// Mint a shareable join link (or a targeted email invite). Owner only.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  const role = await getMembership(params.id, user.id);
  if (role !== "owner" && !user.isDemo) {
    return NextResponse.json({ error: "Only the owner can create invite links." }, { status: 403 });
  }
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const invite = await createInvite(params.id, {
    role: parsed.data.role,
    email: parsed.data.email,
    maxUses: parsed.data.maxUses ?? null,
    expiresInDays: parsed.data.expiresInDays ?? null,
    createdById: user.id
  });

  return NextResponse.json({ ok: true, invite: { ...invite, url: `${siteUrl()}/join/${invite.token}` } });
}
