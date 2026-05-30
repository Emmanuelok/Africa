import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

export const metadata = { title: "Reset password — Sokoni" };
export const dynamic = "force-dynamic";

export default function ResetPasswordPage({ searchParams }: { searchParams: { token?: string; email?: string } }) {
  const email = searchParams?.email ?? "";
  const token = searchParams?.token ?? "";
  const valid = !!email && !!token;

  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-md px-4 py-16 md:px-6 md:py-24">
        <Badge tone="neutral">Reset password</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold">Choose a new password</h1>
        <p className="mt-2 text-sm text-ink-600">
          {valid
            ? `Setting a new password for ${email}.`
            : "This link looks malformed. Request a new one from /forgot-password."}
        </p>
        <Card className="mt-6">
          {valid ? (
            <ResetPasswordForm email={email} token={token} />
          ) : (
            <Link href="/forgot-password" className="text-sm font-medium text-terracotta-700 hover:underline">
              Request a new reset link →
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}
