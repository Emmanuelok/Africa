import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    // Attach the per-request X-Request-Id (set by middleware.ts) as a Sentry
    // tag so errors can be correlated with the log line that produced them.
    // Also stamps requestId on every breadcrumb.
    beforeSend(event, hint) {
      try {
        const req = (hint?.originalException as { request?: { headers?: Headers } } | undefined)?.request;
        const fromException = req?.headers?.get?.("x-request-id");
        const fromEvent =
          (event.extra as { requestId?: string } | undefined)?.requestId ??
          event.tags?.requestId;
        const requestId = fromException ?? fromEvent;
        if (requestId) {
          event.tags = { ...(event.tags ?? {}), requestId: String(requestId) };
        }
      } catch {}
      return event;
    }
  });
}
