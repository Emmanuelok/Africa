import { Resend } from "resend";
import { inArray } from "drizzle-orm";
import { getDb, schema } from "@/lib/db/client";

let client: Resend | null = null;

export function getResend(): Resend | null {
  if (client) return client;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  client = new Resend(key);
  return client;
}

export const FROM = process.env.EMAIL_FROM || "Sokoni <hello@sokoni.africa>";

type SendArgs = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
};

// Filter out addresses that have hard-bounced or complained. We never silently
// retry these — the Resend webhook drops them into `suppressed_emails` and we
// honor the suppression until the address is manually removed.
async function filterSuppressed(addrs: string[]): Promise<string[]> {
  const db = getDb();
  if (!db || addrs.length === 0) return addrs;
  try {
    const rows = await db
      .select({ email: schema.suppressedEmails.email })
      .from(schema.suppressedEmails)
      .where(inArray(schema.suppressedEmails.email, addrs.map((a) => a.toLowerCase())));
    const suppressed = new Set(rows.map((r) => r.email));
    return addrs.filter((a) => !suppressed.has(a.toLowerCase()));
  } catch {
    // Don't block sending if the table doesn't exist yet (migrations pending)
    return addrs;
  }
}

// Sends if Resend is configured, otherwise logs and returns false. Callers
// should not treat "no email sent" as an error during local/demo development.
export async function sendEmail(args: SendArgs): Promise<boolean> {
  const recipients = Array.isArray(args.to) ? args.to : [args.to];
  const allowed = await filterSuppressed(recipients);
  if (allowed.length === 0) {
    console.log("[email:suppressed]", { to: args.to, subject: args.subject });
    return false;
  }

  const resend = getResend();
  if (!resend) {
    console.log("[email:noop]", { to: allowed, subject: args.subject });
    return false;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: allowed.length === 1 ? allowed[0] : allowed,
      subject: args.subject,
      html: args.html,
      text: args.text,
      replyTo: args.replyTo
    });
    return true;
  } catch (err) {
    console.error("[email:error]", err);
    return false;
  }
}
