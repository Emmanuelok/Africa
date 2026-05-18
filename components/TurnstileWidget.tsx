"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "invisible" | "flexible";
        }
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export function TurnstileWidget({
  onToken,
  theme = "light"
}: {
  onToken: (token: string) => void;
  theme?: "light" | "dark";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    if (!ref.current) return;

    let cancelled = false;

    function render() {
      if (cancelled || !ref.current || !window.turnstile) return;
      try {
        widgetId.current = window.turnstile.render(ref.current, {
          sitekey: siteKey!,
          theme,
          size: "flexible",
          callback: (token) => onToken(token)
        });
      } catch {}
    }

    if (window.turnstile) {
      render();
    } else if (!document.querySelector(`script[src="${SCRIPT_SRC}"]`)) {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.defer = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      const t = setInterval(() => {
        if (window.turnstile) {
          clearInterval(t);
          render();
        }
      }, 100);
      setTimeout(() => clearInterval(t), 5000);
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try { window.turnstile.remove(widgetId.current); } catch {}
      }
    };
  }, [siteKey, theme, onToken]);

  if (!siteKey) return null;
  return <div ref={ref} className="mt-2" />;
}
