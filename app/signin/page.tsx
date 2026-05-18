import Link from "next/link";
import { LogIn, Info } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export const metadata = { title: "Sign in — Sokoni" };

export default function SigninPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-md px-4 py-16 md:px-6 md:py-24">
        <Badge tone="info">Beta</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold">Welcome back.</h1>
        <p className="mt-2 text-sm text-ink-600">
          Sign in to your AfriOrigin workspace.
        </p>

        <Card className="mt-6">
          <form className="space-y-4" action="/dashboard">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-ink-500">Email</span>
              <input
                type="email"
                required
                placeholder="you@coop.africa"
                className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
              />
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-ink-500">Password</span>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
              />
            </label>
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-terracotta-600 px-5 py-3 text-sm font-medium text-white hover:bg-terracotta-700"
            >
              <LogIn className="h-4 w-4" /> Sign in
            </button>
          </form>
          <div className="mt-4 flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-900">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Sokoni is in early access. Real auth ships with the v1 launch. For now,{" "}
              <Link href="/signup" className="font-semibold underline">join the waitlist</Link> to
              reserve your workspace.
            </span>
          </div>
        </Card>

        <div className="mt-4 text-center text-sm text-ink-600">
          New to Sokoni?{" "}
          <Link href="/signup" className="font-medium text-terracotta-700 hover:underline">
            Create an account
          </Link>
        </div>
      </div>
    </div>
  );
}
