import { NextResponse, type NextRequest } from "next/server";

// Lightweight middleware. Adds security headers; keeps /dashboard publicly
// reachable for the demo. When real auth ships, gate /dashboard here using a
// session cookie check (NOT the full Auth.js import, which pulls jose +
// CompressionStream into the edge bundle).

const SECURITY_HEADERS: Array<[string, string]> = [
  ["X-Content-Type-Options", "nosniff"],
  ["Referrer-Policy", "strict-origin-when-cross-origin"],
  ["X-Frame-Options", "SAMEORIGIN"],
  ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"]
];

export function middleware(_req: NextRequest) {
  const res = NextResponse.next();
  for (const [k, v] of SECURITY_HEADERS) res.headers.set(k, v);
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|icon|opengraph-image|robots|sitemap|api/auth).*)"]
};
