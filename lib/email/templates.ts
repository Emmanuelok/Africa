// Email HTML templates. Inline styles only — most email clients strip <style>.

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://sokoni.africa";

function shell(title: string, body: string) {
  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#fbf8f1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f0f0e;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fbf8f1;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
<tr><td style="padding:24px 32px;border-bottom:1px solid #efece6;">
  <div style="font-size:20px;font-weight:700;color:#0f0f0e;">Sokoni<span style="color:#b8401f">.</span></div>
</td></tr>
<tr><td style="padding:32px;line-height:1.55;font-size:15px;color:#3c3c39;">
${body}
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #efece6;font-size:12px;color:#85857d;">
  Sokoni Holdings Ltd — Africa's trade engine.<br>
  <a href="${SITE}" style="color:#b8401f;text-decoration:none;">sokoni.africa</a> ·
  <a href="${SITE}/privacy" style="color:#b8401f;text-decoration:none;">Privacy</a> ·
  <a href="${SITE}/contact" style="color:#b8401f;text-decoration:none;">Contact</a>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

export function waitlistConfirmationEmail({ email }: { email: string }) {
  const body = `
    <h1 style="font-size:22px;color:#0f0f0e;margin:0 0 12px;">You're on the list.</h1>
    <p>Thanks for joining the AfriOrigin waitlist. We onboard new cohorts every two weeks — we'll email you when your slot opens up.</p>
    <p><strong>What you've reserved:</strong></p>
    <ul style="padding-left:20px;margin:8px 0;">
      <li>3 months free on the Pro tier when billing opens</li>
      <li>Founding-cohort pricing locked for life</li>
      <li>Early access to the AfCFTA compliance wizard</li>
    </ul>
    <p style="margin:24px 0;">
      <a href="${SITE}/afriorigin" style="display:inline-block;background:#b8401f;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:500;">
        Try the wizard now →
      </a>
    </p>
    <p style="font-size:13px;color:#85857d;">If you didn't sign up with ${email}, you can safely ignore this email.</p>
  `;
  return {
    subject: "You're on the Sokoni waitlist",
    html: shell("Welcome to Sokoni", body),
    text: `You're on the Sokoni AfriOrigin waitlist. We onboard new cohorts every two weeks — we'll email you when your slot opens. Reserve: 3 months free on Pro, founding-cohort pricing locked for life. ${SITE}`
  };
}

export function magicLinkEmail({ url, host }: { url: string; host: string }) {
  const body = `
    <h1 style="font-size:22px;color:#0f0f0e;margin:0 0 12px;">Sign in to ${host}</h1>
    <p>Click the button below to sign in. The link expires in 24 hours.</p>
    <p style="margin:24px 0;">
      <a href="${url}" style="display:inline-block;background:#b8401f;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">Sign in to Sokoni</a>
    </p>
    <p style="font-size:13px;color:#85857d;word-break:break-all;">Or copy this link: <br>${url}</p>
    <p style="font-size:13px;color:#85857d;margin-top:24px;">If you didn't request this, you can safely ignore this email — your account stays locked.</p>
  `;
  return {
    subject: `Sign in to Sokoni`,
    html: shell("Sign in", body),
    text: `Sign in to Sokoni: ${url} (expires in 24 hours)`
  };
}

export function teamInviteEmail({
  inviterName,
  workspaceName,
  acceptUrl
}: {
  inviterName: string;
  workspaceName: string;
  acceptUrl: string;
}) {
  const body = `
    <h1 style="font-size:22px;color:#0f0f0e;margin:0 0 12px;">You're invited to ${workspaceName}</h1>
    <p><strong>${inviterName}</strong> invited you to join the <strong>${workspaceName}</strong> workspace on Sokoni.</p>
    <p>Sokoni is the open trade platform for the African Continental Free Trade Area — AfCFTA compliance, Certificates of Origin, and tariff savings in one place.</p>
    <p style="margin:24px 0;">
      <a href="${acceptUrl}" style="display:inline-block;background:#b8401f;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:500;">Accept invitation</a>
    </p>
    <p style="font-size:13px;color:#85857d;word-break:break-all;">Or open this link: <br>${acceptUrl}</p>
    <p style="font-size:13px;color:#85857d;margin-top:24px;">This invitation expires in 7 days. If you weren't expecting it, ignore this email.</p>
  `;
  return {
    subject: `${inviterName} invited you to ${workspaceName} on Sokoni`,
    html: shell("You're invited", body),
    text: `${inviterName} invited you to join ${workspaceName} on Sokoni. Accept at: ${acceptUrl} (expires in 7 days)`
  };
}

export function certificateIssuedEmail({
  reference,
  hsCode,
  originCountry,
  destinationCountry,
  pdfUrl
}: {
  reference: string;
  hsCode: string;
  originCountry: string;
  destinationCountry: string;
  pdfUrl?: string;
}) {
  const body = `
    <h1 style="font-size:22px;color:#0f0f0e;margin:0 0 12px;">Your Certificate of Origin is ready</h1>
    <p>Reference: <strong style="font-family:ui-monospace,Menlo,monospace;">${reference}</strong></p>
    <table cellpadding="6" cellspacing="0" style="margin:16px 0;border-collapse:collapse;font-size:14px;">
      <tr><td style="color:#85857d;">HS Code:</td><td><strong>${hsCode}</strong></td></tr>
      <tr><td style="color:#85857d;">Origin:</td><td><strong>${originCountry}</strong></td></tr>
      <tr><td style="color:#85857d;">Destination:</td><td><strong>${destinationCountry}</strong></td></tr>
    </table>
    ${pdfUrl ? `
    <p style="margin:24px 0;">
      <a href="${pdfUrl}" style="display:inline-block;background:#b8401f;color:#ffffff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:500;">Download PDF →</a>
    </p>` : ""}
    <p style="font-size:13px;color:#85857d;">The certificate is in AfCFTA Annex II Appendix I format and accepted electronically across all 54 State Parties under the 2025 Digital Trade Protocol.</p>
  `;
  return {
    subject: `Certificate of Origin ${reference} is ready`,
    html: shell("Certificate ready", body),
    text: `Your AfCFTA Certificate of Origin ${reference} (HS ${hsCode}, ${originCountry} → ${destinationCountry}) is ready. ${pdfUrl ?? ""}`
  };
}
