export const metadata = { title: "What is AfCFTA? — Sokoni Docs" };

export default function AfcftaConceptPage() {
  return (
    <>
      <h1>What is AfCFTA?</h1>
      <p>
        The <strong>African Continental Free Trade Area</strong> is a single market for goods and
        services across 54 African states, ratified by 48 of them as of May 2026. It&apos;s the
        largest free-trade area in the world by membership.
      </p>

      <h2>The headline numbers</h2>
      <ul>
        <li><strong>1.3 billion people</strong> across 54 states</li>
        <li><strong>$3.4 trillion</strong> combined GDP</li>
        <li><strong>90%</strong> of tariff lines to be liberalised over 5-13 years (Cat A &amp; B)</li>
        <li><strong>16-17%</strong> intra-African trade share today vs <strong>50%</strong> target by 2035</li>
      </ul>

      <h2>Tariff categories</h2>
      <p>
        AfCFTA tariffs phase down on schedules tied to each line&apos;s sensitivity:
      </p>
      <ul>
        <li><strong>Category A</strong>: ~90% of lines, liberalised over 5 years (10 for LDCs)</li>
        <li><strong>Category B</strong>: 7% of lines, liberalised over 10 years (13 for LDCs)</li>
        <li><strong>Category C</strong>: 3% sensitive list, excluded from liberalisation</li>
      </ul>
      <p>
        AfriOrigin&apos;s <a href="/afcfta">tariff calculator</a> shows the current preferential rate
        per HS code and the year-by-year phase-down ahead.
      </p>

      <h2>Rules of Origin</h2>
      <p>
        The preferential rate only applies if your goods meet the AfCFTA{" "}
        <a href="/docs/concepts/rules-of-origin">Rules of Origin</a>. Three main pathways:
      </p>
      <ul>
        <li><strong>Wholly obtained</strong> — for agricultural and mineral goods sourced entirely within AfCFTA</li>
        <li><strong>Change of tariff heading</strong> — for processed goods where inputs were imported</li>
        <li><strong>Regional value content</strong> — typically ≥40% value added within AfCFTA states</li>
      </ul>

      <h2>The Digital Trade Protocol</h2>
      <p>
        Adopted by the AU Assembly in February 2025, the Digital Trade Protocol requires all State
        Parties to accept electronic documents and e-signatures, harmonises rules of origin for
        digital products, and establishes a continental digital trade framework. AfriOrigin&apos;s
        electronic Certificate of Origin is generated to be compliant from day one.
      </p>

      <h2>The institutional rails</h2>
      <table>
        <thead>
          <tr>
            <th>Rail</th>
            <th>Operator</th>
            <th>Purpose</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><a href="/docs/concepts/papss">PAPSS</a></td>
            <td>Afreximbank</td>
            <td>Cross-border settlement in local currencies</td>
          </tr>
          <tr>
            <td>PACM</td>
            <td>Afreximbank</td>
            <td>Pan-African Currency Marketplace — FX between African currencies</td>
          </tr>
          <tr>
            <td>ADAPT</td>
            <td>Afreximbank</td>
            <td>Digital infrastructure for trade documentation</td>
          </tr>
          <tr>
            <td>AfCFTA Secretariat</td>
            <td>African Union (Accra)</td>
            <td>Implementing body for the agreement</td>
          </tr>
        </tbody>
      </table>

      <h2>What Sokoni is</h2>
      <p>
        Sokoni is the SME-facing application layer that sits on top of these public rails. AfriOrigin
        is the wedge — once a small exporter&apos;s identity, shipment history, and counterparties
        live on Sokoni, the rest of the stack (payments, logistics, trade finance) follows.
      </p>

      <h2>Further reading</h2>
      <ul>
        <li><a href="https://au-afcfta.org" target="_blank" rel="noopener noreferrer">AfCFTA Secretariat</a></li>
        <li><a href="https://www.tralac.org" target="_blank" rel="noopener noreferrer">tralac — Trade Law Centre</a></li>
        <li><a href="https://papss.com" target="_blank" rel="noopener noreferrer">PAPSS</a></li>
      </ul>
    </>
  );
}
