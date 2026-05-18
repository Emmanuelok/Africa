export const metadata = { title: "Errors & rate limits — Sokoni Docs" };

export default function ApiErrorsPage() {
  return (
    <>
      <h1>Errors &amp; rate limits</h1>

      <h2>Error shape</h2>
      <p>All errors return a consistent JSON shape with HTTP status codes:</p>
      <pre>{`{
  "error": {
    "code": "invalid_hs_code",
    "message": "The HS code 9999 does not exist in HS 2022.",
    "type": "invalid_request_error",
    "param": "hs_code",
    "request_id": "req_8H2k..."
  }
}`}</pre>

      <h2>Status codes</h2>
      <table>
        <thead><tr><th>Status</th><th>When</th></tr></thead>
        <tbody>
          <tr><td>200</td><td>Success</td></tr>
          <tr><td>400</td><td>Invalid request — bad parameters, missing fields</td></tr>
          <tr><td>401</td><td>Authentication failed</td></tr>
          <tr><td>402</td><td>Payment required — over plan limits</td></tr>
          <tr><td>403</td><td>Forbidden — key lacks scope</td></tr>
          <tr><td>404</td><td>Not found</td></tr>
          <tr><td>409</td><td>Conflict — duplicate resource</td></tr>
          <tr><td>422</td><td>Unprocessable — semantic error (e.g. country not in AfCFTA)</td></tr>
          <tr><td>429</td><td>Rate limited</td></tr>
          <tr><td>5xx</td><td>Server error — please retry; check <a href="/status">status</a></td></tr>
        </tbody>
      </table>

      <h2>Common error codes</h2>
      <table>
        <thead><tr><th>Code</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td><code>invalid_api_key</code></td><td>Key missing, revoked, or wrong env</td></tr>
          <tr><td><code>invalid_hs_code</code></td><td>HS code not in HS 2022 nomenclature</td></tr>
          <tr><td><code>country_not_afcfta</code></td><td>Origin or destination not an AfCFTA state party</td></tr>
          <tr><td><code>determination_not_found</code></td><td>No determination with the supplied id</td></tr>
          <tr><td><code>quota_exceeded</code></td><td>Plan limit reached — upgrade or wait for reset</td></tr>
          <tr><td><code>rate_limited</code></td><td>Too many requests in window</td></tr>
        </tbody>
      </table>

      <h2>Rate limits</h2>
      <table>
        <thead><tr><th>Tier</th><th>Requests / second</th><th>Burst</th></tr></thead>
        <tbody>
          <tr><td>Free</td><td>2</td><td>20</td></tr>
          <tr><td>Pro SME</td><td>10</td><td>50</td></tr>
          <tr><td>SME Bulk</td><td>30</td><td>200</td></tr>
          <tr><td>Forwarder</td><td>100</td><td>1000</td></tr>
          <tr><td>API custom</td><td>Negotiable</td><td>Negotiable</td></tr>
        </tbody>
      </table>
      <p>
        Each response includes <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>,
        and <code>X-RateLimit-Reset</code> headers. Honor them; back off when you hit the limit.
      </p>

      <h2>Idempotency</h2>
      <p>
        Mutating endpoints (<code>POST /certificates</code>, <code>POST /shipments</code>) accept an{" "}
        <code>Idempotency-Key</code> header. Send the same key with a retry to safely re-send a
        request without duplicating effects. Keys expire after 24 hours.
      </p>
      <pre>{`curl -X POST https://api.sokoni.africa/v1/certificates \\
  -H "Authorization: Bearer $SOKONI_API_KEY" \\
  -H "Idempotency-Key: $(uuidgen)" \\
  -H "Content-Type: application/json" \\
  -d '...'`}</pre>
    </>
  );
}
