import { LegalPage } from "@/components/LegalPage";

export const metadata = {
  title: "Data Processing Agreement — Sokoni",
  description:
    "Sokoni's Data Processing Agreement (DPA) for customers subject to GDPR, UK GDPR, POPIA, NDPA, and the Kenya Data Protection Act."
};

export default function DpaPage() {
  return (
    <LegalPage eyebrow="Legal" title="Data Processing Agreement" lastUpdated="13 June 2026">
      <p>
        This Data Processing Agreement (&ldquo;DPA&rdquo;) forms part of the agreement between
        Sokoni Holdings Ltd (&ldquo;Sokoni&rdquo;, the &ldquo;Processor&rdquo;) and the customer
        (the &ldquo;Controller&rdquo;) that has accepted Sokoni&apos;s{" "}
        <a href="/terms">Terms of Service</a>. It governs Sokoni&apos;s processing of personal data
        on the Controller&apos;s behalf and applies where the GDPR, UK GDPR, POPIA (South Africa),
        the NDPA (Nigeria), or the Kenya Data Protection Act applies.
      </p>
      <p>
        To request a counter-signed copy of this DPA, email{" "}
        <a href="mailto:dpo@sokoni.africa">dpo@sokoni.africa</a> with your legal entity name and
        signatory. We return a signed PDF within 5 business days.
      </p>

      <h2>1. Definitions</h2>
      <p>
        &ldquo;Personal Data&rdquo;, &ldquo;Processing&rdquo;, &ldquo;Controller&rdquo;,
        &ldquo;Processor&rdquo;, &ldquo;Data Subject&rdquo;, and &ldquo;Supervisory Authority&rdquo;
        have the meanings given in the GDPR. &ldquo;Applicable Data Protection Law&rdquo; means all
        privacy and data protection laws applicable to the processing of Personal Data under the
        Agreement.
      </p>

      <h2>2. Roles and scope</h2>
      <p>
        The Controller determines the purposes and means of processing. Sokoni processes Personal
        Data only as a Processor, on documented instructions from the Controller, including with
        regard to international transfers, unless required to do otherwise by law (in which case
        Sokoni notifies the Controller unless prohibited).
      </p>

      <h2>3. Subject matter and nature of processing</h2>
      <ul>
        <li><strong>Subject matter:</strong> provision of the AfriOrigin AfCFTA compliance platform and related services.</li>
        <li><strong>Duration:</strong> the term of the Agreement plus the retention periods set out in our <a href="/privacy">Privacy Policy</a>.</li>
        <li><strong>Nature and purpose:</strong> hosting, classification, origin determination, certificate generation, billing, and support.</li>
        <li><strong>Categories of Data Subjects:</strong> the Controller&apos;s authorised users, and the exporter/consignee contacts named on trade documents.</li>
        <li><strong>Categories of Personal Data:</strong> names, business email addresses, company details, business registration identifiers (KYB), shipment and trade documentation.</li>
        <li><strong>Special categories:</strong> none are required by the service. The Controller must not submit special-category data through free-text fields.</li>
      </ul>

      <h2>4. Sokoni&apos;s obligations</h2>
      <ul>
        <li>Process Personal Data only on documented instructions.</li>
        <li>Ensure persons authorised to process Personal Data are bound by confidentiality.</li>
        <li>Implement the technical and organisational measures described in clause 7.</li>
        <li>Respect the conditions for engaging sub-processors in clause 5.</li>
        <li>Assist the Controller, taking into account the nature of processing, in responding to Data Subject requests (clause 6).</li>
        <li>Assist the Controller with security, breach notification, data protection impact assessments, and prior consultation obligations.</li>
        <li>At the Controller&apos;s choice, delete or return all Personal Data at the end of the service, save where storage is required by law.</li>
        <li>Make available all information necessary to demonstrate compliance and allow for audits (clause 8).</li>
      </ul>

      <h2>5. Sub-processors</h2>
      <p>
        The Controller provides general authorisation for Sokoni to engage sub-processors listed at{" "}
        <a href="/subprocessors">/subprocessors</a>. Sokoni imposes data protection obligations on
        each sub-processor that are no less protective than this DPA, and remains liable for their
        performance. Sokoni gives at least 30 days&apos; notice of additions or replacements (via
        the sub-processors page and, for customers on annual plans, by email), during which the
        Controller may object on reasonable data-protection grounds.
      </p>

      <h2>6. Data Subject rights</h2>
      <p>
        Taking into account the nature of the processing, Sokoni assists the Controller by
        appropriate technical and organisational measures, insofar as possible, to fulfil the
        Controller&apos;s obligation to respond to requests to exercise Data Subject rights
        (access, rectification, erasure, restriction, portability, and objection). Self-service
        export and deletion are available from the dashboard; for anything not covered there, email{" "}
        <a href="mailto:dpo@sokoni.africa">dpo@sokoni.africa</a>.
      </p>

      <h2>7. Security measures</h2>
      <p>
        Sokoni implements and maintains the technical and organisational measures described on the{" "}
        <a href="/security">security page</a>, including encryption in transit (TLS 1.3) and at rest
        (AES-256), least-privilege access controls with MFA, audit logging, network isolation, and
        regular penetration testing. Measures are reviewed and updated to maintain a level of
        security appropriate to the risk.
      </p>

      <h2>8. Audits</h2>
      <p>
        Sokoni makes available SOC 2 reports and security documentation (when finalised — see the
        compliance roadmap on the security page) to satisfy audit obligations. Where a Controller
        requires an on-site audit, the parties agree reasonable scope, timing, and cost in advance,
        no more than once per year except following a confirmed incident.
      </p>

      <h2>9. International transfers</h2>
      <p>
        Personal Data is processed primarily within the African Union (AWS af-south-1, GCP
        africa-south1). Where transfers occur to a country without an adequacy decision, Sokoni
        relies on the EU Standard Contractual Clauses (Module Two: Controller-to-Processor) and the
        UK International Data Transfer Addendum, which are incorporated into this DPA by reference
        and completed with the parties&apos; details and the schedules above. For South Africa,
        Nigeria, and Kenya, transfers rely on the equivalent statutory safeguards.
      </p>

      <h2>10. Personal data breach</h2>
      <p>
        Sokoni notifies the Controller without undue delay, and in any event within 72 hours, after
        becoming aware of a Personal Data breach affecting the Controller&apos;s data, with the
        information reasonably available to assist the Controller&apos;s own notification
        obligations.
      </p>

      <h2>11. Liability and term</h2>
      <p>
        Each party&apos;s liability under this DPA is subject to the limitations of liability in the
        Terms of Service. This DPA takes effect on acceptance of the Terms and continues for as long
        as Sokoni processes Personal Data on the Controller&apos;s behalf.
      </p>

      <h2>12. Contact</h2>
      <p>
        Data protection officer: <a href="mailto:dpo@sokoni.africa">dpo@sokoni.africa</a>. To
        execute a signed DPA, see the note at the top of this page.
      </p>
    </LegalPage>
  );
}
