export const metadata = { title: "Webhooks — Sokoni Docs" };

export default function WebhooksPage() {
  return (
    <>
      <h1>Webhooks</h1>
      <p>
        Subscribe to lifecycle events so your stack reacts when Sokoni changes state — particularly
        useful for forwarders running compliance for many clients.
      </p>

      <h2>Events</h2>
      <table>
        <thead><tr><th>Event</th><th>Triggered when</th></tr></thead>
        <tbody>
          <tr><td><code>classification.completed</code></td><td>HS classification finishes</td></tr>
          <tr><td><code>determination.qualified</code></td><td>Shipment passes AfCFTA RoO</td></tr>
          <tr><td><code>determination.marginal</code></td><td>RVC 30-39% — review recommended</td></tr>
          <tr><td><code>determination.rejected</code></td><td>Shipment fails RoO</td></tr>
          <tr><td><code>certificate.issued</code></td><td>Certificate PDF is ready</td></tr>
          <tr><td><code>certificate.endorsed</code></td><td>National authority stamps the e-certificate</td></tr>
          <tr><td><code>workspace.upgraded</code></td><td>Subscription tier changes</td></tr>
        </tbody>
      </table>

      <h2>Payload format</h2>
      <pre>{`{
  "id": "evt_8H2k...",
  "type": "certificate.issued",
  "created": 1747567890,
  "data": {
    "object": {
      "id": "cert_K9p4...",
      "reference": "AFCFTA-K9P4XJ02",
      "pdf_url": "https://api.sokoni.africa/certs/...",
      "determination_id": "det_..."
    }
  }
}`}</pre>

      <h2>Signature verification</h2>
      <p>
        Every webhook includes <code>Sokoni-Signature</code> header in the form{" "}
        <code>t=1747567890,v1=&lt;hex&gt;</code>. Verify with HMAC-SHA256 over{" "}
        <code>{`{t}.{raw_body}`}</code> using your webhook secret:
      </p>
      <pre>{`import crypto from "crypto";

function verify(rawBody, signatureHeader, secret) {
  const [t, v] = signatureHeader.split(",").map(p => p.split("=")[1]);
  const expected = crypto
    .createHmac("sha256", secret)
    .update(\`\${t}.\${rawBody}\`)
    .digest("hex");
  return crypto.timingSafeEqual(Buffer.from(v), Buffer.from(expected));
}`}</pre>

      <h2>Retry policy</h2>
      <ul>
        <li>Non-2xx response triggers retry with exponential backoff: 1m, 5m, 30m, 2h, 6h, 24h.</li>
        <li>After 6 failed attempts (~32h), event is marked failed. Inspect in dashboard.</li>
        <li>Respond with 2xx within 10 seconds — process asynchronously.</li>
      </ul>

      <h2>Best practices</h2>
      <ul>
        <li>Treat webhooks as <strong>at-least-once</strong> delivery. Deduplicate on <code>id</code>.</li>
        <li>Always verify signatures.</li>
        <li>Return 2xx fast; do heavy work in a background job.</li>
        <li>Subscribe only to events you act on.</li>
      </ul>
    </>
  );
}
