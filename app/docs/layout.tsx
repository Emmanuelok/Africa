import Link from "next/link";
import type { ReactNode } from "react";

const NAV: Array<{ title: string; items: Array<{ href: string; label: string }> }> = [
  {
    title: "Get started",
    items: [
      { href: "/docs", label: "Introduction" },
      { href: "/docs/getting-started", label: "Quickstart" },
      { href: "/docs/concepts/afcfta", label: "What is AfCFTA?" },
      { href: "/docs/concepts/rules-of-origin", label: "Rules of Origin" },
      { href: "/docs/concepts/papss", label: "PAPSS settlement" }
    ]
  },
  {
    title: "AfriOrigin",
    items: [
      { href: "/docs/afriorigin/classify", label: "HS classification" },
      { href: "/docs/afriorigin/origin-determination", label: "Origin determination" },
      { href: "/docs/afriorigin/certificates", label: "Certificates of Origin" },
      { href: "/docs/afriorigin/languages", label: "Languages" }
    ]
  },
  {
    title: "API",
    items: [
      { href: "/docs/api", label: "Overview" },
      { href: "/docs/api/authentication", label: "Authentication" },
      { href: "/docs/api/webhooks", label: "Webhooks" },
      { href: "/docs/api/errors", label: "Errors & rate limits" }
    ]
  }
];

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="grid gap-10 py-10 md:grid-cols-[220px_1fr] md:py-14 lg:gap-14">
          <aside className="md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto">
            <div className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              Documentation
            </div>
            <nav className="mt-3 space-y-6">
              {NAV.map((group) => (
                <div key={group.title}>
                  <div className="text-xs font-semibold uppercase tracking-wider text-ink-400">
                    {group.title}
                  </div>
                  <ul className="mt-2 space-y-0.5">
                    {group.items.map((i) => (
                      <li key={i.href}>
                        <Link
                          href={i.href}
                          className="block rounded-md px-2 py-1.5 text-sm text-ink-700 hover:bg-sand-50 hover:text-terracotta-700"
                        >
                          {i.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </aside>

          <article className="docs min-w-0 max-w-3xl">
            {children}
          </article>
        </div>
      </div>
      <style>{`
        .docs h1 { font-family: var(--font-display), Georgia, serif; font-size: 2.25rem; font-weight: 600; color: rgb(15 15 14); }
        .docs h2 { font-family: var(--font-display), Georgia, serif; font-size: 1.5rem; font-weight: 600; color: rgb(15 15 14); margin-top: 2.25rem; }
        .docs h3 { font-size: 1.125rem; font-weight: 600; color: rgb(15 15 14); margin-top: 1.5rem; }
        .docs p, .docs li { color: rgb(68 68 64); line-height: 1.65; }
        .docs p, .docs ul, .docs ol, .docs pre, .docs table, .docs blockquote { margin-top: 1rem; }
        .docs ul, .docs ol { padding-left: 1.25rem; }
        .docs ul { list-style: disc; }
        .docs ol { list-style: decimal; }
        .docs li + li { margin-top: 0.25rem; }
        .docs a { color: rgb(146 48 28); text-decoration: underline; text-underline-offset: 2px; }
        .docs code { font-family: ui-monospace, SF Mono, Menlo, monospace; font-size: 0.875em; background: rgb(245 247 238); padding: 0.1em 0.35em; border-radius: 4px; }
        .docs pre { background: rgb(15 15 14); color: rgb(231 231 229); padding: 1rem 1.25rem; border-radius: 12px; overflow-x: auto; font-size: 0.85rem; }
        .docs pre code { background: transparent; color: inherit; padding: 0; }
        .docs blockquote { border-left: 3px solid rgb(212 85 42); padding-left: 1rem; color: rgb(85 85 80); font-style: italic; }
        .docs table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .docs th, .docs td { border-bottom: 1px solid rgb(231 231 229); padding: 0.5rem 0.75rem; text-align: left; }
        .docs th { background: rgb(245 247 238); font-weight: 600; }
        .docs strong { color: rgb(15 15 14); }
      `}</style>
    </div>
  );
}
