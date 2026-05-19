import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "./locales";

export const LOCALE_COOKIE = "sokoni_locale";

export function getServerLocale(): Locale {
  const c = cookies().get(LOCALE_COOKIE);
  const val = c?.value as Locale | undefined;
  if (val && LOCALES.some((l) => l.code === val)) return val;
  return DEFAULT_LOCALE;
}
