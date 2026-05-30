import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.5,
    environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
    // Tag every browser event with the last X-Request-Id we observed on a
    // fetch response. Lets a frontend error be correlated with the server
    // log line for the request that produced the bad state.
    beforeSend(event) {
      try {
        const id = (window as unknown as { __sokoniRequestId?: string }).__sokoniRequestId;
        if (id) event.tags = { ...(event.tags ?? {}), requestId: id };
      } catch {}
      return event;
    }
  });

  // Capture X-Request-Id off every successful fetch so it's attached to any
  // subsequent error report. Cheap, opt-out via no DSN.
  if (typeof window !== "undefined" && typeof window.fetch === "function") {
    const orig = window.fetch.bind(window);
    window.fetch = async (...args) => {
      const res = await orig(...args);
      const rid = res.headers.get("x-request-id");
      if (rid) {
        (window as unknown as { __sokoniRequestId?: string }).__sokoniRequestId = rid;
      }
      return res;
    };
  }
}
