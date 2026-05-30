"use client";

import { useState } from "react";
import {
  ShieldCheck,
  Loader2,
  AlertCircle,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  RefreshCw
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Props = { initialEnabled: boolean };

export function TotpEnrollment({ initialEnabled }: Props) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [step, setStep] = useState<"idle" | "password" | "verify" | "done">("idle");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [token, setToken] = useState("");
  const [secret, setSecret] = useState("");
  const [qr, setQr] = useState("");
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Disable + regenerate dialog state
  const [disablePassword, setDisablePassword] = useState("");
  const [disableToken, setDisableToken] = useState("");

  async function startEnroll() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/totp/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not start enrollment");
      setSecret(data.secret);
      setQr(data.qrDataUrl);
      setStep("verify");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start enrollment");
    } finally {
      setBusy(false);
    }
  }

  async function confirmEnroll() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/totp/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret, token })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Verification failed");
      setRecoveryCodes(data.recoveryCodes ?? []);
      setEnabled(true);
      setStep("done");
      setPassword("");
      setToken("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/totp/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword, token: disableToken })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not disable 2FA");
      setEnabled(false);
      setDisablePassword("");
      setDisableToken("");
      setStep("idle");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not disable 2FA");
    } finally {
      setBusy(false);
    }
  }

  async function regenerateCodes() {
    const pw = window.prompt("Confirm your password to regenerate recovery codes.");
    if (!pw) return;
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/auth/totp/regenerate-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pw })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Could not regenerate");
      setRecoveryCodes(data.recoveryCodes ?? []);
      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not regenerate");
    } finally {
      setBusy(false);
    }
  }

  function copyCodes() {
    if (recoveryCodes.length === 0) return;
    void navigator.clipboard.writeText(recoveryCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  // ----- VIEW -----

  // Step 3: show recovery codes (after enroll OR regenerate)
  if (step === "done" && recoveryCodes.length > 0) {
    return (
      <Card className="border-savanna-300 bg-savanna-50/60">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-6 w-6 text-savanna-700" />
          <div className="min-w-0 flex-1">
            <Badge tone="savanna">2FA enabled</Badge>
            <h3 className="mt-2 font-semibold">Save your recovery codes</h3>
            <p className="mt-1 text-sm text-ink-700">
              Store these somewhere safe. Each code can be used once to sign in if you lose access
              to your authenticator app. We will never show them again.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-ink-950 p-3 font-mono text-xs text-ink-100">
              {recoveryCodes.map((c) => (
                <div key={c}>{c}</div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={copyCodes}
                className="inline-flex items-center gap-1.5 rounded-lg bg-ink-900 px-3 py-1.5 text-xs font-medium text-ink-100 hover:bg-ink-800"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy all"}
              </button>
              <button
                onClick={() => { setRecoveryCodes([]); setStep("idle"); }}
                className="text-xs text-ink-600 underline-offset-2 hover:underline"
              >
                I&apos;ve saved them — dismiss
              </button>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Enabled — show status + disable / regenerate controls
  if (enabled) {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-6 w-6 text-savanna-600" />
          <div className="flex-1">
            <Badge tone="savanna">2FA enabled</Badge>
            <h3 className="mt-2 font-semibold">Two-factor authentication is on.</h3>
            <p className="mt-1 text-sm text-ink-700">
              Every sign-in requires a 6-digit code from your authenticator app or one of your
              recovery codes.
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <button
                onClick={regenerateCodes}
                disabled={busy}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-ink-300 px-3 py-2 text-sm font-medium hover:bg-ink-50 disabled:opacity-60"
              >
                <RefreshCw className="h-4 w-4" /> Regenerate recovery codes
              </button>
            </div>

            <details className="mt-5 rounded-lg border border-ink-200 p-3">
              <summary className="cursor-pointer text-sm font-medium text-ink-900">
                Disable 2FA
              </summary>
              <p className="mt-2 text-xs text-ink-600">
                Requires your password and a current 6-digit code (or a recovery code).
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <input
                  type="password"
                  placeholder="Password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                />
                <input
                  placeholder="6-digit code or recovery code"
                  value={disableToken}
                  onChange={(e) => setDisableToken(e.target.value)}
                  className="rounded-lg border border-ink-200 bg-white px-3 py-2 font-mono text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                />
              </div>
              <button
                onClick={disable}
                disabled={busy || !disablePassword || !disableToken}
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-terracotta-300 bg-white px-3 py-2 text-sm font-medium text-terracotta-700 hover:bg-terracotta-50 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Disable 2FA
              </button>
              {error && step === "idle" && (
                <div className="mt-2 flex items-start gap-2 text-xs text-terracotta-700">
                  <AlertCircle className="mt-0.5 h-3 w-3" /> {error}
                </div>
              )}
            </details>
          </div>
        </div>
      </Card>
    );
  }

  // Not enabled, idle → ask for password to start enrollment
  if (step === "idle" || step === "password") {
    return (
      <Card>
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-6 w-6 text-ink-500" />
          <div className="flex-1">
            <h3 className="font-semibold">Two-factor authentication</h3>
            <p className="mt-1 text-sm text-ink-700">
              Add a second step to sign-in using any TOTP app (1Password, Authy, Aegis, Google
              Authenticator). Confirm your password to start.
            </p>
            <div className="mt-4 max-w-sm">
              <label className="block">
                <span className="text-xs uppercase tracking-wide text-ink-500">Password</span>
                <div className="relative mt-1">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-ink-200 bg-white px-3 py-2 pr-10 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <button
                onClick={startEnroll}
                disabled={busy || !password}
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                Start enrollment
              </button>
              {error && (
                <div className="mt-2 flex items-start gap-2 text-xs text-terracotta-700">
                  <AlertCircle className="mt-0.5 h-3 w-3" /> {error}
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Verify step: show QR + secret + ask for first code
  return (
    <Card>
      <h3 className="font-semibold">Scan with your authenticator app</h3>
      <p className="mt-1 text-sm text-ink-700">
        Scan the QR code or paste the secret into 1Password / Authy / Aegis, then enter the
        6-digit code it generates.
      </p>
      <div className="mt-5 grid items-center gap-6 md:grid-cols-[auto_1fr]">
        {qr && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={qr} alt="2FA QR" className="h-44 w-44 rounded-xl border border-ink-200 bg-white p-2" />
        )}
        <div className="space-y-3">
          <div>
            <span className="text-xs uppercase tracking-wide text-ink-500">Manual entry</span>
            <code className="mt-1 block break-all rounded-lg bg-ink-100 p-2 font-mono text-xs">{secret}</code>
          </div>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-ink-500">6-digit code</span>
            <input
              inputMode="numeric"
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              placeholder="123 456"
              className="mt-1 w-full max-w-xs rounded-lg border border-ink-200 bg-white px-3 py-2 text-center font-mono text-lg tracking-widest focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
            />
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={confirmEnroll}
              disabled={busy || token.length !== 6}
              className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Confirm and enable
            </button>
            <button
              onClick={() => { setStep("idle"); setSecret(""); setQr(""); setToken(""); setError(""); }}
              className="text-sm text-ink-600 hover:text-ink-900"
            >
              Cancel
            </button>
          </div>
          {error && (
            <div className="flex items-start gap-2 text-xs text-terracotta-700">
              <AlertCircle className="mt-0.5 h-3 w-3" /> {error}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
