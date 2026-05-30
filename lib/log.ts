import pino from "pino";

// Single shared logger. JSON in production (Vercel ships these to log drains
// untouched), pretty-printed in dev. Redaction strips known credential
// patterns before they hit the log stream.
const isDev = process.env.NODE_ENV !== "production";

export const log = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  base: {
    env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local",
    region: process.env.VERCEL_REGION ?? null,
    rev: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev"
  },
  redact: {
    paths: [
      "*.password",
      "*.passwordHash",
      "*.password_hash",
      "*.secret",
      "*.token",
      "*.apiKey",
      "*.hashedKey",
      "*.captchaToken",
      "authorization",
      "headers.authorization",
      "headers.cookie",
      "req.headers.authorization",
      "req.headers.cookie"
    ],
    censor: "[redacted]"
  },
  transport: isDev
    ? {
        target: "pino-pretty",
        options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" }
      }
    : undefined
});

// Per-request child logger. Pulls the X-Request-Id header (set by middleware)
// so every line for a given request shares an id. workspaceId/userId added
// on top by callers that have a session.
export function logFor(req: Request, extra: Record<string, unknown> = {}) {
  const headers = req.headers;
  return log.child({
    requestId: headers.get("x-request-id") ?? undefined,
    method: req.method,
    path: new URL(req.url).pathname,
    ...extra
  });
}

// Convenience for cron / background jobs (no Request).
export function logFor_(extra: Record<string, unknown>) {
  return log.child(extra);
}
