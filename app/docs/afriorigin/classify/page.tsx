export const metadata = { title: "HS Classification — Sokoni Docs" };

export default function ClassifyDocPage() {
  return (
    <>
      <h1>HS classification</h1>
      <p>
        The first step of any AfCFTA determination is finding the correct HS code. Get this wrong
        and every downstream calculation — tariff rate, rules-of-origin test, certificate — is
        wrong with it.
      </p>

      <h2>How AfriOrigin classifies</h2>
      <p>
        AfriOrigin uses a two-stage classifier:
      </p>
      <ol>
        <li>
          <strong>AI classification</strong> via Anthropic Claude, anchored to the WCO HS 2022
          nomenclature. The model returns an HS-4 code with a confidence score and reasoning that
          cites the relevant chapter and heading text.
        </li>
        <li>
          <strong>Keyword fallback</strong> for the top ~200 African export categories. Used when
          the AI service is unavailable or when latency budgets require a sub-50ms response.
        </li>
      </ol>

      <h2>Best-practice descriptions</h2>
      <p>Better descriptions = better classifications. Include:</p>
      <ul>
        <li>The product type (coffee beans, leather, sesame seeds)</li>
        <li>Processing state (green / roasted / ground; raw / cleaned / hulled)</li>
        <li>Grade or specification (AA, KOR 48+, full grain, 1.2mm)</li>
        <li>Packaging if relevant (60kg jute, vacuum tube, bulk vessel)</li>
        <li>End use, if not obvious from the above</li>
      </ul>

      <h3>Bad → good examples</h3>
      <table>
        <thead><tr><th>Bad</th><th>Good</th></tr></thead>
        <tbody>
          <tr><td>&ldquo;coffee&rdquo;</td><td>&ldquo;Washed Arabica green coffee beans, AA grade, screen 17/64, 60kg jute bags&rdquo;</td></tr>
          <tr><td>&ldquo;leather&rdquo;</td><td>&ldquo;Chrome-tanned, vegetable-retan full-grain calfskin, 1.0-1.2mm, finished&rdquo;</td></tr>
          <tr><td>&ldquo;fabric&rdquo;</td><td>&ldquo;100% combed cotton wax-print fabric, 110gsm, 45-inch width, OEKO-TEX 100&rdquo;</td></tr>
        </tbody>
      </table>

      <h2>Confidence scores</h2>
      <table>
        <thead><tr><th>Score</th><th>What it means</th></tr></thead>
        <tbody>
          <tr><td>≥0.9</td><td>High confidence. Safe to use without manual review.</td></tr>
          <tr><td>0.7-0.9</td><td>Probably correct. Review the alternates briefly.</td></tr>
          <tr><td>0.5-0.7</td><td>Likely correct but ambiguous. Manual review recommended.</td></tr>
          <tr><td>&lt;0.5</td><td>Add more specifics to the description; consider expert review.</td></tr>
        </tbody>
      </table>

      <h2>API usage</h2>
      <pre>{`curl -X POST https://api.sokoni.africa/v1/classify \\
  -H "Authorization: Bearer $SOKONI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "AA grade Arabica green coffee beans, 60kg jute"
  }'`}</pre>

      <p>Response:</p>
      <pre>{`{
  "hsPrefix": "0901",
  "description": "Coffee, not roasted, not decaffeinated",
  "confidence": 0.96,
  "reasoning": "Description specifies green (unroasted) Arabica beans...",
  "alternates": [
    { "hsPrefix": "0902", "description": "Tea", "confidence": 0.02 }
  ]
}`}</pre>

      <h2>Where this is wrong</h2>
      <p>
        AfriOrigin&apos;s output is <strong>guidance, not legal classification</strong>. Customs
        authorities have final authority. For high-value shipments or repeated production runs,
        request a <em>binding tariff ruling</em> from your national customs authority — and use
        AfriOrigin to prepare the application.
      </p>
    </>
  );
}
