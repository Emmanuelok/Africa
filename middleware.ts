import { NextResponse, type NextRequest } from "next/server";

// Auth.js session cookie names (dev + prod variants for both v4 and v5).
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  "next-auth.session-token",
  "__Secure-next-auth.session-token"
];

const SECURITY_HEADERS: Array<[string, string]> = [
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["X-Frame-Options", "SAMEORIGIN"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"]
];

// Dashboard is auth-only when NEXTAUTH_SECRET is configured. Without it,
// the app stays in demo mode (so the marketing site works without a DB),
// matching the rest of the graceful-degradation pattern.
const PROTECTED_PREFIXES = ["/dashboard"];

function hasSession(req: NextRequest): boolean {
  for (const name of SESSION_COOKIES) {
    if (req.cookies.get(name)?.value) return true;
  }
  return false;
}

export function middleware(req: NextRequest) {
  const res = NextResponse.next();
  for (const [k, v] of SECURITY_HEADERS) res.headers.set(k, v);

  if (!process.env.NEXTAUTH_SECRET) return res;

  const path = req.nextUrl.pathname;
  if (!PROTECTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) {
    return res;
  }

  if (!hasSession(req)) {
    const signin = new URL("/signin", req.nextUrl);
    signin.searchParams.set("from", path);
    return NextResponse.redirect(signin);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|icon|opengraph-image|robots|sitemap|api/auth).*)"]
};
