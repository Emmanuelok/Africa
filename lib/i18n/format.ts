import type { Locale } from "./locales";

const INTL_LOCALES: Record<Locale, string> = {
  en: "en-GB",
  fr: "fr-FR",
  pt: "pt-PT",
  ar: "ar",
  sw: "sw-KE"
};

export function formatCurrency(amount: number, locale: Locale = "en", currency = "USD"): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale], {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(amount);
}

export function formatNumber(value: number, locale: Locale = "en"): string {
  return new Intl.NumberFormat(INTL_LOCALES[locale]).format(value);
}

export function formatDate(iso: string | Date, locale: Locale = "en"): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  return new Intl.DateTimeFormat(INTL_LOCALES[locale], {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(d);
}

export function formatRelativeTime(iso: string | Date, locale: Locale = "en"): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const diff = (d.getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(INTL_LOCALES[locale], { numeric: "auto" });
  const abs = Math.abs(diff);
  if (abs < 60) return rtf.format(Math.round(diff), "second");
  if (abs < 3600) return rtf.format(Math.round(diff / 60), "minute");
  if (abs < 86400) return rtf.format(Math.round(diff / 3600), "hour");
  if (abs < 2592000) return rtf.format(Math.round(diff / 86400), "day");
  if (abs < 31536000) return rtf.format(Math.round(diff / 2592000), "month");
  return rtf.format(Math.round(diff / 31536000), "year");
}
