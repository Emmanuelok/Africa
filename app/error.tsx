"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error("[sokoni:error]", error);
  }, [error]);

  return (
    <div className="bg-pattern">
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-20 text-center md:px-6">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-terracotta-50 text-terracotta-700">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold">Something went wrong.</h1>
        <p className="mt-2 max-w-md text-ink-600">
          We&apos;ve logged the error. You can try again, or head back to the home page.
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-ink-400">Error ref: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-terracotta-700"
          >
            <RefreshCw className="h-4 w-4" /> Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-5 py-2.5 text-sm font-medium text-ink-900 hover:bg-ink-50"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
