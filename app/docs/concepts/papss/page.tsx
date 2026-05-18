export const metadata = { title: "PAPSS — Sokoni Docs" };

export default function PapssPage() {
  return (
    <>
      <h1>PAPSS — Pan-African Payments and Settlement System</h1>
      <p>
        PAPSS is the African Union&apos;s answer to the &ldquo;80% of intra-African payments still
        route through New York&rdquo; problem. Operated by Afreximbank, it settles cross-border
        transactions <strong>in local currencies</strong>, in <strong>seconds</strong>, between
        African banks.
      </p>

      <h2>Why it matters</h2>
      <ul>
        <li>Most intra-African payments today route via USD or EUR correspondent banks in London or New York.</li>
        <li>Fees can reach 10%; settlement takes days to weeks.</li>
        <li>PAPSS settles directly between African central banks in real time.</li>
      </ul>

      <h2>Current status (May 2026)</h2>
      <table>
        <thead>
          <tr><th>Metric</th><th>Status</th></tr>
        </thead>
        <tbody>
          <tr><td>Central banks signed on</td><td>15</td></tr>
          <tr><td>Commercial banks live</td><td>160+</td></tr>
          <tr><td>Countries with live commercial banks</td><td>13</td></tr>
          <tr><td>Countries in onboarding</td><td>4 (TN, KM, UG, EG)</td></tr>
        </tbody>
      </table>

      <h2>How it works</h2>
      <ol>
        <li>Buyer in Lagos initiates a payment in NGN to a supplier in Nairobi.</li>
        <li>The buyer&apos;s bank submits the instruction to PAPSS.</li>
        <li>PAPSS converts NGN → KES via the agreed reference rate.</li>
        <li>Funds credit the supplier&apos;s KES account in seconds.</li>
        <li>Settlement between the Central Bank of Nigeria and Central Bank of Kenya happens at end of day in net positions.</li>
      </ol>
      <blockquote>
        No USD round-trip. No correspondent bank fees. No multi-day float.
      </blockquote>

      <h2>How Sokoni uses PAPSS</h2>
      <p>
        Sokoni doesn&apos;t settle payments itself — we&apos;re an application-layer SaaS, not a
        bank. But we surface PAPSS-eligibility on every trade lane in the wizard and the live map:
      </p>
      <ul>
        <li><a href="/commodities">Live Africa Map</a> badges each country with PAPSS status (live / pending).</li>
        <li>Country drill-down panels show PAPSS-live as a positive trust signal.</li>
        <li>Certificates of Origin display the settlement route the goods will flow on.</li>
      </ul>
      <p>
        When PAPSS opens its public API (announced for Q3 2026), Sokoni will integrate direct
        payment initiation from the dashboard.
      </p>

      <h2>Sister rails</h2>
      <ul>
        <li><strong>PACM</strong> — Pan-African Currency Marketplace: the FX layer underneath PAPSS.</li>
        <li><strong>ADAPT</strong> — Afreximbank&apos;s African Trade Gateway, providing digital infrastructure for trade documentation, KYC/AML, and KYB.</li>
      </ul>

      <h2>Learn more</h2>
      <ul>
        <li><a href="https://papss.com" target="_blank" rel="noopener noreferrer">papss.com</a></li>
        <li><a href="https://www.afreximbank.com" target="_blank" rel="noopener noreferrer">Afreximbank</a></li>
      </ul>
    </>
  );
}
