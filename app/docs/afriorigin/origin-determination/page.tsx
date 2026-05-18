export const metadata = { title: "Origin Determination — Sokoni Docs" };

export default function OriginDeterminationPage() {
  return (
    <>
      <h1>Origin determination</h1>
      <p>
        Once your HS code is set, AfriOrigin runs the Rules of Origin engine to determine whether
        your goods qualify for the AfCFTA preferential tariff.
      </p>

      <h2>The decision tree</h2>
      <p>The engine picks the rule based on the HS chapter:</p>
      <table>
        <thead><tr><th>HS chapter</th><th>Rule applied</th><th>Question(s)</th></tr></thead>
        <tbody>
          <tr><td>01-15, 25-27</td><td>Wholly Obtained</td><td>Are all inputs sourced within AfCFTA states?</td></tr>
          <tr><td>16-24, 28-49, 64-83, 90-97</td><td>CTH or ≥40% RVC</td><td>Change of tariff heading? + RVC slider</td></tr>
          <tr><td>50-63</td><td>Yarn-forward</td><td>CTH + substantial transformation + RVC slider</td></tr>
          <tr><td>87</td><td>Vehicles (special)</td><td>CTH + ≥40% RVC; CKD assembly does not qualify</td></tr>
        </tbody>
      </table>

      <h2>Outcomes</h2>
      <ul>
        <li><strong>Qualifies</strong> — your goods meet the rule; claim the preferential rate.</li>
        <li><strong>Marginal</strong> — close to threshold (e.g. RVC 30-39%). Consider re-sourcing or applying for a product-specific rule under Annex 2.</li>
        <li><strong>Does not qualify</strong> — MFN rate applies. Common fix: source more inputs from AfCFTA states.</li>
      </ul>

      <h2>Plain-language reasoning</h2>
      <p>
        When the Anthropic API is configured, the engine generates 2-4 sentences of plain-language
        reasoning tailored to a non-customs reader, citing the rule and the user-supplied facts.
        Example output for a qualifying coffee shipment:
      </p>
      <blockquote>
        Coffee in HS chapter 9 requires inputs to be wholly obtained within an AfCFTA state. You
        confirmed all green beans were grown and harvested at your Nyeri estates in Kenya, with no
        non-African inputs. Article 5 of the AfCFTA RoO Annex applies — your shipment qualifies for
        the preferential 2.5% rate (vs the 12.5% MFN rate).
      </blockquote>

      <h2>API usage</h2>
      <pre>{`curl -X POST https://api.sokoni.africa/v1/determine-origin \\
  -H "Authorization: Bearer $SOKONI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "hs_code": "0901.11",
    "origin_country": "KE",
    "destination_country": "NG",
    "whole_obtained": true
  }'`}</pre>

      <p>Response:</p>
      <pre>{`{
  "qualifies": "yes",
  "rule_applied": "Wholly Obtained (Article 5)",
  "reasoning": ["Coffee beans in HS 0901 require wholly-obtained status..."],
  "preferential_rate": 2.5,
  "mfn_rate": 12.5,
  "next_steps": ["Proceed to /certificates to generate Certificate of Origin"]
}`}</pre>

      <h2>Marginal cases — what to do</h2>
      <p>
        If your RVC lands between 30-40%, AfriOrigin returns a <strong>marginal</strong> verdict.
        Options:
      </p>
      <ul>
        <li><strong>Re-source upward</strong>: swap a non-originating input for one from another AfCFTA state.</li>
        <li><strong>Recalculate</strong>: include all direct labour, direct overheads, and originating materials. Some exporters under-count.</li>
        <li><strong>Apply for a product-specific rule (PSR)</strong>: certain products in Annex 2 have alternative rules that may be easier to satisfy.</li>
        <li><strong>Consult your national AfCFTA focal point</strong>: every State Party has one; we list them in the dashboard for paid plans.</li>
      </ul>
    </>
  );
}
