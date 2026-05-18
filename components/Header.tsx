import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";

const nav = [
  { href: "/marketplace", label: "Marketplace" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/commodities", label: "Commodity Prices" },
  { href: "/afcfta", label: "AfCFTA Toolkit" },
  { href: "/logistics", label: "Logistics" },
  { href: "/research", label: "Research" }
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-terracotta-600 text-white">
            <Compass className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Sokoni<span className="text-terracotta-600">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm font-medium text-ink-700 transition-colors hover:text-terracotta-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button href="/dashboard" variant="ghost" size="sm">
            Sign in
          </Button>
          <Button href="/dashboard" size="sm">
            Get started
          </Button>
        </div>
      </div>
    </header>
  );
}
