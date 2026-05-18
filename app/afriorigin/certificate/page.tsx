import { getCountry } from "@/lib/data/countries";
import { PrintBar } from "@/components/PrintBar";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "AfCFTA Certificate of Origin"
};

function generateRef() {
  const ts = Date.now().toString(36).toUpperCase();
  return `AFCFTA-${ts.slice(-8)}`;
}

export default function CertificatePage({
  searchParams
}: {
  searchParams?: Record<string, string | undefined>;
}) {
  const sp = searchParams ?? {};
  const origin = getCountry(sp.origin ?? "");
  const dest = getCountry(sp.dest ?? "");
  const ref = generateRef();
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="min-h-screen bg-white p-6 md:p-10 print:p-0">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 18mm; }
          .no-print { display: none !important; }
          body { background: white !important; }
        }
      `}</style>

      <PrintBar />

      <div className="mx-auto max-w-3xl border-2 border-ink-900 bg-white p-8 font-sans text-sm text-ink-900 print:border-2">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-ink-900 pb-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-terracotta-700">
              African Continental Free Trade Area
            </div>
            <div className="mt-1 font-display text-2xl font-bold">
              CERTIFICATE OF ORIGIN
            </div>
            <div className="mt-1 text-xs text-ink-600">
              Annex II to the Protocol on Trade in Goods, Appendix I
            </div>
          </div>
          <div className="text-right text-xs">
            <div className="text-ink-500">Reference No.</div>
            <div className="font-mono font-semibold">{ref}</div>
            <div className="mt-2 text-ink-500">Date of issue</div>
            <div className="font-semibold">{today}</div>
          </div>
        </div>

        {/* Boxes */}
        <Box n="1" label="Exporter (name, address, country)">
          <strong>{sp.exporter || "—"}</strong>
          <br />
          {sp.exporterAddr || "—"}
          <br />
          {origin?.name}
        </Box>

        <Box n="2" label="Consignee (name, address, country)">
          <strong>{sp.consignee || "—"}</strong>
          <br />
          {sp.consigneeAddr || "—"}
          <br />
          {dest?.name}
        </Box>

        <div className="grid grid-cols-2">
          <Box n="3" label="Country of origin" half>
            <strong>{origin?.name}</strong>
            <div className="text-xs text-ink-500">ISO {origin?.code}</div>
          </Box>
          <Box n="4" label="Country of destination" half>
            <strong>{dest?.name}</strong>
            <div className="text-xs text-ink-500">ISO {dest?.code}</div>
          </Box>
        </div>

        <Box n="5" label="Description of goods, HS code, marks & numbers">
          <table className="w-full text-xs">
            <thead className="border-b border-ink-300 text-left text-[10px] uppercase tracking-wide text-ink-500">
              <tr>
                <th className="py-1">HS code</th>
                <th className="py-1">Description</th>
                <th className="py-1 text-right">Quantity</th>
                <th className="py-1 text-right">FOB value (USD)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2 align-top font-mono">{sp.hs || "—"}</td>
                <td className="py-2 align-top">{sp.desc || "—"}</td>
                <td className="py-2 text-right align-top font-mono">{sp.qty || "—"}</td>
                <td className="py-2 text-right align-top font-mono">
                  {sp.value ? `$${Number(sp.value).toLocaleString()}` : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </Box>

        <Box n="6" label="Origin criterion (per Annex 2 / Annex 4)">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>☑ Wholly obtained (Article 5)</div>
            <div>☐ Substantial transformation (Article 6)</div>
            <div>☐ Change of tariff heading (CTH)</div>
            <div>☐ Regional value content ≥ 40%</div>
          </div>
        </Box>

        <Box n="7" label="Preferential tariff rate applicable">
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <div className="text-ink-500">MFN rate</div>
              <div className="font-mono font-semibold">{sp.mfn ?? "—"}%</div>
            </div>
            <div>
              <div className="text-ink-500">AfCFTA preferential rate</div>
              <div className="font-mono font-semibold text-savanna-700">{sp.afcfta ?? "—"}%</div>
            </div>
            <div>
              <div className="text-ink-500">Saving</div>
              <div className="font-mono font-semibold text-terracotta-700">
                {sp.mfn && sp.afcfta
                  ? `${(Number(sp.mfn) - Number(sp.afcfta)).toFixed(1)} pp`
                  : "—"}
              </div>
            </div>
          </div>
        </Box>

        <Box n="8" label="Declaration by the exporter">
          <p className="text-xs leading-relaxed">
            I, the undersigned, declare that the goods described above were produced in{" "}
            <strong>{origin?.name}</strong> and that they comply with the origin requirements
            specified for these goods under the AfCFTA Protocol on Trade in Goods.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="border-b border-ink-400 pb-1">&nbsp;</div>
              <div className="mt-1 text-ink-500">Place &amp; date</div>
            </div>
            <div>
              <div className="border-b border-ink-400 pb-1">&nbsp;</div>
              <div className="mt-1 text-ink-500">Signature &amp; stamp</div>
            </div>
          </div>
        </Box>

        <Box n="9" label="Certification by the competent authority">
          <p className="text-xs leading-relaxed text-ink-600">
            It is hereby certified, on the basis of the control carried out, that the declaration
            by the exporter is correct and that the goods qualify as originating in the meaning
            of the AfCFTA Rules of Origin.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-xs">
            <div>
              <div className="border-b border-ink-400 pb-1">&nbsp;</div>
              <div className="mt-1 text-ink-500">Authority &amp; date</div>
            </div>
            <div>
              <div className="border-b border-ink-400 pb-1">&nbsp;</div>
              <div className="mt-1 text-ink-500">Official stamp</div>
            </div>
          </div>
        </Box>

        <div className="mt-6 border-t-2 border-ink-900 pt-2 text-center text-[10px] text-ink-500">
          Generated by Sokoni AfriOrigin · sokoni.africa · Reference {ref} · Issued{" "}
          {today}
          <br />
          This e-certificate is valid under Article 6 of the AfCFTA Digital Trade Protocol (2025).
        </div>
      </div>
    </div>
  );
}

function Box({
  n,
  label,
  children,
  half
}: {
  n: string;
  label: string;
  children: React.ReactNode;
  half?: boolean;
}) {
  return (
    <div
      className={`border-b border-ink-400 px-3 py-3 ${
        half ? "border-r last:border-r-0" : ""
      } last:border-b-0`}
    >
      <div className="text-[10px] font-semibold uppercase tracking-wider text-ink-500">
        Box {n} · {label}
      </div>
      <div className="mt-1 text-sm text-ink-900">{children}</div>
    </div>
  );
}
