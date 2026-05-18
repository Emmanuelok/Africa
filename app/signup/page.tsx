import Link from "next/link";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { WaitlistForm } from "@/components/WaitlistForm";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Create your account — Sokoni" };

export default function SignupPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 md:grid-cols-2 md:px-6 md:py-20">
        <div>
          <Badge tone="terracotta">
            <Sparkles className="h-3 w-3" /> Early access
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
            Join the AfriOrigin waitlist.
          </h1>
          <p className="mt-3 text-ink-700">
            We&apos;re onboarding SMEs in cohorts. Tell us where you ship from and what you export.
            Early-access members get <strong>3 months free on Pro</strong> when billing opens.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            <Perk title="One AfCFTA determination free every month" body="Try the full wizard end-to-end before you ever pay." />
            <Perk title="Direct access to the compliance team" body="Edge-case origin questions get answered by our trade counsel." />
            <Perk title="Influence the roadmap" body="Tell us which tariff schedules to ship next." />
            <Perk title="Founding-cohort pricing locked for life" body="Whatever we charge later, you keep your initial rate." />
          </ul>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-5 text-sm text-ink-600">
            Already on the platform?{" "}
            <Link href="/signin" className="font-medium text-terracotta-700 hover:underline">
              Sign in
            </Link>
          </div>
          <WaitlistForm source="signup" />
        </div>
      </div>
    </div>
  );
}

function Perk({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-savanna-600" />
      <div>
        <div className="font-semibold">{title}</div>
        <div className="text-ink-600">{body}</div>
      </div>
    </li>
  );
}
