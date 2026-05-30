"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/react";

// Vercel Analytics fires page-view beacons on every navigation. Under GDPR /
// POPIA the user needs to opt in (or out) before we collect anything beyond
// strictly-necessary data. We mount the <Analytics /> component only when the
// consent cookie says "all".

const STORAGE_KEY = "sokoni:cookie-consent";

export function ConditionalAnalytics() {
  const [consent, setConsent] = useState<"all" | "essential" | null>(null);

  useEffect(() => {
    function read(): "all" | "essential" | null {
      try {
        const v = localStorage.getItem(STORAGE_KEY);
        if (v === "all" || v === "essential") return v;
      } catch {}
      return null;
    }
    setConsent(read());

    // Pick up live changes from the cookie banner.
    function onStorage(e: StorageEvent) {
      if (e.key === STORAGE_KEY) setConsent(read());
    }
    window.addEventListener("storage", onStorage);
    // Also poll for cross-tab + same-tab changes (the cookie banner writes
    // localStorage on click and doesn't trigger StorageEvent for the same tab).
    const interval = setInterval(() => setConsent(read()), 1500);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearInterval(interval);
    };
  }, []);

  if (consent !== "all") return null;
  return <Analytics />;
}
