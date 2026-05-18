import Anthropic from "@anthropic-ai/sdk";

// Server-only. Returns null when no API key is configured so callers can
// gracefully fall back to deterministic logic.

let client: Anthropic | null = null;

export function getAnthropic(): Anthropic | null {
  if (client) return client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  client = new Anthropic({ apiKey });
  return client;
}

export const ANTHROPIC_MODEL = "claude-sonnet-4-6";
