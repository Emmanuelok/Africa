import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { getMembership, revokeInvite } from "@/lib/data/projects";

export const runtime = "nodejs";

// Revoke an invite link. Owner only.
export async function DELETE(_req: Request, { params }: { params: { id: string; inviteId: string } }) {
  const user = await getSessionUser();
  const role = await getMembership(params.id, user.id);
  if (role !== "owner" && !user.isDemo) return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  await revokeInvite(params.id, params.inviteId);
  return NextResponse.json({ ok: true });
}
