import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Badge } from "@/components/ui/Badge";
import { MobileMenu } from "@/components/MobileMenu";
import { SearchDialog } from "@/components/SearchDialog";
import { getServerLocale } from "@/lib/i18n/cookie";
import { t } from "@/lib/i18n/locales";

export function Header() {
  const locale = getServerLocale();

  const primary = [
    { href: "/afriorigin", label: t(locale, "nav.afriorigin"), hot: true },
    { href: "/pricing", label: t(locale, "nav.pricing") },
    { href: "/developers", label: t(locale, "nav.developers") }
  ];

  const secondary = [
    { href: "/commodities", label: t(locale, "nav.map") },
    { href: "/docs", label: t(locale, "nav.docs") },
    { href: "/afcfta", label: t(locale, "nav.afcfta") },
    { href: "/research", label: t(locale, "nav.research") }
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-ink-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-terracotta-600 text-white">
            <Compass className="h-5 w-5" />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Sokoni<span className="text-terracotta-600">.</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-5 lg:flex">
          {primary.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="flex items-center gap-1.5 text-sm font-medium text-ink-800 transition-colors hover:text-terracotta-700"
            >
              {n.label}
              {n.hot && <Badge tone="terracotta" className="text-[10px]">New</Badge>}
            </Link>
          ))}
          <span className="h-4 w-px bg-ink-200" />
          {secondary.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm text-ink-600 transition-colors hover:text-terracotta-700"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <SearchDialog />
          <div className="hidden sm:block">
            <LocaleSwitcher current={locale} />
          </div>
          <Button href="/signin" variant="ghost" size="sm" className="hidden lg:inline-flex">
            {t(locale, "nav.signin")}
          </Button>
          <Button href="/register" size="sm" className="hidden sm:inline-flex">
            {t(locale, "nav.start_free")}
          </Button>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
