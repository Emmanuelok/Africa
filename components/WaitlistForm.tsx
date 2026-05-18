"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Check, AlertCircle, Loader2 } from "lucide-react";
import { TurnstileWidget } from "@/components/TurnstileWidget";

type Status = "idle" | "loading" | "success" | "error";

export function WaitlistForm({
  variant = "light",
  source = "landing"
}: {
  variant?: "light" | "dark";
  source?: string;
}) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [country, setCountry] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, company, country, source, captchaToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong");
      setStatus("success");
      setMessage(data.message ?? "You're on the list. We'll be in touch.");
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const dark = variant === "dark";

  if (status === "success") {
    return (
      <div
        className={`rounded-2xl border p-5 ${
          dark
            ? "border-savanna-700 bg-savanna-900/40 text-savanna-100"
            : "border-savanna-300 bg-savanna-50 text-savanna-900"
        }`}
      >
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-5 w-5 text-savanna-500" />
          <div>
            <div className="font-semibold">You&apos;re on the list.</div>
            <p className="mt-1 text-sm opacity-90">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  const labelClass = dark ? "text-ink-300" : "text-ink-500";
  const inputClass = dark
    ? "bg-ink-900 border-ink-700 text-white placeholder:text-ink-500 focus:border-terracotta-500"
    : "bg-white border-ink-200 text-ink-900 placeholder:text-ink-400 focus:border-terracotta-500";

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className={`text-xs uppercase tracking-wide ${labelClass}`}>Work email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@coop.africa"
            className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 ${inputClass}`}
          />
        </label>
        <label className="block">
          <span className={`text-xs uppercase tracking-wide ${labelClass}`}>Company</span>
          <input
            type="text"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder="Your business name"
            className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 ${inputClass}`}
          />
        </label>
      </div>
      <label className="block">
        <span className={`text-xs uppercase tracking-wide ${labelClass}`}>Country</span>
        <input
          type="text"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          placeholder="Where do you ship from?"
          className={`mt-1 w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 ${inputClass}`}
        />
      </label>
      <TurnstileWidget onToken={setCaptchaToken} theme={dark ? "dark" : "light"} />
      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-terracotta-600 px-5 py-3 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Joining…
          </>
        ) : (
          <>
            Join the waitlist <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      {status === "error" && (
        <div
          className={`flex items-start gap-2 rounded-lg p-3 text-sm ${
            dark ? "bg-terracotta-900/40 text-terracotta-200" : "bg-terracotta-50 text-terracotta-800"
          }`}
        >
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{message}</span>
        </div>
      )}
      <p className={`text-xs ${dark ? "text-ink-400" : "text-ink-500"}`}>
        By joining you agree to our{" "}
        <a href="/terms" className="underline-offset-2 hover:underline">Terms</a> and{" "}
        <a href="/privacy" className="underline-offset-2 hover:underline">Privacy Policy</a>. We&apos;ll
        never share your data.
      </p>
    </form>
  );
}
