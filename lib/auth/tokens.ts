import { randomBytes, createHash } from "crypto";
import { and, eq, gt } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

// Single-use tokens for password reset + email verification.
// Stored as SHA-256 of the plaintext so a DB leak can't be replayed.
// The plaintext is only ever in the email link.

export type TokenPurpose = "email-verify" | "password-reset";

export function generateToken(): string {
  return randomBytes(32).toString("base64url"); // 43 chars
}

function hash(t: string): string {
  return createHash("sha256").update(t).digest("hex");
}

function identifierFor(purpose: TokenPurpose, email: string): string {
  return `${purpose}:${email.toLowerCase()}`;
}

const DEFAULT_TTL_SECONDS: Record<TokenPurpose, number> = {
  "email-verify": 60 * 60 * 24, // 24h
  "password-reset": 60 * 60      // 1h
};

export async function issueToken(purpose: TokenPurpose, email: string): Promise<string | null> {
  const db = getDb();
  if (!db) return null;
  const plaintext = generateToken();
  const identifier = identifierFor(purpose, email);
  const expires = new Date(Date.now() + DEFAULT_TTL_SECONDS[purpose] * 1000);

  // Best-effort: drop any pre-existing tokens for the same identifier so a
  // new reset link supersedes the old one.
  await db.delete(schema.verificationTokens).where(eq(schema.verificationTokens.identifier, identifier)).catch(() => {});
  await db.insert(schema.verificationTokens).values({
    identifier,
    token: hash(plaintext),
    expires
  });
  return plaintext;
}

export async function consumeToken(purpose: TokenPurpose, email: string, plaintext: string): Promise<boolean> {
  const db = getDb();
  if (!db) return false;
  const identifier = identifierFor(purpose, email);
  const hashed = hash(plaintext);

  const rows = await db
    .select()
    .from(schema.verificationTokens)
    .where(and(
      eq(schema.verificationTokens.identifier, identifier),
      eq(schema.verificationTokens.token, hashed),
      gt(schema.verificationTokens.expires, new Date())
    ))
    .limit(1);

  if (rows.length === 0) return false;

  // Single-use — delete on consume.
  await db
    .delete(schema.verificationTokens)
    .where(and(
      eq(schema.verificationTokens.identifier, identifier),
      eq(schema.verificationTokens.token, hashed)
    ));
  return true;
}
