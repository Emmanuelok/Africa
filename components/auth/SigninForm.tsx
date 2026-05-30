"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LogIn, Loader2, AlertCircle, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";

export function SigninForm() {
  const params = useSearchParams();
  const from = params.get("from") ?? "/dashboard";
  const initialError = params.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [needsTotp, setNeedsTotp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    initialError === "CredentialsSignin" ? "Invalid email or password." : initialError
  );

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        totp: totp || undefined,
        redirect: false,
        callbackUrl: from
      });
      if (!result) {
        setError("Sign-in unavailable.");
        return;
      }
      if (result.error) {
        // Our authorize() throws "2FA_REQUIRED" to signal the second-factor step.
        if (result.error.includes("2FA_REQUIRED")) {
          setNeedsTotp(true);
        } else if (needsTotp && !totp) {
          setError("Enter your 2FA code.");
        } else if (needsTotp) {
          setError("Code did not verify. Try again or use a recovery code.");
        } else {
          setError("Incorrect email or password.");
        }
        return;
      }
      window.location.href = result.url ?? from;
    } catch {
      setError("Sign-in failed. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block">
        <span className="text-xs uppercase tracking-wide text-ink-500">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={needsTotp}
          placeholder="you@coop.africa"
          className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 disabled:bg-ink-50"
        />
      </label>
      <label className="block">
        <div className="flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wide text-ink-500">Password</span>
          <Link href="/forgot-password" className="text-xs font-medium text-terracotta-700 hover:underline">
            Forgot?
          </Link>
        </div>
        <div className="relative mt-1">
          <input
            type={showPw ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={needsTotp}
            placeholder="••••••••"
            className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 pr-10 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 disabled:bg-ink-50"
          />
          <button
            type="button"
            onClick={() => setShowPw((s) => !s)}
            disabled={needsTotp}
            aria-label="Toggle password visibility"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </label>

      {needsTotp && (
        <label className="block">
          <span className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-ink-500">
            <ShieldCheck className="h-3 w-3" /> 2FA code or recovery code
          </span>
          <input
            autoFocus
            value={totp}
            onChange={(e) => setTotp(e.target.value)}
            placeholder="123 456 or XXXXX-XXXXX"
            className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2.5 text-center font-mono text-base tracking-widest focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          />
        </label>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-terracotta-600 px-5 py-3 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
        {needsTotp ? "Verify & sign in" : "Sign in"}
      </button>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-terracotta-50 p-3 text-sm text-terracotta-800">
          <AlertCircle className="mt-0.5 h-4 w-4" /> <span>{error}</span>
        </div>
      )}
    </form>
  );
}
