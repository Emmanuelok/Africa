export const metadata = { title: "Quickstart — Sokoni Docs" };

export default function QuickstartPage() {
  return (
    <>
      <h1>Quickstart</h1>
      <p>
        Run your first AfCFTA determination end-to-end in 60 seconds. You&apos;ll classify a product,
        check Rules of Origin, see your tariff savings, and download a Certificate of Origin.
      </p>

      <h2>1. Sign up</h2>
      <p>
        Create a free account at <a href="/signup">/signup</a>. No credit card required. Free tier
        includes <strong>1 origin determination per month</strong> plus 3 HS classifications.
      </p>

      <h2>2. Open the wizard</h2>
      <p>
        From the dashboard or directly at <a href="/afriorigin">/afriorigin</a>, paste a description
        of what you&apos;re shipping:
      </p>
      <pre>{`Premium washed Arabica green coffee beans,
AA grade, 60kg jute bags with GrainPro liner`}</pre>
      <p>
        Set origin (where you ship from), destination, quantity, and FOB value. Click{" "}
        <strong>Classify with AI</strong>.
      </p>

      <h2>3. Confirm the HS code</h2>
      <p>
        AfriOrigin returns an HS-4 code with a confidence score, the matched description, and up to
        three alternates. Verify it&apos;s correct (or pick an alternate). Click{" "}
        <strong>Continue</strong>.
      </p>

      <h2>4. Answer 2-3 origin questions</h2>
      <p>
        The wizard adapts the question set based on your HS chapter:
      </p>
      <ul>
        <li>HS 01-15, 25-27 (agriculture, minerals): one question — &ldquo;wholly obtained?&rdquo;</li>
        <li>HS 50-63 (textiles): yarn-forward rule with regional value content slider</li>
        <li>HS 16-24, 28-49, 64-97 (industrial): change-of-heading + RVC slider</li>
      </ul>

      <h2>5. See your savings</h2>
      <p>
        AfriOrigin shows MFN duty vs AfCFTA preferential duty, exact USD savings, and an explainer
        of the rule applied.
      </p>
      <blockquote>
        Example: on a $9,300 coffee shipment KE → NG, you save <strong>$930</strong> — 10% of
        shipment value, paid back hundreds of times over the cost of a Pro subscription.
      </blockquote>

      <h2>6. Generate the certificate</h2>
      <p>
        Add exporter and consignee details. Click <strong>AfCFTA Certificate of Origin</strong> to
        open a print-ready certificate in Annex II Appendix I format. Use your browser&apos;s
        Print → Save as PDF to download.
      </p>

      <h2>Next steps</h2>
      <ul>
        <li><a href="/docs/afriorigin/origin-determination">How origin determination works</a></li>
        <li><a href="/docs/api">Calling AfriOrigin from your code</a></li>
        <li><a href="/pricing">Upgrade to unlimited determinations</a></li>
      </ul>
    </>
  );
}
