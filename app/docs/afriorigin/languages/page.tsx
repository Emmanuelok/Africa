export const metadata = { title: "Languages — Sokoni Docs" };

export default function LanguagesPage() {
  return (
    <>
      <h1>Languages</h1>
      <p>
        Africa is multilingual by default. AfriOrigin ships in five languages, chosen to cover the
        official languages of all AfCFTA states.
      </p>

      <table>
        <thead><tr><th>Code</th><th>Language</th><th>Coverage</th></tr></thead>
        <tbody>
          <tr><td><code>en</code></td><td>English</td><td>27 states (anglophone Africa)</td></tr>
          <tr><td><code>fr</code></td><td>Français</td><td>21 states (francophone Africa)</td></tr>
          <tr><td><code>pt</code></td><td>Português</td><td>6 states (lusophone Africa)</td></tr>
          <tr><td><code>ar</code></td><td>العربية</td><td>10 states (North Africa, Sahel)</td></tr>
          <tr><td><code>sw</code></td><td>Kiswahili</td><td>Working language across East Africa, AU lingua franca</td></tr>
        </tbody>
      </table>

      <h2>What gets translated</h2>
      <ul>
        <li>UI text — buttons, labels, error messages</li>
        <li>Wizard prompts and origin determination questions</li>
        <li>Plain-language Rules of Origin reasoning (AI-generated in the user&apos;s language)</li>
        <li>Email notifications</li>
        <li>Certificate of Origin (header fields stay in English per AfCFTA standard, but boilerplate appears bilingual)</li>
      </ul>

      <h2>Switching language</h2>
      <p>
        Use the language picker in the header (globe icon). Your preference is stored client-side
        and synced to your account on the next sign-in.
      </p>

      <h2>API usage</h2>
      <p>
        Pass <code>language</code> in the request body to localise generated reasoning and
        notifications:
      </p>
      <pre>{`curl -X POST https://api.sokoni.africa/v1/determine-origin \\
  -H "Authorization: Bearer $SOKONI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "hs_code": "0901.11",
    "origin_country": "CI",
    "destination_country": "MA",
    "language": "fr"
  }'`}</pre>

      <h2>RTL support</h2>
      <p>
        Arabic renders right-to-left. The full layout flips: navigation, form fields, sparklines,
        and certificate boxes all reflow correctly.
      </p>

      <h2>Adding a language</h2>
      <p>
        If your market needs a language that&apos;s not on this list (Amharic, Hausa, Yoruba, Zulu,
        and Afrikaans are most-requested), email{" "}
        <a href="mailto:product@sokoni.africa">product@sokoni.africa</a>. We add the next language
        when 100 paying SMEs in that market sign up.
      </p>
    </>
  );
}
