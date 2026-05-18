import type { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";

export function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  children
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-20">
        <Badge tone="neutral">{eyebrow}</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-ink-500">Last updated: {lastUpdated}</p>
        <article className="legal mt-10 space-y-5 text-sm leading-relaxed text-ink-800">
          {children}
        </article>
      </div>
      <style>{`
        .legal h2 { font-size: 1.125rem; font-weight: 600; color: rgb(15 15 14); margin-top: 1.75rem; }
        .legal h3 { font-size: 1rem; font-weight: 600; color: rgb(15 15 14); margin-top: 1.25rem; }
        .legal p, .legal li { color: rgb(68 68 64); }
        .legal ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
        .legal li + li { margin-top: 0.25rem; }
        .legal a { color: rgb(146 48 28); text-decoration: underline; text-underline-offset: 2px; }
        .legal strong { color: rgb(15 15 14); }
      `}</style>
    </div>
  );
}
