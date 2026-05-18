import { Resend } from "resend";

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

// Sends if Resend is configured, otherwise logs and returns false. Callers
// should not treat "no email sent" as an error during local/demo development.
export async function sendEmail(args: SendArgs): Promise<boolean> {
  const resend = getResend();
  if (!resend) {
    console.log("[email:noop]", { to: args.to, subject: args.subject });
    return false;
  }
  try {
    await resend.emails.send({
      from: FROM,
      to: args.to,
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
