import Anthropic from "@anthropic-ai/sdk";

// Server-only. Returns null when no API key is configured so callers can
// gracefully fall back to deterministic logic.

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey, maxRetries: 2, timeout: 30_000 });
  return client;
}

// Pin to a dated snapshot for cost + behaviour predictability. Override with
// ANTHROPIC_MODEL in the environment when bumping to a newer snapshot, so we
// can roll forward without a code deploy.
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
