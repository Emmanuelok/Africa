import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/server/session";
import { auth } from "@/auth";
import { previewInvite, redeemInvite } from "@/lib/data/projects";

export const runtime = "nodejs";

// Public preview of an invite link — no auth required so a recipient can see
// what they're joining before signing in.
export async function GET(_req: Request, { params }: { params: { token: string } }) {
  const preview = await previewInvite(params.token);
  // Tell the client whether the visitor is already signed in (so the join CTA
  // can route to sign-in with a callback when they aren't).
  let signedIn = false;
  try {
    const session = await auth();
    signedIn = !!session?.user?.email;
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ...preview, signedIn });
}

// Redeem the invite: add the signed-in user to the project as a member.
export async function POST(_req: Request, { params }: { params: { token: string } }) {
  const user = await getSessionUser();
  if (user.isDemo) {
    return NextResponse.json(
      { ok: false, requiresAuth: true, message: "Sign in to join this project." },
      { status: 200 }
    );
  }
  const result = await redeemInvite(params.token, {
    id: user.id,
    name: user.name,
    email: user.email,
    organization: user.workspaceName
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true, projectId: result.projectId, already: result.already });
}
