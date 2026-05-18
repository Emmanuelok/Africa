export const metadata = { title: "Authentication — Sokoni Docs" };

export default function ApiAuthPage() {
  return (
    <>
      <h1>Authentication</h1>
      <p>
        The Sokoni API uses bearer-token authentication. Every request must include your API key in
        the <code>Authorization</code> header.
      </p>

      <h2>Getting a key</h2>
      <ol>
        <li>Sign in at <a href="/signin">/signin</a></li>
        <li>Open <strong>Dashboard → Developers → API keys</strong></li>
        <li>Click <strong>Create key</strong>, name it (e.g. <em>production-erp</em>)</li>
        <li>Copy the key immediately — it&apos;s shown only once</li>
      </ol>

      <h2>Key prefixes</h2>
      <table>
        <thead><tr><th>Prefix</th><th>Environment</th><th>Behaviour</th></tr></thead>
        <tbody>
          <tr><td><code>sk_test_</code></td><td>Test mode</td><td>Free; uses sandbox data; certificates marked TEST</td></tr>
          <tr><td><code>sk_live_</code></td><td>Production</td><td>Real classification + billing</td></tr>
        </tbody>
      </table>

      <h2>Making a request</h2>
      <pre>{`curl https://api.sokoni.africa/v1/tariff?hs=0901&origin=KE&destination=NG \\
  -H "Authorization: Bearer sk_live_..."`}</pre>

      <h2>Common errors</h2>
      <table>
        <thead><tr><th>Status</th><th>Body code</th><th>Meaning</th></tr></thead>
        <tbody>
          <tr><td>401</td><td><code>invalid_api_key</code></td><td>Key revoked or wrong environment</td></tr>
          <tr><td>403</td><td><code>insufficient_scope</code></td><td>Key lacks permission for this endpoint</td></tr>
          <tr><td>429</td><td><code>rate_limited</code></td><td>Too many requests — see <a href="/docs/api/errors">limits</a></td></tr>
        </tbody>
      </table>

      <h2>Key rotation</h2>
      <p>
        Rotate keys at least every 90 days. Sokoni emails a reminder. Rotation: create a new key,
        deploy it, then revoke the old one — there&apos;s no downtime as long as you switch
        instances one at a time.
      </p>

      <h2>Security best practices</h2>
      <ul>
        <li><strong>Never</strong> commit API keys to git. Use environment variables.</li>
        <li>Scope keys narrowly: one per environment, one per service.</li>
        <li>Treat keys as secrets — rotate immediately if exposed.</li>
        <li>Report compromise to <a href="mailto:security@sokoni.africa">security@sokoni.africa</a>.</li>
      </ul>

      <h2>OAuth (coming Q4 2026)</h2>
      <p>
        We&apos;ll add OAuth 2.0 for users who want to grant third-party apps access to their
        Sokoni workspace without sharing API keys. Useful for marketplaces, accounting integrations,
        and freight platforms.
      </p>
    </>
  );
}
