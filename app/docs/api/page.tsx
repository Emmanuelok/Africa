export const metadata = { title: "API overview — Sokoni Docs" };

export default function ApiOverviewPage() {
  return (
    <>
      <h1>API overview</h1>
      <p>
        The Sokoni API is a REST-over-JSON service for embedding AfCFTA compliance into your stack.
        Predictable per-call pricing, bulk discounts past 100k calls/month, no monthly minimum.
      </p>

      <h2>Base URL</h2>
      <pre>https://api.sokoni.africa/v1</pre>

      <h2>Endpoints</h2>
      <table>
        <thead><tr><th>Method</th><th>Path</th><th>Use</th><th>Price</th></tr></thead>
        <tbody>
          <tr><td><code>POST</code></td><td><code>/classify</code></td><td>HS-4 classification from description</td><td>$0.10 / call</td></tr>
          <tr><td><code>POST</code></td><td><code>/determine-origin</code></td><td>AfCFTA Rules of Origin verdict</td><td>$0.20 / call</td></tr>
          <tr><td><code>POST</code></td><td><code>/certificates</code></td><td>Generate Certificate of Origin PDF</td><td>$1.50 / cert</td></tr>
          <tr><td><code>GET</code></td><td><code>/tariff</code></td><td>MFN + AfCFTA rate lookup</td><td>$0.02 / call</td></tr>
          <tr><td><code>POST</code></td><td><code>/shipments</code></td><td>End-to-end: classify + determine + cert in one call</td><td>$1.80 / call</td></tr>
          <tr><td><code>GET</code></td><td><code>/determinations/:id</code></td><td>Retrieve a past determination</td><td>Free</td></tr>
          <tr><td><code>GET</code></td><td><code>/certificates/:id</code></td><td>Retrieve a certificate + PDF link</td><td>Free</td></tr>
        </tbody>
      </table>

      <h2>Quickstart</h2>
      <pre>{`# Authenticate with your API key (header)
export SOKONI_API_KEY="sk_live_..."

# End-to-end shipment flow:
curl -X POST https://api.sokoni.africa/v1/shipments \\
  -H "Authorization: Bearer $SOKONI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "description": "AA grade Arabica green coffee beans, 60kg jute bags",
    "origin": "KE",
    "destination": "NG",
    "quantity": 1500,
    "unit": "kg",
    "fob_value_usd": 9300,
    "exporter": { "name": "Highlands Coffee Coop", "address": "Nyeri, Kenya" },
    "consignee": { "name": "Lagos Roasters Ltd", "address": "Apapa, Lagos" },
    "generate_certificate": true
  }'`}</pre>

      <h2>SDKs</h2>
      <ul>
        <li><code>@sokoni/node</code> (TypeScript, Node 18+)</li>
        <li><code>sokoni</code> (Python 3.10+)</li>
        <li><code>github.com/sokoni-africa/go-sdk</code> (Go 1.21+)</li>
      </ul>

      <h2>OpenAPI</h2>
      <p>
        The full OpenAPI 3.1 spec is served at{" "}
        <a href="/api/openapi.json"><code>/api/openapi.json</code></a>. Import into Postman,
        Insomnia, or any OpenAPI-compatible client to generate your own SDKs.
      </p>
      <pre>{`curl https://sokoni.africa/api/openapi.json | jq`}</pre>

      <h2>Next</h2>
      <ul>
        <li><a href="/docs/api/authentication">Authentication</a></li>
        <li><a href="/docs/api/webhooks">Webhooks</a></li>
        <li><a href="/docs/api/errors">Errors &amp; rate limits</a></li>
      </ul>
    </>
  );
}
