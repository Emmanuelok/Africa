"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

// Reads the `?email=` status query param the email-change confirm endpoint
// appends and surfaces a banner. Self-clears on dismiss.
export function EmailChangeBanner() {
  const params = useSearchParams();
  const router = useRouter();
  const status = params.get("email");
  const [show, setShow] = useState(!!status);

  useEffect(() => { setShow(!!status); }, [status]);

  if (!show || !status) return null;

  const map: Record<string, { tone: "ok" | "err"; title: string; body: string }> = {
    ok: { tone: "ok", title: "Email updated.", body: "Sign in next time with the new address." },
    expired: { tone: "err", title: "Link expired or already used.", body: "Request a new confirmation from the profile section." },
    invalid: { tone: "err", title: "Invalid link.", body: "The link is missing parameters or has been tampered with." },
    taken: { tone: "err", title: "That email is already in use.", body: "Pick a different address." },
    unavailable: { tone: "err", title: "Email change unavailable.", body: "Database not configured in this environment." }
  };
  const m = map[status] ?? map.invalid;
  const ok = m.tone === "ok";

  return (
    <div className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${ok ? "border-savanna-300 bg-savanna-50 text-savanna-900" : "border-amber-300 bg-amber-50 text-amber-900"}`}>
      {ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 text-savanna-600" /> : <AlertCircle className="mt-0.5 h-5 w-5 text-amber-600" />}
      <div className="flex-1 text-sm">
        <strong>{m.title}</strong> {m.body}
      </div>
      <button
        onClick={() => {
          setShow(false);
          const url = new URL(window.location.href);
          url.searchParams.delete("email");
          router.replace(`${url.pathname}${url.search}`);
        }}
        aria-label="Dismiss"
        className="shrink-0 text-ink-400 hover:text-ink-700"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
