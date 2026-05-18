import { AfriOriginWizard } from "@/components/AfriOriginWizard";
import { Badge } from "@/components/ui/Badge";
import { ShieldCheck, Sparkles, FileText, Languages } from "lucide-react";

export const metadata = {
  title: "AfriOrigin — AfCFTA Compliance in Seconds — Sokoni",
  description:
    "AI-assisted HS classification, AfCFTA Rules of Origin determination, tariff savings, and Certificate of Origin generation in five languages."
};

export default function AfriOriginPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-6 md:py-14">
        <div className="grid items-end gap-4 md:grid-cols-[1fr_auto]">
          <div>
            <Badge tone="terracotta">AfriOrigin · Sokoni Compliance</Badge>
            <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
              AfCFTA compliance — in 60 seconds, not 60 days.
            </h1>
            <p className="mt-2 max-w-2xl text-ink-700">
              Tell us what you&apos;re shipping. We&apos;ll classify the HS code, check the Rules of
              Origin, calculate your tariff savings, and generate a Certificate of Origin your
              destination customs will accept.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 text-xs text-ink-600">
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 ring-1 ring-ink-200">
            <Sparkles className="h-3.5 w-3.5 text-terracotta-600" /> AI-assisted HS classification
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 ring-1 ring-ink-200">
            <ShieldCheck className="h-3.5 w-3.5 text-savanna-600" /> Plain-language RoO reasoning
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 ring-1 ring-ink-200">
            <FileText className="h-3.5 w-3.5 text-sand-600" /> Customs-ready CoO PDF
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 ring-1 ring-ink-200">
            <Languages className="h-3.5 w-3.5 text-ink-600" /> EN · FR · PT · AR · SW
          </span>
        </div>

        <div className="mt-10">
          <AfriOriginWizard />
        </div>

        <section className="mt-16">
          <h2 className="font-display text-2xl font-semibold">Why this matters</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Mini
              stat="$200-500"
              label="What SMEs pay forwarders per shipment for AfCFTA compliance — often paid blind"
            />
            <Mini
              stat="25 of 54"
              label="AfCFTA states with published tariff schedules SMEs can actually look up"
            />
            <Mini
              stat="#1 cause"
              label="Documentation errors are the leading reason containers are held at African ports"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function Mini({ stat, label }: { stat: string; label: string }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5">
      <div className="font-display text-3xl font-semibold text-terracotta-700">{stat}</div>
      <p className="mt-2 text-sm text-ink-700">{label}</p>
    </div>
  );
}
