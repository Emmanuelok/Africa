import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Privacy Policy — Sokoni" };

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Privacy Policy" lastUpdated="18 May 2026">
      <p>
        This Privacy Policy describes how Sokoni Holdings Ltd (&ldquo;Sokoni&rdquo;, &ldquo;we&rdquo;)
        collects, uses, and protects personal data when you use our platform. We comply with the EU
        General Data Protection Regulation (GDPR), Kenya&apos;s Data Protection Act (2019),
        Nigeria&apos;s NDPA (2023), and South Africa&apos;s POPIA — whichever provides the strongest
        protection in your jurisdiction.
      </p>

      <h2>1. Who we are</h2>
      <p>
        Sokoni Holdings Ltd is the data controller for personal data collected through the platform.
        Our data protection officer can be reached at{" "}
        <a href="mailto:dpo@sokoni.africa">dpo@sokoni.africa</a>.
      </p>

      <h2>2. Data we collect</h2>
      <ul>
        <li><strong>Account data</strong>: name, email, company name, country, role, password hash.</li>
        <li><strong>KYB data</strong>: business registration number, director details, beneficial owner identity (for paid tiers only).</li>
        <li><strong>Trade data</strong>: product descriptions, shipment values, origin and destination countries, generated certificates.</li>
        <li><strong>Billing data</strong>: handled by our payment processors (Stripe, Paystack, Flutterwave). We never store full card numbers.</li>
        <li><strong>Usage data</strong>: IP address (truncated), browser, pages visited, performance metrics.</li>
      </ul>

      <h2>3. How we use your data</h2>
      <ul>
        <li>To provide and improve the service.</li>
        <li>To generate AfCFTA compliance documents on your instruction.</li>
        <li>To bill you and prevent fraud.</li>
        <li>To send service notices and (with consent) product updates.</li>
        <li>To comply with legal obligations, including anti-money-laundering rules.</li>
      </ul>

      <h2>4. Legal basis (GDPR)</h2>
      <ul>
        <li><strong>Contract</strong>: to deliver the service you signed up for.</li>
        <li><strong>Legitimate interest</strong>: security, fraud prevention, product analytics.</li>
        <li><strong>Consent</strong>: marketing emails, optional integrations.</li>
        <li><strong>Legal obligation</strong>: AML, tax, records retention.</li>
      </ul>

      <h2>5. Data sharing</h2>
      <p>We share personal data only with:</p>
      <ul>
        <li>Sub-processors (cloud hosting, payment processors, email delivery, analytics) under written data-processing agreements.</li>
        <li>National competent authorities where you instruct us to submit certificates on your behalf.</li>
        <li>Law-enforcement bodies where we are legally required.</li>
      </ul>
      <p>
        A full list of sub-processors is available at{" "}
        <a href="/security">/security</a>. We do not sell personal data.
      </p>

      <h2>6. International transfers</h2>
      <p>
        Personal data is processed primarily within the African Union. Where transfers occur to
        countries without adequacy decisions, we rely on Standard Contractual Clauses and equivalent
        safeguards.
      </p>

      <h2>7. Retention</h2>
      <ul>
        <li>Account data: for the duration of your account, plus 6 years for tax compliance.</li>
        <li>Trade documents: 7 years, per customs record-retention norms.</li>
        <li>Usage logs: 90 days (truncated/aggregated thereafter).</li>
      </ul>

      <h2>8. Your rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal data we hold about you.</li>
        <li>Request correction of inaccurate data.</li>
        <li>Request deletion (subject to legal retention rules).</li>
        <li>Object to or restrict processing in certain circumstances.</li>
        <li>Withdraw consent for marketing at any time.</li>
        <li>Lodge a complaint with your national data protection authority.</li>
      </ul>
      <p>
        Email <a href="mailto:dpo@sokoni.africa">dpo@sokoni.africa</a> to exercise any of these
        rights. We respond within 30 days.
      </p>

      <h2>9. Security</h2>
      <p>
        We implement industry-standard technical and organizational safeguards, including encryption
        in transit (TLS 1.3) and at rest (AES-256), least-privilege access controls, audit logging,
        and regular penetration testing. See <a href="/security">/security</a> for details.
      </p>

      <h2>10. Cookies</h2>
      <p>
        We use a minimal set of essential cookies and, with consent, analytics cookies. You can
        adjust your preferences via the cookie banner or your browser settings.
      </p>

      <h2>11. Changes</h2>
      <p>
        We&apos;ll update this policy from time to time. Material changes are announced via email
        or in-product notice 14 days in advance.
      </p>

      <h2>12. Contact</h2>
      <p>
        Privacy questions: <a href="mailto:dpo@sokoni.africa">dpo@sokoni.africa</a>. General
        inquiries: <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  );
}
