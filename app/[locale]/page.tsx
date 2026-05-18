import Link from "next/link";
import { ArrowRight, Languages, Sparkles } from "lucide-react";
import { LOCALES, t, type Locale } from "@/lib/i18n/locales";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";

export function generateStaticParams() {
  return LOCALES.filter((l) => l.code !== "en").map((l) => ({ locale: l.code }));
}

export default function LocalizedHome({ params }: { params: { locale: string } }) {
  const locale = LOCALES.find((l) => l.code === params.locale);
  if (!locale) return notFound();
  const code = locale.code as Locale;
  const rtl = locale.rtl;

  return (
    <div className="bg-hero-gradient" dir={rtl ? "rtl" : "ltr"}>
      <div className="mx-auto max-w-7xl px-4 py-20 md:px-6 md:py-28">
        <Badge tone="terracotta" className="mb-5">
          <Sparkles className="h-3 w-3" /> {t(code, "hero.eyebrow")}
        </Badge>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-900 md:text-6xl">
          {t(code, "hero.title.a")}{" "}
          <span className="text-gradient">{t(code, "hero.title.b")}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-ink-700">{t(code, "hero.body")}</p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/afriorigin"
            className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-6 py-3 font-medium text-white hover:bg-terracotta-700"
          >
            {t(code, "hero.cta.primary")} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 rounded-lg border border-ink-300 bg-white px-6 py-3 font-medium text-ink-900 hover:bg-ink-50"
          >
            {t(code, "hero.cta.secondary")}
          </Link>
        </div>

        <div className="mt-12 rounded-2xl border border-ink-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <Languages className="h-5 w-5 text-ink-500" />
            <div>
              <div className="font-semibold">{t(code, "translation.notice")}</div>
              <p className="mt-1 text-sm text-ink-600">
                The full Sokoni platform is being progressively translated across English, French,
                Portuguese, Arabic, and Swahili. Deeper pages currently default to English while
                translations land. Switch language anytime from the header.
              </p>
              <Link
                href="/"
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-terracotta-700 hover:underline"
              >
                Continue in English <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
