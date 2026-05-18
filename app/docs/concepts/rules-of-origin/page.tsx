export const metadata = { title: "Rules of Origin — Sokoni Docs" };

export default function RulesOfOriginPage() {
  return (
    <>
      <h1>Rules of Origin</h1>
      <p>
        AfCFTA&apos;s preferential tariffs only apply if your goods <em>originate</em> in an AfCFTA
        State Party. The Rules of Origin (RoO) define what &ldquo;originate&rdquo; means, and they
        differ by product type. AfriOrigin&apos;s engine applies the right rule automatically based
        on the HS chapter.
      </p>

      <h2>The three core rules</h2>

      <h3>1. Wholly Obtained (WO)</h3>
      <p>
        Goods grown, harvested, mined, raised, or born entirely within one AfCFTA state. This is the
        strictest test but applies cleanly to most agricultural and mineral exports.
      </p>
      <p>
        <strong>Applies to:</strong> HS chapters 01-15 (live animals, vegetable products, animal/vegetable
        fats), HS 25-27 (mineral products, fuels).
      </p>
      <p>
        <strong>Example</strong>: Cocoa beans grown and harvested in Côte d&apos;Ivoire — yes,
        wholly obtained. Cocoa beans imported from Indonesia, repackaged in Ghana — no, not wholly
        obtained.
      </p>

      <h3>2. Change of Tariff Heading (CTH)</h3>
      <p>
        Non-originating inputs (raw materials sourced outside AfCFTA) undergo substantial processing
        such that the finished product falls under a different 4-digit HS heading.
      </p>
      <p>
        <strong>Applies to:</strong> Most processed and manufactured goods.
      </p>
      <p>
        <strong>Example</strong>: Cocoa beans (HS 1801) imported into Ghana from outside AfCFTA, then
        processed into cocoa butter (HS 1804). The change from heading 1801 to 1804 satisfies CTH.
      </p>

      <h3>3. Regional Value Content (RVC)</h3>
      <p>
        At least <strong>40%</strong> of the ex-works cost of the finished product must be
        attributable to materials or processing within AfCFTA states. Some sensitive sectors require
        higher thresholds (vehicles: 40-45%; textiles: yarn-forward).
      </p>
      <p>
        <strong>RVC formula (build-up method)</strong>:
      </p>
      <pre>{`RVC = (Cost of originating materials + Direct labour + Direct overheads)
      ÷ Ex-works price
      × 100`}</pre>

      <h2>Special rules</h2>

      <h3>Yarn-forward (textiles, HS 50-63)</h3>
      <p>
        Yarn must be spun and fabric must be woven/knitted within an AfCFTA state. Cut-and-sew from
        imported fabric does <strong>not</strong> qualify, even if the finished garment is fully
        African-made.
      </p>

      <h3>Vehicles (HS 87)</h3>
      <p>
        CTH plus ≥40% RVC. Imported CKD (completely-knocked-down) kits with mere assembly do not
        qualify; substantial component production is required.
      </p>

      <h2>Cumulation</h2>
      <p>
        AfCFTA allows <strong>diagonal cumulation</strong>: inputs from any AfCFTA State Party count
        as originating when calculating origin for the finished product. This makes regional value
        chains viable — a Nigerian assembler can source components from Egypt, Tunisia, and South
        Africa and still claim AfCFTA origin.
      </p>

      <h2>Documentation</h2>
      <p>
        To claim preferences, you submit a <a href="/docs/afriorigin/certificates">Certificate of
        Origin</a> in Annex II Appendix I format, generally endorsed by your national competent
        authority. Approved Exporters can self-declare via origin declarations.
      </p>

      <h2>Common pitfalls</h2>
      <ul>
        <li><strong>Minimal operations don&apos;t count.</strong> Repackaging, relabelling, simple mixing, dilution with water — none of these confer origin.</li>
        <li><strong>De minimis rule</strong>: up to 10% of non-originating materials by value may be tolerated for certain products, but check the product-specific rule.</li>
        <li><strong>Direct shipment</strong>: goods must move directly from origin to destination, or transit must be justified (technical or geographic).</li>
        <li><strong>Documentary proof</strong>: keep supplier declarations, production records, and cost breakdowns for at least <strong>5 years</strong> — customs may audit.</li>
      </ul>

      <h2>Next</h2>
      <ul>
        <li><a href="/docs/afriorigin/origin-determination">How AfriOrigin determines origin automatically</a></li>
        <li><a href="/docs/afriorigin/certificates">Generating Certificates of Origin</a></li>
      </ul>
    </>
  );
}
