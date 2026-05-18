import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Terms of Service — Sokoni" };

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Terms of Service" lastUpdated="18 May 2026">
      <p>
        These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of Sokoni
        AfriOrigin and any related products operated by Sokoni Holdings Ltd (&ldquo;Sokoni&rdquo;,
        &ldquo;we&rdquo;, &ldquo;us&rdquo;). By using the platform, you agree to these Terms. If
        you do not agree, do not use Sokoni.
      </p>

      <h2>1. The service</h2>
      <p>
        Sokoni provides software for African Continental Free Trade Area (AfCFTA) compliance
        workflows — including HS code classification, Rules of Origin determination, tariff
        calculations, and the generation of trade documents in the formats prescribed by Annex II
        to the AfCFTA Protocol on Trade in Goods.
      </p>
      <p>
        Sokoni is software, not a licensed customs broker or freight forwarder. We do not file
        declarations on your behalf with any national customs authority. You remain responsible for
        ensuring that any documents you submit to a competent authority are accurate, complete, and
        compliant with applicable laws.
      </p>

      <h2>2. Eligibility and accounts</h2>
      <ul>
        <li>You must be at least 18 years old and capable of forming a binding contract.</li>
        <li>You must provide accurate registration information and keep it current.</li>
        <li>You are responsible for safeguarding your account credentials and for all activity under your account.</li>
        <li>We may verify your business identity (KYB) as a condition of access to paid features.</li>
      </ul>

      <h2>3. Subscriptions and billing</h2>
      <ul>
        <li>Paid plans are billed monthly in advance unless otherwise agreed.</li>
        <li>Fees are non-refundable except where required by law or expressly stated.</li>
        <li>We may change subscription pricing on 30 days&apos; notice; changes apply from your next billing period.</li>
        <li>Failure to pay may result in suspension or termination of your account.</li>
      </ul>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use Sokoni to facilitate any illegal activity, including sanctions evasion, money laundering, or smuggling.</li>
        <li>Submit false declarations or use generated certificates for goods that do not qualify.</li>
        <li>Reverse engineer, scrape, or otherwise extract bulk data from the platform without written consent.</li>
        <li>Interfere with the platform&apos;s integrity, security, or performance.</li>
      </ul>

      <h2>5. Intellectual property</h2>
      <p>
        Sokoni&apos;s software, content, brand, and underlying data (including tariff schedules
        compiled and curated by Sokoni) are protected by intellectual property laws. We grant you a
        limited, non-exclusive, non-transferable licence to use the service for your own internal
        business purposes during your subscription.
      </p>

      <h2>6. Your data</h2>
      <p>
        You retain ownership of the data you submit. You grant us a worldwide, royalty-free licence
        to host, process, and display that data solely to provide the service to you. Our handling
        of personal data is described in the <a href="/privacy">Privacy Policy</a>.
      </p>

      <h2>7. Disclaimers</h2>
      <p>
        AfriOrigin&apos;s classifications, origin determinations, and tariff calculations are
        provided <strong>for guidance only</strong>. While we make every effort to keep our data
        accurate and current with published AfCFTA schedules, customs authorities have final
        authority on classification and origin. You must independently verify any output before
        relying on it for a customs declaration.
      </p>
      <p>
        The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;. To the maximum
        extent permitted by law, we disclaim all warranties, express or implied.
      </p>

      <h2>8. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Sokoni&apos;s aggregate liability arising out of
        or relating to these Terms or the service is limited to the fees you paid us in the twelve
        months preceding the event giving rise to the claim. We are not liable for indirect,
        incidental, special, consequential, or punitive damages.
      </p>

      <h2>9. Termination</h2>
      <p>
        You may terminate your account at any time from your dashboard. We may suspend or terminate
        your access if you breach these Terms or applicable law. On termination, your access ends
        and we may delete your data after a reasonable retention period.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Republic of Kenya without regard to conflict of
        laws principles. Disputes shall be resolved in the courts of Nairobi, Kenya, unless
        applicable consumer-protection law requires otherwise.
      </p>

      <h2>11. Changes to these Terms</h2>
      <p>
        We may update these Terms from time to time. Material changes will be announced via email or
        in-product notice at least 14 days before they take effect.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about these Terms? Reach us at{" "}
        <a href="mailto:legal@sokoni.africa">legal@sokoni.africa</a> or via the{" "}
        <a href="/contact">contact page</a>.
      </p>
    </LegalPage>
  );
}
