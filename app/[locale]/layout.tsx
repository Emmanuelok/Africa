import { LOCALES, isRtl, type Locale } from "@/lib/i18n/locales";
import { notFound } from "next/navigation";

// Per-locale layout: applies RTL to Arabic by wrapping content in a dir-aware
// container. We can't change the <html> dir from a nested layout in Next 14
// app router, but applying dir on this wrapper cascades correctly to children
// and lets CSS logical properties pick the right direction.

export function generateStaticParams() {
  return LOCALES.filter((l) => l.code !== "en").map((l) => ({ locale: l.code }));
}

export default function LocaleLayout({
  params,
  children
}: {
  params: { locale: string };
  children: React.ReactNode;
}) {
  const locale = LOCALES.find((l) => l.code === params.locale);
  if (!locale) return notFound();
  const rtl = isRtl(locale.code as Locale);

  return (
    <div dir={rtl ? "rtl" : "ltr"} lang={locale.code} className={rtl ? "[&_*]:tracking-normal" : ""}>
      {children}
    </div>
  );
}
