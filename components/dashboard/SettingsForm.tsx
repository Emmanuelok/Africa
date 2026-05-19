"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { LOCALES } from "@/lib/i18n/locales";

export function SettingsForm({
  initial
}: {
  initial: {
    workspaceName: string;
    defaultOriginCountry: string;
    defaultLocale: string;
  };
}) {
  const [form, setForm] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "err">("idle");
  const [error, setError] = useState("");

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("saving");
    setError("");
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.workspaceName,
          defaultOriginCountry: form.defaultOriginCountry,
          defaultLocale: form.defaultLocale
        })
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

  return (
    <form onSubmit={save} className="space-y-3">
      <Field
        label="Workspace name"
        value={form.workspaceName}
        onChange={(v) => setForm((f) => ({ ...f, workspaceName: v }))}
      />
      <Field
        label="Default origin country (ISO-2)"
        value={form.defaultOriginCountry}
        onChange={(v) => setForm((f) => ({ ...f, defaultOriginCountry: v.toUpperCase().slice(0, 2) }))}
        placeholder="KE"
        mono
      />
      <div>
        <label className="text-xs uppercase tracking-wide text-ink-500">Default language</label>
        <select
          value={form.defaultLocale}
          onChange={(e) => setForm((f) => ({ ...f, defaultLocale: e.target.value }))}
          className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm"
        >
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code}>
              {l.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={status === "saving"}
          className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700 disabled:opacity-60"
        >
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save changes
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

function Field({
  label,
  value,
  onChange,
  placeholder,
  mono
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wide text-ink-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`mt-1 w-full rounded-lg border border-ink-200 bg-white px-3 py-2 text-sm focus:border-terracotta-500 focus:outline-none focus:ring-2 focus:ring-terracotta-500/20 ${mono ? "font-mono" : ""}`}
      />
    </label>
  );
}
