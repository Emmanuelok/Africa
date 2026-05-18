"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function PlanButton({
  plan,
  label,
  variant = "primary",
  className = ""
}: {
  plan: "pro" | "bulk" | "forwarder" | "free";
  label: string;
  variant?: "primary" | "outline";
  className?: string;
}) {
  const [loading, setLoading] = useState(false);

  async function onClick() {
    // Free plan and forwarder always go to signup/sales — no live checkout.
    if (plan === "free") {
      window.location.href = "/signup";
      return;
    }
    if (plan === "forwarder") {
      window.location.href = "mailto:sales@sokoni.africa?subject=Forwarder%20plan%20inquiry";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();
      if (res.ok && data?.url) {
        window.location.href = data.url;
        return;
      }
      // Graceful fallback when Stripe isn't configured.
      window.location.href = data?.redirect ?? "/signup";
    } catch {
      window.location.href = "/signup";
    } finally {
      setLoading(false);
    }
  }

  const base =
    "inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-60";
  const styles =
    variant === "primary"
      ? "bg-terracotta-600 text-white hover:bg-terracotta-700"
      : "border border-ink-300 bg-white text-ink-900 hover:bg-ink-50";

  return (
    <button onClick={onClick} disabled={loading} className={`${base} ${styles} ${className}`}>
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </>
      ) : (
        label
      )}
    </button>
  );
}
