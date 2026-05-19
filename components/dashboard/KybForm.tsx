"use client";

import { useState, type FormEvent } from "react";
import { Loader2, ShieldCheck, AlertCircle, Hourglass, ShieldX } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

const COUNTRIES = [
  { code: "NG", name: "Nigeria", placeholder: "RC1234567" },
  { code: "KE", name: "Kenya", placeholder: "PVT-XXX12345" },
  { code: "GH", name: "Ghana", placeholder: "CS123456789" },
  { code: "ZA", name: "South Africa", placeholder: "2019/123456/07" },
  { code: "UG", name: "Uganda", placeholder: "80020001234567" },
  { code: "TZ", name: "Tanzania", placeholder: "12345678" },
  { code: "RW", name: "Rwanda", placeholder: "100123456" },
  { code: "CI", name: "Côte d'Ivoire", placeholder: "CI-ABJ-2023-A-12345" }
];

const BUSINESS_TYPES = [
  { code: "co", label: "Limited liability company" },
  { code: "sp", label: "Sole proprietorship" },
  { code: "it", label: "Cooperative / trust" },
  { code: "bn", label: "Business name / partnership" }
];

type Status = "not_started" | "pending" | "verified" | "rejected";

export function KybForm({
  initialStatus,
  rejectionReason,
  verifiedAt
}: {
  initialStatus: Status;
  rejectionReason: string | null;
  verifiedAt: string | null;
}) {
  const [status, setStatus] = useState<Status>(initialStatus);
  const [country, setCountry] = useState("NG");
  const [businessType, setBusinessType] = useState("co");
  const [businessName, setBusinessName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const placeholder = COUNTRIES.find((c) => c.code === country)?.placeholder ?? "";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/kyb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, businessType, businessName, registrationNumber })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Verification request failed");
      setStatus(data.status);
      setMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification request failed");
    } finally {
      setLoading(false);
    }
  }

  // Already verified — show summary
  if (status === "verified") {
    return (
      <Card className="border-savanna-300 bg-savanna-50/60">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-6 w-6 text-savanna-700" />
          <div>
            <Badge tone="savanna">Verified business</Badge>
            <h2 className="mt-2 font-semibold">Your workspace is KYB-verified.</h2>
            <p className="mt-1 text-sm text-ink-700">
              {verifiedAt && (
                <>Verified {new Date(verifiedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. </>
              )}
              You can issue Certificates of Origin under the AfCFTA Approved Exporter scheme without
              additional review.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  // Pending — Smile processing
  if (status === "pending") {
    return (
      <Card className="border-amber-300 bg-amber-50/60">
        <div className="flex items-start gap-3">
          <Hourglass className="mt-0.5 h-6 w-6 text-amber-700" />
          <div>
            <Badge tone="warn">Verification in progress</Badge>
            <h2 className="mt-2 font-semibold">Smile Identity is reviewing your details.</h2>
            <p className="mt-1 text-sm text-ink-700">
              {message ?? "Most verifications complete within a few hours. You'll receive an email when the status changes."}
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <>
      {status === "rejected" && (
        <Card className="border-terracotta-300 bg-terracotta-50/40">
          <div className="flex items-start gap-3">
            <ShieldX className="mt-0.5 h-6 w-6 text-terracotta-700" />
            <div>
              <Badge tone="terracotta">Previous attempt rejected</Badge>
              {rejectionReason && (
                <p className="mt-2 text-sm text-ink-700">{rejectionReason}</p>
              )}
              <p className="mt-2 text-sm text-ink-700">
                Re-submit with corrected details below.
              </p>
            </div>
          </div>
        </Card>
      )}

      <Card>
        <h2 className="font-semibold">Business verification</h2>
        <p className="mt-1 text-sm text-ink-600">
          We verify your business with Smile Identity against the national business registry of
          your country. Required for the Approved Exporter status and unlocks higher Certificate
          quotas on paid tiers.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-ink-500">Country of registration</span>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs uppercase tracking-wide text-ink-500">Business type</span>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
              >
                {BUSINESS_TYPES.map((b) => (
                  <option key={b.code} value={b.code}>{b.label}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-ink-500">Registered business name</span>
            <input
              required
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Highlands Coffee Cooperative Limited"
              className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-ink-500">Registration number</span>
            <input
              required
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder={placeholder}
              className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm font-mono focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Submit for verification
              </>
            )}
          </button>
          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-terracotta-50 p-3 text-sm text-terracotta-800">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </form>

        <p className="mt-4 text-xs text-ink-500">
          Data is sent only to Smile Identity for verification and is not stored beyond what&apos;s
          required by anti-money-laundering law. See our{" "}
          <a href="/privacy" className="text-terracotta-700 hover:underline">Privacy Policy</a>.
        </p>
      </Card>
    </>
  );
}
