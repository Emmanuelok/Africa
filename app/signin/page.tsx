import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SigninForm } from "@/components/auth/SigninForm";

export const metadata = { title: "Sign in — Sokoni" };

export default function SigninPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-md px-4 py-16 md:px-6 md:py-24">
        <Badge tone="info">Sign in</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold">Welcome back.</h1>
        <p className="mt-2 text-sm text-ink-600">
          Sign in to your AfriOrigin workspace. We&apos;ll ask for your 2FA code if you&apos;ve
          enabled it.
        </p>

        <Card className="mt-6">
          <Suspense fallback={<div className="text-sm text-ink-500">Loading…</div>}>
            <SigninForm />
          </Suspense>
        </Card>

        <div className="mt-4 text-center text-sm text-ink-600">
          New to Sokoni?{" "}
          <Link href="/register" className="font-medium text-terracotta-700 hover:underline">
            Create an account
          </Link>{" "}·{" "}
          <Link href="/signup" className="font-medium text-terracotta-700 hover:underline">
            Join the waitlist
          </Link>
        </div>
      </div>
    </div>
  );
}
