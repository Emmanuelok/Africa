"use client";

import { useEffect, useState } from "react";
import { X, ArrowRight, Sparkles, Wand2, ShieldCheck, Code2, FileCheck2, Check } from "lucide-react";

const STORAGE_KEY = "sokoni:onboarding-completed";

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to Sokoni",
    body: "This is your workspace. Every shipment you classify, every certificate you issue, every API call your stack makes lands here.",
    cta: { href: null, label: "Show me around" }
  },
  {
    icon: Wand2,
    title: "Run your first shipment",
    body: "Open the AfriOrigin wizard, paste a product description, and we'll classify the HS code, run rules of origin, and show your tariff savings.",
    cta: { href: "/afriorigin", label: "Try the wizard" }
  },
  {
    icon: ShieldCheck,
    title: "Saved automatically",
    body: "Every determination shows up in your history. Open one to see the rule applied, the savings, and the matching certificate.",
    cta: { href: "/dashboard/determinations", label: "Open determinations" }
  },
  {
    icon: FileCheck2,
    title: "Real PDF certificates",
    body: "Generate a Certificate of Origin in the AfCFTA format. Every cert has a QR code that resolves to a public verification page customs officers can scan.",
    cta: { href: "/dashboard/certificates", label: "View certificates" }
  },
  {
    icon: Code2,
    title: "Embed Sokoni in your stack",
    body: "API keys live in /dashboard/api-keys. Try the developer endpoints from /docs/api — predictable per-call pricing, no monthly minimum.",
    cta: { href: "/dashboard/api-keys", label: "Create an API key" }
  }
];

export function OnboardingTour({ workspaceName }: { workspaceName: string }) {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const done = localStorage.getItem(STORAGE_KEY);
      if (!done) setOpen(true);
    } catch {
      // localStorage unavailable — don't auto-show
    }
  }, []);

  function complete() {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    setOpen(false);
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1);
    else complete();
  }

  if (!mounted || !open) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink-950/40 backdrop-blur-sm"
        onClick={complete}
      />
      <div className="relative z-10 w-full max-w-md rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl sm:m-4">
        <button
          onClick={complete}
          aria-label="Skip tour"
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-md text-ink-400 hover:bg-ink-50 hover:text-ink-700"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-terracotta-50 text-terracotta-700">
          <Icon className="h-6 w-6" />
        </div>

        {step === 0 && (
          <div className="mt-3 text-xs uppercase tracking-wide text-ink-500">
            {workspaceName}
          </div>
        )}
        <h2 className="mt-3 font-display text-xl font-semibold">{current.title}</h2>
        <p className="mt-2 text-sm text-ink-700">{current.body}</p>

        <div className="mt-5 flex items-center gap-1">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full ${i <= step ? "bg-terracotta-600" : "bg-ink-200"}`}
            />
          ))}
          <span className="ml-3 text-xs text-ink-500">
            {step + 1} / {STEPS.length}
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <button
            onClick={complete}
            className="text-sm text-ink-600 hover:text-ink-900 underline-offset-2 hover:underline"
          >
            Skip
          </button>
          <div className="flex items-center gap-2">
            {current.cta.href && (
              <a
                href={current.cta.href}
                onClick={complete}
                className="inline-flex items-center gap-1.5 rounded-lg border border-terracotta-600 px-3 py-2 text-sm font-medium text-terracotta-700 hover:bg-terracotta-50"
              >
                {current.cta.label}
              </a>
            )}
            <button
              onClick={next}
              className="inline-flex items-center gap-1.5 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
            >
              {isLast ? (
                <>
                  Done <Check className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
