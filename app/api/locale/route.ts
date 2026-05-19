import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { LOCALE_COOKIE } from "@/lib/i18n/cookie";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const locale = String(body?.locale ?? "") as Locale;
  if (!LOCALES.some((l) => l.code === locale)) {
    return NextResponse.json({ error: "unsupported locale" }, { status: 400 });
  }
  cookies().set(LOCALE_COOKIE, locale, {
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return NextResponse.json({ ok: true, locale });
}
