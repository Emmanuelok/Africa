"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight, Eye, EyeOff, Loader2, AlertCircle, Check } from "lucide-react";
import { TurnstileWidget } from "@/components/TurnstileWidget";

type Status = "idle" | "loading" | "success" | "error";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const pwStrength = strength(password);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 12) {
      setError("Password must be at least 12 characters.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, captchaToken })
      });
      const data = await res.json();
      if (!res.ok) {
        // 503 means no DB — direct user to waitlist
        if (res.status === 503 && data?.redirect) {
          window.location.href = data.redirect;
          return;
        }
        throw new Error(data?.error ?? "Could not create account");
      }
      setStatus("success");
      // Sign them in immediately by redirecting through the credentials flow.
      const signinRes = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email, password, redirect: "false" }),
        credentials: "include"
      });
      if (signinRes.ok || signinRes.redirected) {
        window.location.href = "/dashboard";
        return;
      }
      // Fallback — just take them to /signin so they can sign in manually.
      window.location.href = "/signin?registered=1";
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Could not create account");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-2xl border border-savanna-300 bg-savanna-50 p-5 text-savanna-900">
        <div className="flex items-start gap-3">
          <Check className="mt-0.5 h-5 w-5 text-savanna-600" />
          <div>
            <div className="font-semibold">Account created.</div>
            <p className="mt-1 text-sm">Redirecting to your dashboard…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-ink-500">Full name</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Amara Okonkwo"
          required
          className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
        />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-ink-500">Work email</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@coop.africa"
          required
          className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
        />
      </label>
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-ink-500">Password (min. 12 characters)</span>
        <div className="relative mt-1">
          <input
            type={showPw ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            minLength={12}
            required
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 pr-10 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
            aria-label="Toggle password visibility"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {password.length > 0 && (
          <div className="mt-1.5 flex items-center gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded ${i < pwStrength.score ? pwStrength.color : "bg-ink-100"}`}
              />
            ))}
            <span className="ml-2 w-16 text-right text-xs text-ink-500">{pwStrength.label}</span>
          </div>
        )}
      </label>

      <TurnstileWidget onToken={setCaptchaToken} />

      <button
        type="submit"
        disabled={status === "loading"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-terracotta-600 px-5 py-3 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
      >
        {status === "loading" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
          </>
        ) : (
          <>
            Create account <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {status === "error" && (
        <div className="flex items-start gap-2 rounded-lg bg-terracotta-50 p-3 text-sm text-terracotta-800">
          <AlertCircle className="mt-0.5 h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      <p className="text-xs text-ink-500">
        By creating an account you agree to our{" "}
        <a href="/terms" className="underline-offset-2 hover:underline">Terms</a> and{" "}
        <a href="/privacy" className="underline-offset-2 hover:underline">Privacy Policy</a>.
      </p>
    </form>
  );
}

function strength(pw: string): { score: number; label: string; color: string } {
  if (pw.length === 0) return { score: 0, label: "", color: "" };
  if (pw.length < 12) return { score: 1, label: "Too short", color: "bg-terracotta-500" };
  let score = 2;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score += 0.5;
  if (/[0-9]/.test(pw)) score += 0.5;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  const final = Math.min(4, Math.ceil(score));
  const labels = ["", "Weak", "OK", "Good", "Strong"];
  const colors = ["", "bg-terracotta-500", "bg-amber-400", "bg-savanna-400", "bg-savanna-600"];
  return { score: final, label: labels[final], color: colors[final] };
}
