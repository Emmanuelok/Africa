import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "flagcdn.com" }
    ]
  }
};

// Sentry is wrapped only when a DSN is configured. Without it, withSentryConfig
// still works but adds no overhead; we keep it on so source maps upload
// automatically on Vercel when SENTRY_AUTH_TOKEN is set.
const sentryWebpackOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN
};

const sentryOptions = {
  hideSourceMaps: true,
  disableLogger: true,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring"
};

export default process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryWebpackOptions, sentryOptions)
  : nextConfig;
