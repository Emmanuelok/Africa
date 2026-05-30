import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Forgot password — Sokoni" };

export default function ForgotPasswordPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-md px-4 py-16 md:px-6 md:py-24">
        <Badge tone="neutral">Account recovery</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold">Forgot your password?</h1>
        <p className="mt-2 text-sm text-ink-600">
          We&apos;ll email you a link to choose a new one. The link is valid for one hour.
        </p>
        <Card className="mt-6">
          <ForgotPasswordForm />
        </Card>
        <div className="mt-4 text-center text-sm text-ink-600">
          Remembered it?{" "}
          <Link href="/signin" className="font-medium text-terracotta-700 hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
