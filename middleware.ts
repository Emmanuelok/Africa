import { NextResponse, type NextRequest } from "next/server";

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

const PROTECTED_PREFIXES = ["/dashboard"];

function hasSession(req: NextRequest): boolean {
  for (const name of SESSION_COOKIES) {
    if (req.cookies.get(name)?.value) return true;
  }
  return false;
}

// Stable per-request id. We use crypto.randomUUID where available; the edge
// runtime has it natively in modern Vercel deploys.
function newRequestId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export function middleware(req: NextRequest) {
  // Per-request id: honour an incoming X-Request-Id when present (handy when
  // upstream load balancers / CDNs already assign one), otherwise mint our
  // own. We forward it on the inbound request so server handlers can read it
  // via headers(), and surface it on the response so logs in the user's
  // browser dev-tools can be correlated with server logs.
  const incoming = req.headers.get("x-request-id");
  const requestId = incoming ?? newRequestId();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", requestId);

  const res = NextResponse.next({ request: { headers: requestHeaders } });
  for (const [k, v] of SECURITY_HEADERS) res.headers.set(k, v);
  res.headers.set("X-Request-Id", requestId);

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
