import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = {
  title: "Account deleted — Sokoni",
  robots: { index: false, follow: false }
};

export default function AccountDeletedPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-md px-4 py-16 text-center md:px-6 md:py-24">
        <Badge tone="savanna">GDPR right to erasure</Badge>
        <Card className="mt-6">
          <CheckCircle2 className="mx-auto h-12 w-12 text-savanna-600" />
          <h1 className="mt-4 font-display text-2xl font-semibold">Your account has been deleted.</h1>
          <p className="mt-2 text-sm text-ink-700">
            Every workspace where you were the sole owner has been removed, including its
            determinations, certificates, webhooks, API keys, and audit log. Any sole-owner Stripe
            subscriptions have been cancelled. We retain billing records and audit entries for the
            statutory minimum (7 years) where required by law.
          </p>
          <p className="mt-4 text-xs text-ink-500">
            Want to come back? You can register a new account with the same email at any time.
          </p>
          <div className="mt-6 flex justify-center gap-2">
            <Link
              href="/"
              className="rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
            >
              Back to sokoni.africa
            </Link>
            <Link
              href="/register"
              className="rounded-lg border border-ink-300 bg-white px-4 py-2 text-sm font-medium hover:bg-ink-50"
            >
              Create a new account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
