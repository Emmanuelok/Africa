import Link from "next/link";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { RegisterForm } from "@/components/RegisterForm";

export const metadata = { title: "Create your account — Sokoni" };

const PERKS = [
  { title: "1 month free Pro for early-access SMEs", body: "Founding-cohort pricing locked for life." },
  { title: "Direct line to the compliance team", body: "Edge-case origin questions answered by trade counsel." },
  { title: "Live AfCFTA wizard from day one", body: "Classify, determine, certify in 60 seconds." },
  { title: "API access on every tier", body: "Embed into your ERP, freight, or e-commerce stack." }
];

export default function RegisterPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-12 md:grid-cols-2 md:px-6 md:py-20">
        <div>
          <Badge tone="terracotta">
            <Sparkles className="h-3 w-3" /> Direct signup
          </Badge>
          <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
            Create your Sokoni workspace.
          </h1>
          <p className="mt-3 text-ink-700">
            Skip the waitlist — if your database is wired up, you&apos;ll go straight into the
            dashboard. Otherwise we&apos;ll route you to the waitlist automatically.
          </p>

          <ul className="mt-8 space-y-3 text-sm">
            {PERKS.map((p) => (
              <li key={p.title} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-savanna-600" />
                <div>
                  <div className="font-semibold">{p.title}</div>
                  <div className="text-ink-600">{p.body}</div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-5 text-sm text-ink-600">
            Already have an account?{" "}
            <Link href="/signin" className="font-medium text-terracotta-700 hover:underline">
              Sign in
            </Link>
            {" · "}
            <Link href="/signup" className="font-medium text-terracotta-700 hover:underline">
              Or join the waitlist
            </Link>
          </div>
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
