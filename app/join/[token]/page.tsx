import { redirect } from "next/navigation";
import Link from "next/link";
import { Users2, GraduationCap, Ship, ShieldCheck, Sparkles, AlertCircle } from "lucide-react";
import { previewInvite } from "@/lib/data/projects";
import { auth } from "@/auth";
import { JoinButton } from "@/components/projects/JoinButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { token: string } }) {
  const preview = await previewInvite(params.token);
  if (preview.valid && preview.project) {
    return {
      title: `Join "${preview.project.name}" — Sokoni`,
      description: preview.project.description ?? "You've been invited to collaborate on Sokoni.",
      openGraph: { title: `Join "${preview.project.name}"`, description: preview.project.description ?? "" }
    };
  }
  return { title: "Project invite — Sokoni" };
}

export default async function JoinPage({ params }: { params: { token: string } }) {
  const preview = await previewInvite(params.token);
  const session = await auth().catch(() => null);
  const signedIn = !!session?.user?.email;

  if (!preview.valid) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-3xl border border-ink-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-xl font-semibold">Invite unavailable</h1>
          <p className="mt-2 text-sm text-ink-600">{preview.reason ?? "This invite link is invalid."}</p>
          <Link href="/" className="mt-5 inline-block text-sm font-medium text-terracotta-700 hover:underline">
            Go to Sokoni →
          </Link>
        </div>
      </main>
    );
  }

  const p = preview.project!;
  const isStudy = p.kind === "study";
  const accent = p.color || (isStudy ? "#1f7a4d" : "#b8401f");

  return (
    <main className="relative mx-auto max-w-2xl px-4 py-12">
      {/* Ambient gradient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-sand-100 to-transparent"
      />

      <div className="rounded-3xl border border-ink-200 bg-white/80 p-8 shadow-[0_8px_32px_-12px_rgba(15,15,14,0.18)] backdrop-blur">
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-500">
          <Sparkles className="h-3.5 w-3.5" style={{ color: accent }} />
          You&apos;ve been invited{preview.inviterName ? ` by ${preview.inviterName}` : ""}
        </div>

        <div className="mt-3 flex items-start gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
            style={{ background: `linear-gradient(135deg, ${accent}, ${accent}dd)` }}
          >
            {isStudy ? <GraduationCap className="h-7 w-7" /> : <Ship className="h-7 w-7" />}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-semibold leading-tight">{p.name}</h1>
            {p.topic && <p className="mt-0.5 text-sm text-ink-600">Topic: {p.topic}</p>}
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1">
                <Users2 className="h-3.5 w-3.5" />
                {p.memberCount} {p.memberCount === 1 ? "member" : "members"}
              </span>
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" />
                Joining as {preview.role}
              </span>
            </div>
          </div>
        </div>

        {p.description && (
          <p className="mt-5 rounded-xl bg-sand-50/70 p-4 text-sm leading-relaxed text-ink-700">
            {p.description}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {signedIn ? (
            <JoinButton token={params.token} />
          ) : (
            <Link
              href={`/signin?callbackUrl=${encodeURIComponent(`/join/${params.token}`)}`}
              className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-700"
            >
              Sign in to join
            </Link>
          )}
          <Link href="/" className="text-sm text-ink-600 hover:text-ink-900">
            Not now
          </Link>
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-ink-500">
        Sokoni rooms work across organisations. Joining this project doesn&apos;t add you to{" "}
        {preview.inviterName ? `${preview.inviterName}'s` : "the owner's"} workspace.
      </p>
    </main>
  );
}
