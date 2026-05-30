import { Client, Receiver } from "@upstash/qstash";

// Upstash QStash for background jobs. When not configured the queue helpers
// return false / null and the caller falls back to inline processing —
// matching the rest of the graceful-degradation pattern in this codebase.

let client: Client | null = null;
let receiver: Receiver | null = null;

export function getQstash(): Client | null {
  if (client) return client;
  const token = process.env.QSTASH_TOKEN;
  if (!token) return null;
  client = new Client({ token });
  return client;
}

function getReceiver(): Receiver | null {
  if (receiver) return receiver;
  const currentSigningKey = process.env.QSTASH_CURRENT_SIGNING_KEY;
  const nextSigningKey = process.env.QSTASH_NEXT_SIGNING_KEY;
  if (!currentSigningKey || !nextSigningKey) return null;
  receiver = new Receiver({ currentSigningKey, nextSigningKey });
  return receiver;
}

export function isQstashConfigured(): boolean {
  return !!getQstash();
}

// Verify the Upstash-Signature header on an incoming QStash callback. Returns
// false if the receiver isn't configured (which means the worker should refuse
// to run — never accept unsigned background work).
export async function verifyQstashSignature(req: Request, rawBody: string): Promise<boolean> {
  const r = getReceiver();
  if (!r) return false;
  const signature = req.headers.get("upstash-signature");
  if (!signature) return false;
  try {
    return await r.verify({ signature, body: rawBody });
  } catch {
    return false;
  }
}

// Enqueue a JSON payload to a worker URL. Returns the message id from QStash
// (so the caller can persist it for status polling if they want it) or null
// when the queue isn't configured.
export async function enqueue(opts: {
  url: string;
  body: Record<string, unknown>;
  retries?: number;
  deduplicationId?: string;
}): Promise<string | null> {
  const q = getQstash();
  if (!q) return null;
  const res = await q.publishJSON({
    url: opts.url,
    body: opts.body,
    retries: opts.retries ?? 3,
    deduplicationId: opts.deduplicationId
  });
  return res.messageId ?? null;
}
