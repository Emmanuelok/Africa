import Link from "next/link";
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Verify email — Sokoni" };
export const dynamic = "force-dynamic";

export default function VerifyEmailPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams?.status ?? "pending";

  let icon = Clock;
  let tone: "savanna" | "warn" | "terracotta" | "neutral" = "neutral";
  let title = "Verify your email";
  let body = "Click the link in the email we sent. It expires in 24 hours.";

  if (status === "ok") {
    icon = CheckCircle2;
    tone = "savanna";
    title = "Email verified";
    body = "Thanks for confirming. Your account is fully active.";
  } else if (status === "expired") {
    icon = AlertCircle;
    tone = "warn";
    title = "Link expired or already used";
    body = "Sign in and request a new verification email from your settings.";
  } else if (status === "invalid") {
    icon = AlertCircle;
    tone = "terracotta";
    title = "Invalid verification link";
    body = "The link is missing parameters or has been tampered with.";
  } else if (status === "unavailable") {
    icon = AlertCircle;
    tone = "warn";
    title = "Verification unavailable";
    body = "The database isn't configured. Try again from a connected environment.";
  }

  const Icon = icon;

  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-md px-4 py-16 text-center md:px-6 md:py-24">
        <Badge tone={tone}>Email verification</Badge>
        <Card className="mt-6">
          <Icon className={`mx-auto h-12 w-12 ${tone === "savanna" ? "text-savanna-600" : tone === "warn" ? "text-amber-600" : tone === "terracotta" ? "text-terracotta-600" : "text-ink-500"}`} />
          <h1 className="mt-4 font-display text-2xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm text-ink-700">{body}</p>
          <div className="mt-6 flex justify-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
            >
              Open dashboard
            </Link>
            <Link
              href="/signin"
              className="rounded-lg border border-ink-300 bg-white px-4 py-2 text-sm font-medium hover:bg-ink-50"
            >
              Sign in
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
