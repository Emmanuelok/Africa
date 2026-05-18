import { Document, Page, View, Text, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { getCountry } from "@/lib/data/countries";

// AfCFTA Certificate of Origin — Annex II Appendix I format.
// Server-only. Returns a PDF Buffer suitable for streaming or storage.

export type CertificateData = {
  reference: string;
  issuedAt: string; // ISO
  hsCode: string;
  productDescription: string;
  originCountry: string;
  destinationCountry: string;
  exporter: { name: string; address?: string; registration?: string };
  consignee: { name: string; address?: string };
  shipment: { quantity?: number; unit?: string; fobValueUsd?: number };
  originCriterion: string; // e.g. "Wholly Obtained (Article 5)"
  preferentialRate?: number;
  endorsedByAuthority?: boolean;
};

const colors = {
  ink: "#0f0f0e",
  inkMuted: "#444440",
  inkSubtle: "#85857d",
  border: "#d1d1cd",
  terracotta: "#b8401f",
  sand: "#fbf8f1",
  savanna: "#3f6b3f"
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: colors.ink
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: colors.terracotta,
    marginBottom: 14
  },
  logo: { fontSize: 18, fontWeight: 700 },
  logoDot: { color: colors.terracotta },
  title: { fontSize: 12, fontWeight: 700, color: colors.inkMuted },
  refBox: {
    alignItems: "flex-end"
  },
  ref: { fontFamily: "Courier", fontSize: 11, fontWeight: 700, color: colors.terracotta },
  issued: { fontSize: 8, color: colors.inkSubtle, marginTop: 2 },
  bannerTitle: {
    fontSize: 14,
    fontWeight: 700,
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.3
  },
  bannerSub: {
    fontSize: 9,
    textAlign: "center",
    color: colors.inkSubtle,
    marginBottom: 14
  },
  row: { flexDirection: "row", marginBottom: 8 },
  cell: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    minHeight: 56
  },
  cellFull: { flex: 1 },
  cellHalf: { flex: 1, marginRight: 8 },
  cellHalfLast: { flex: 1 },
  boxNum: {
    fontSize: 7,
    color: colors.inkSubtle,
    fontWeight: 700,
    marginBottom: 3,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  fieldLabel: { fontSize: 8, color: colors.inkSubtle, marginTop: 2 },
  fieldValue: { fontSize: 10, color: colors.ink, marginTop: 1 },
  fieldValueLarge: { fontSize: 11, fontWeight: 700, color: colors.ink },
  fieldValueMono: { fontFamily: "Courier", fontSize: 10, color: colors.ink },
  descBox: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 8,
    minHeight: 80,
    marginBottom: 8
  },
  declarationBox: {
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    marginTop: 8,
    minHeight: 90
  },
  declarationText: { fontSize: 9, lineHeight: 1.4, color: colors.inkMuted },
  sigLine: {
    borderTopWidth: 1,
    borderTopColor: colors.ink,
    marginTop: 28,
    paddingTop: 4,
    fontSize: 8,
    color: colors.inkSubtle
  },
  authBox: {
    flexDirection: "row"
  },
  authCell: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
    minHeight: 100
  },
  endorseStamp: {
    marginTop: 12,
    padding: 8,
    borderWidth: 2,
    borderColor: colors.savanna,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center"
  },
  endorseStampText: { color: colors.savanna, fontWeight: 700, fontSize: 11 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    fontSize: 7,
    color: colors.inkSubtle,
    flexDirection: "row",
    justifyContent: "space-between"
  }
});

function countryName(iso: string): string {
  return getCountry(iso)?.name ?? iso;
}

export function CertificatePDF({ data }: { data: CertificateData }) {
  const issueDate = new Date(data.issuedAt).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  return (
    <Document
      title={`Certificate of Origin ${data.reference}`}
      author="Sokoni"
      subject="AfCFTA Certificate of Origin"
      keywords="AfCFTA, Certificate of Origin, intra-African trade"
    >
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>
              Sokoni<Text style={styles.logoDot}>.</Text>
            </Text>
            <Text style={styles.title}>AfCFTA Certificate of Origin</Text>
          </View>
          <View style={styles.refBox}>
            <Text style={styles.ref}>{data.reference}</Text>
            <Text style={styles.issued}>Issued {issueDate}</Text>
          </View>
        </View>

        <Text style={styles.bannerTitle}>
          AFRICAN CONTINENTAL FREE TRADE AREA
        </Text>
        <Text style={styles.bannerSub}>
          Certificate of Origin · Annex II, Appendix I to the Protocol on Trade in Goods
        </Text>

        {/* Box 1 & 2: Exporter / Consignee */}
        <View style={styles.row}>
          <View style={[styles.cell, styles.cellHalf]}>
            <Text style={styles.boxNum}>1. Exporter (name, address, country)</Text>
            <Text style={styles.fieldValueLarge}>{data.exporter.name}</Text>
            {data.exporter.address && (
              <Text style={styles.fieldValue}>{data.exporter.address}</Text>
            )}
            <Text style={styles.fieldLabel}>Country: {countryName(data.originCountry)}</Text>
            {data.exporter.registration && (
              <Text style={styles.fieldLabel}>Reg #: {data.exporter.registration}</Text>
            )}
          </View>
          <View style={[styles.cell, styles.cellHalfLast]}>
            <Text style={styles.boxNum}>2. Consignee (name, address, country)</Text>
            <Text style={styles.fieldValueLarge}>{data.consignee.name}</Text>
            {data.consignee.address && (
              <Text style={styles.fieldValue}>{data.consignee.address}</Text>
            )}
            <Text style={styles.fieldLabel}>Country: {countryName(data.destinationCountry)}</Text>
          </View>
        </View>

        {/* Box 3 & 4: Country of origin / destination */}
        <View style={styles.row}>
          <View style={[styles.cell, styles.cellHalf]}>
            <Text style={styles.boxNum}>3. Country of origin</Text>
            <Text style={styles.fieldValueLarge}>{countryName(data.originCountry)}</Text>
            <Text style={styles.fieldLabel}>ISO 3166-1: {data.originCountry}</Text>
          </View>
          <View style={[styles.cell, styles.cellHalfLast]}>
            <Text style={styles.boxNum}>4. Country of destination</Text>
            <Text style={styles.fieldValueLarge}>{countryName(data.destinationCountry)}</Text>
            <Text style={styles.fieldLabel}>ISO 3166-1: {data.destinationCountry}</Text>
          </View>
        </View>

        {/* Box 5: Description */}
        <View style={styles.descBox}>
          <Text style={styles.boxNum}>5. Description of goods · HS code · marks · quantity · value</Text>
          <View style={{ flexDirection: "row", marginTop: 4 }}>
            <View style={{ flex: 3, paddingRight: 8 }}>
              <Text style={styles.fieldLabel}>Description</Text>
              <Text style={[styles.fieldValue, { marginBottom: 6 }]}>
                {data.productDescription}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>HS Code</Text>
              <Text style={styles.fieldValueMono}>{data.hsCode}</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Quantity</Text>
              <Text style={styles.fieldValue}>
                {data.shipment.quantity?.toLocaleString() ?? "—"} {data.shipment.unit ?? ""}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>FOB value (USD)</Text>
              <Text style={styles.fieldValue}>
                {data.shipment.fobValueUsd != null
                  ? `$${data.shipment.fobValueUsd.toLocaleString()}`
                  : "—"}
              </Text>
            </View>
          </View>
        </View>

        {/* Box 6 & 7: Origin criterion & rate */}
        <View style={styles.row}>
          <View style={[styles.cell, styles.cellHalf, { minHeight: 50 }]}>
            <Text style={styles.boxNum}>6. Origin criterion</Text>
            <Text style={styles.fieldValueLarge}>{data.originCriterion}</Text>
          </View>
          <View style={[styles.cell, styles.cellHalfLast, { minHeight: 50 }]}>
            <Text style={styles.boxNum}>7. Preferential tariff rate</Text>
            <Text style={styles.fieldValueLarge}>
              {data.preferentialRate != null ? `${data.preferentialRate}%` : "—"}
            </Text>
            <Text style={styles.fieldLabel}>AfCFTA preferential</Text>
          </View>
        </View>

        {/* Box 8 & 9: Declaration / Endorsement */}
        <View style={styles.authBox}>
          <View style={[styles.authCell, { marginRight: 8 }]}>
            <Text style={styles.boxNum}>8. Exporter declaration</Text>
            <Text style={styles.declarationText}>
              The undersigned hereby declares that the goods described above meet the conditions
              required for the issue of this certificate; that the country of origin of the goods
              is as shown; and that the goods comply with the origin requirements specified in the
              AfCFTA Rules of Origin (Annex II to the Protocol on Trade in Goods).
            </Text>
            <View style={styles.sigLine}>
              <Text>Authorised signature · Place and date</Text>
            </View>
          </View>
          <View style={styles.authCell}>
            <Text style={styles.boxNum}>9. Certification by competent authority</Text>
            <Text style={styles.declarationText}>
              The undersigned hereby certifies that the declaration by the exporter is correct,
              based on documentary evidence submitted.
            </Text>
            {data.endorsedByAuthority && (
              <View style={styles.endorseStamp}>
                <Text style={styles.endorseStampText}>ELECTRONICALLY ENDORSED</Text>
                <Text style={[styles.fieldLabel, { color: colors.savanna }]}>
                  AU Digital Trade Protocol (2025), Article 6
                </Text>
              </View>
            )}
            <View style={styles.sigLine}>
              <Text>Stamp, signature · Place and date</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Generated by Sokoni · sokoni.africa · Ref {data.reference}</Text>
          <Text>Issued {issueDate} · Page 1 of 1</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderCertificatePdf(data: CertificateData): Promise<Buffer> {
  return await renderToBuffer(<CertificatePDF data={data} />);
}
