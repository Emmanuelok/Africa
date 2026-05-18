"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Compass } from "lucide-react";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";

const PRIMARY = [
  { href: "/afriorigin", label: "AfriOrigin", hot: true },
  { href: "/pricing", label: "Pricing" },
  { href: "/developers", label: "Developers" }
];

const SECONDARY = [
  { href: "/commodities", label: "Live Africa Map" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/afcfta", label: "AfCFTA Reference" },
  { href: "/logistics", label: "Logistics" },
  { href: "/research", label: "Research" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="grid h-9 w-9 place-items-center rounded-lg text-ink-700 hover:bg-ink-100 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div
            className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-[88%] max-w-sm flex-col bg-white shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
              <Link href="/" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-terracotta-600 text-white">
                  <Compass className="h-4 w-4" />
                </span>
                <span className="text-lg font-semibold">
                  Sokoni<span className="text-terracotta-600">.</span>
                </span>
              </Link>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="grid h-9 w-9 place-items-center rounded-lg text-ink-700 hover:bg-ink-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 py-6">
              <div className="text-xs uppercase tracking-wider text-ink-500">Product</div>
              <ul className="mt-3 space-y-1">
                {PRIMARY.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-lg px-3 py-2.5 text-base font-medium text-ink-900 hover:bg-sand-50"
                    >
                      {n.label}
                      {n.hot && (
                        <span className="rounded-full bg-terracotta-100 px-2 py-0.5 text-[10px] font-semibold text-terracotta-700">
                          New
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-7 text-xs uppercase tracking-wider text-ink-500">Platform</div>
              <ul className="mt-3 space-y-1">
                {SECONDARY.map((n) => (
                  <li key={n.href}>
                    <Link
                      href={n.href}
                      onClick={() => setOpen(false)}
                      className="block rounded-lg px-3 py-2.5 text-sm text-ink-700 hover:bg-sand-50"
                    >
                      {n.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="border-t border-ink-200 p-5">
              <div className="mb-3">
                <LocaleSwitcher />
              </div>
              <div className="flex gap-2">
                <Link
                  href="/signin"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg border border-ink-300 px-4 py-2.5 text-center text-sm font-medium text-ink-900 hover:bg-ink-50"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-lg bg-terracotta-600 px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-terracotta-700"
                >
                  Start free
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
