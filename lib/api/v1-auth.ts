import { eq, and, isNull } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";
import { extractKey, sha256, safeHashEqual } from "@/lib/api/keys";
import { log } from "@/lib/log";

export const API_SCOPES = ["classify", "determine-origin", "tariff", "certificates", "shipments"] as const;
export type ApiScope = (typeof API_SCOPES)[number];

export type ApiAuthResult =
  | { ok: true; keyId: string; workspaceId: string; env: "live" | "test"; scopes: string[] }
  | { ok: false; status: number; error: string };

// Validates an `Authorization: Bearer sk_...` header against api_keys.
// Returns the key + workspace on success; a 4xx response shape on failure.
// In DB-less demo mode, returns a synthetic OK with wildcard scope so docs
// examples work.
//
// When `requiredScope` is supplied, the call also enforces that the key's
// scopes include either "*" or the named scope.
export async function authenticateApiKey(
  req: Request,
  requiredScope?: ApiScope
): Promise<ApiAuthResult> {
  const plaintext = extractKey(req);
  if (!plaintext) {
    return { ok: false, status: 401, error: "Missing or malformed Authorization header. Expected: Bearer sk_live_..." };
  }

  const db = getDb();

  // Demo mode: accept any well-formed key, attribute to a synthetic workspace.
  if (!db) {
    return {
      ok: true,
      keyId: "demo-key",
      workspaceId: "demo-workspace",
      env: plaintext.startsWith("sk_live_") ? "live" : "test",
      scopes: ["*"]
    };
  }

  const hash = sha256(plaintext);
  const rows = await db
    .select()
    .from(schema.apiKeys)
    .where(and(eq(schema.apiKeys.hashedKey, hash), isNull(schema.apiKeys.revokedAt)))
    .limit(1);

  const key = rows[0];
  if (!key) {
    return { ok: false, status: 401, error: "Invalid API key. Generate one at /dashboard/api-keys." };
  }
  if (!safeHashEqual(key.hashedKey, hash)) {
    return { ok: false, status: 401, error: "Invalid API key." };
  }

  const scopes = (key.scopes as string[]) ?? ["*"];
  if (requiredScope && !scopes.includes("*") && !scopes.includes(requiredScope)) {
    return {
      ok: false,
      status: 403,
      error: `API key missing required scope "${requiredScope}". Recreate the key at /dashboard/api-keys with broader scopes.`
    };
  }

  // Update lastUsedAt async (no need to block the request).
  void db
    .update(schema.apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(schema.apiKeys.id, key.id))
    .catch(() => {});

  return {
    ok: true,
    keyId: key.id,
    workspaceId: key.workspaceId,
    env: key.prefix === "sk_live_" ? "live" : "test",
    scopes
  };
}

// Records a usage row for billing/metrics. Fires after the response is computed
// so the client never waits on it.
export function recordUsage(opts: {
  apiKeyId: string;
  endpoint: string;
  statusCode: number;
  durationMs: number;
}) {
  const db = getDb();
  if (!db) return;
  if (opts.apiKeyId === "demo-key") return;
  void db
    .insert(schema.apiUsage)
    .values({
      apiKeyId: opts.apiKeyId,
      endpoint: opts.endpoint,
      statusCode: opts.statusCode,
      durationMs: opts.durationMs
    })
    .catch((err) => log.warn({ err, apiKeyId: opts.apiKeyId, endpoint: opts.endpoint }, "api usage insert failed"));
}
