"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Check, AlertCircle, Palette, Lock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function BrandingForm({
  plan,
  initial
}: {
  plan: string;
  initial: {
    brandName: string;
    brandLogoUrl: string;
    brandPrimaryColor: string;
    brandFooterNote: string;
  };
}) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "err">("idle");
  const [error, setError] = useState("");

  const locked = plan !== "forwarder";

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok && res.status !== 503) throw new Error(data?.error ?? "Save failed");
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (err) {
      setStatus("err");
      setError(err instanceof Error ? err.message : "Save failed");
    }
  }

  if (locked) {
    return (
      <Card className="border-dashed">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink-100 text-ink-500">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="font-semibold">White-label branding</div>
              <Badge tone="neutral">Forwarder tier</Badge>
            </div>
            <p className="mt-1 text-sm text-ink-700">
              White-label PDF certificates, custom colors, and your logo on every export.
              Available on the Forwarder plan.
            </p>
            <a
              href="/pricing"
              className="mt-3 inline-block text-sm font-medium text-terracotta-700 hover:underline"
            >
              Upgrade to Forwarder →
            </a>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <Card>
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-terracotta-600" />
          <h2 className="font-semibold">PDF branding</h2>
        </div>
        <p className="mt-1 text-sm text-ink-600">
          Customise how Certificate PDFs render for your clients. Changes apply to certificates
          issued from now on.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-ink-500">Brand name</span>
            <input
              value={form.brandName}
              onChange={(e) => setForm((f) => ({ ...f, brandName: e.target.value }))}
              placeholder="e.g. Continental Customs Partners"
              className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
            />
          </label>
          <label className="block">
            <span className="text-xs uppercase tracking-wide text-ink-500">Primary colour</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={form.brandPrimaryColor || "#b8401f"}
                onChange={(e) => setForm((f) => ({ ...f, brandPrimaryColor: e.target.value }))}
                className="h-10 w-12 cursor-pointer rounded-lg border border-ink-200 bg-white"
              />
              <input
                value={form.brandPrimaryColor}
                onChange={(e) => setForm((f) => ({ ...f, brandPrimaryColor: e.target.value }))}
                placeholder="#b8401f"
                className="w-32 rounded-lg border border-ink-200 bg-white px-3 py-2 font-mono text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
              />
            </div>
          </label>
        </div>

        <label className="mt-3 block">
          <span className="text-xs uppercase tracking-wide text-ink-500">Logo URL (https)</span>
          <input
            value={form.brandLogoUrl}
            onChange={(e) => setForm((f) => ({ ...f, brandLogoUrl: e.target.value }))}
            placeholder="https://your-domain.africa/logo.png"
            className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          />
          <span className="mt-1 block text-xs text-ink-500">PNG or JPG, recommended 288×96px transparent.</span>
        </label>

        <label className="mt-3 block">
          <span className="text-xs uppercase tracking-wide text-ink-500">Footer note</span>
          <input
            value={form.brandFooterNote}
            onChange={(e) => setForm((f) => ({ ...f, brandFooterNote: e.target.value }))}
            placeholder="Continental Customs Partners · Lic. 12345"
            maxLength={200}
            className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20"
          />
        </label>
      </Card>

      {/* Live preview */}
      <Card>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">Preview</h3>
        <div
          className="mt-3 rounded-xl border-2 bg-white p-5"
          style={{ borderColor: form.brandPrimaryColor || "#b8401f" }}
        >
          <div className="flex items-start justify-between">
            <div>
              {form.brandLogoUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={form.brandLogoUrl} alt="" className="h-8" />
              ) : (
                <div className="text-xl font-bold">
                  {form.brandName || "Your Brand"}
                  <span style={{ color: form.brandPrimaryColor || "#b8401f" }}>.</span>
                </div>
              )}
              <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink-500">
                AfCFTA Certificate of Origin
              </div>
            </div>
            <div className="text-right">
              <div
                className="font-mono text-sm font-semibold"
                style={{ color: form.brandPrimaryColor || "#b8401f" }}
              >
                AFCFTA-SAMPLE01
              </div>
              <div className="text-xs text-ink-500">Issued 18 May 2026</div>
            </div>
          </div>
          <div className="mt-4 text-xs text-ink-500">
            {form.brandName ? `${form.brandName} · ` : ""}Ref AFCFTA-SAMPLE01
            {form.brandFooterNote ? ` · ${form.brandFooterNote}` : ""}
          </div>
        </div>
      </Card>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={status === "saving"}
          className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
        >
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save branding
        </button>
        {status === "saved" && (
          <span className="inline-flex items-center gap-1 text-sm text-savanna-700">
            <Check className="h-4 w-4" /> Saved
          </span>
        )}
        {status === "err" && (
          <span className="inline-flex items-center gap-1 text-sm text-terracotta-700">
            <AlertCircle className="h-4 w-4" /> {error}
          </span>
        )}
      </div>
    </form>
  );
}
