export const metadata = { title: "Certificates of Origin — Sokoni Docs" };

export default function CertificatesPage() {
  return (
    <>
      <h1>Certificates of Origin</h1>
      <p>
        AfriOrigin generates Certificates of Origin in the format prescribed by{" "}
        <strong>Annex II, Appendix I</strong> of the AfCFTA Protocol on Trade in Goods. The format
        is harmonised across all 54 State Parties — what works in Lagos works in Cairo.
      </p>

      <h2>The 9 boxes</h2>
      <ol>
        <li><strong>Exporter</strong> — name, address, country, registration number</li>
        <li><strong>Consignee</strong> — name, address, country</li>
        <li><strong>Country of origin</strong></li>
        <li><strong>Country of destination</strong></li>
        <li><strong>Description of goods</strong> — HS code, marks &amp; numbers, FOB value, quantity</li>
        <li><strong>Origin criterion</strong> — WO / CTH / RVC / Sub-transformation, etc.</li>
        <li><strong>Preferential tariff rate</strong></li>
        <li><strong>Exporter declaration</strong></li>
        <li><strong>Certification by competent authority</strong></li>
      </ol>

      <h2>Generating a certificate</h2>
      <p>From the wizard:</p>
      <ol>
        <li>Complete steps 1-2 (classification + origin determination).</li>
        <li>On step 3, add exporter and consignee details.</li>
        <li>Click <strong>AfCFTA Certificate of Origin</strong> to open a print-ready page.</li>
        <li>Browser <em>Print</em> → <em>Save as PDF</em>, or print directly.</li>
      </ol>

      <h2>Validity and endorsement</h2>
      <p>
        Each generated certificate carries a unique reference (<code>AFCFTA-XXXXXXXX</code>) and a
        QR verification URL. Two states of validity:
      </p>
      <ul>
        <li><strong>Self-declared</strong> — sufficient if your exporter is registered as an{" "}
          <em>AfCFTA Approved Exporter</em> with your national competent authority.</li>
        <li><strong>Endorsed</strong> — stamped by your national customs authority for non-Approved
          exporters. AfriOrigin guides you through the handoff per country.</li>
      </ul>

      <h2>Digital Trade Protocol acceptance</h2>
      <p>
        Under the AU Digital Trade Protocol (adopted February 2025), <strong>State Parties must
        accept electronic certificates and e-signatures</strong>. Our PDFs are e-signature ready and
        carry the digital validity markers required by Article 6 of the Protocol.
      </p>

      <h2>Record-keeping</h2>
      <p>
        Keep the underlying determination, supplier declarations, and production records for at
        least <strong>5 years</strong>. Sokoni stores everything in your workspace and exposes it
        via the <a href="/docs/api">API</a> for ERP archive sync.
      </p>

      <h2>API usage</h2>
      <pre>{`curl -X POST https://api.sokoni.africa/v1/certificates \\
  -H "Authorization: Bearer $SOKONI_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "determination_id": "det_8H2k...",
    "exporter": {
      "name": "Highlands Coffee Cooperative",
      "address": "Nyeri, Kenya"
    },
    "consignee": {
      "name": "Lagos Roasters Ltd",
      "address": "Apapa, Lagos"
    },
    "shipment": { "quantity": 1500, "unit": "kg", "fob_value_usd": 9300 }
  }'`}</pre>

      <p>Response:</p>
      <pre>{`{
  "certificate_id": "cert_K9p4...",
  "reference": "AFCFTA-K9P4XJ02",
  "pdf_url": "https://api.sokoni.africa/certs/cert_K9p4....pdf",
  "qr_verification_url": "https://verify.sokoni.africa/AFCFTA-K9P4XJ02",
  "issued_at": "2026-05-18T09:14:22Z"
}`}</pre>

      <h2>White-label (Forwarder tier)</h2>
      <p>
        On the Forwarder tier, certificates render with your branding (logo, colors, your customs
        broker registration). Customers see your name; Sokoni stays in the background.
      </p>
    </>
  );
}
