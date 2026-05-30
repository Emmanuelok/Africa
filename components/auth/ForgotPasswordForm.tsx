"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Loader2, AlertCircle, Check } from "lucide-react";
import { TurnstileWidget } from "@/components/TurnstileWidget";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/auth/forgot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, captchaToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not send reset link");
      setStatus("ok");
    } catch (err) {
      setStatus("err");
      setError(err instanceof Error ? err.message : "Could not send reset link");
    }
  }

  if (status === "ok") {
    return (
      <div className="flex items-start gap-3 rounded-lg border border-savanna-300 bg-savanna-50 p-3 text-sm text-savanna-900">
        <Check className="mt-0.5 h-5 w-5 text-savanna-600" />
        <div>
          <div className="font-semibold">Check your inbox.</div>
          <p className="mt-1 text-sm">
            If <strong>{email}</strong> has an account, a reset link is on the way. Check your spam
            folder if you don&apos;t see it in a few minutes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-ink-500">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@coop.africa"
          className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
        />
      </label>
      <TurnstileWidget onToken={setCaptchaToken} />
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-terracotta-600 px-5 py-3 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Sending…
          </>
        ) : (
          <>
            Email me a reset link <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      {status === "err" && (
        <div className="flex items-start gap-2 rounded-lg bg-terracotta-50 p-3 text-sm text-terracotta-800">
          <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
        </div>
      )}
    </form>
  );
}
