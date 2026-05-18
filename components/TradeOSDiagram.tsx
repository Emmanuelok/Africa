import {
  Smartphone,
  Store,
  MonitorSmartphone,
  ShieldCheck,
  Compass,
  FileCheck2,
  Wallet,
  Truck,
  Coins,
  Banknote,
  Globe2,
  Building2,
  ArrowDown
} from "lucide-react";

export function TradeOSDiagram() {
  return (
    <div className="rounded-3xl border border-ink-200 bg-white p-6 md:p-10">
      {/* Distribution layer */}
      <Layer label="Distribution layer — meet users where they already are">
        <Box icon={<Smartphone className="h-5 w-5" />} title="Conversational" sub="WhatsApp, social commerce" tone="neutral" />
        <Box icon={<Store className="h-5 w-5" />} title="Marketplaces" sub="Jumia, Afrimart, Matta" tone="neutral" />
        <Box icon={<MonitorSmartphone className="h-5 w-5" />} title="Direct apps" sub="Web, mobile, USSD" tone="neutral" />
      </Layer>

      <Arrow />

      {/* TradeOS core */}
      <div className="rounded-2xl border-2 border-terracotta-300 bg-terracotta-50/30 p-5 md:p-6">
        <h3 className="font-display text-lg font-semibold text-terracotta-900">
          TradeOS — the open stack Sokoni is building
        </h3>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Box icon={<ShieldCheck className="h-5 w-5" />} title="Identity & trust" sub="KYB, reputation, registry" tone="terracotta" badge="Live" />
          <Box icon={<Compass className="h-5 w-5" />} title="Discovery" sub="AI matchmaking" tone="terracotta" badge="Live" />
          <Box icon={<FileCheck2 className="h-5 w-5" />} title="Compliance" sub="AfriOrigin · RoO · customs" tone="terracotta" badge="Hero" />
          <Box icon={<Wallet className="h-5 w-5" />} title="Payments" sub="Escrow, multi-currency" tone="terracotta" badge="Q3 2026" />
          <Box icon={<Truck className="h-5 w-5" />} title="Logistics" sub="Freight, tracking, LCL" tone="terracotta" badge="Q4 2026" />
          <Box icon={<Coins className="h-5 w-5" />} title="Trade finance" sub="Tokenized invoices" tone="terracotta" badge="2027" />
        </div>
      </div>

      <Arrow />

      {/* Public rails */}
      <Layer label="Public rails — institutional infrastructure already being built">
        <Box icon={<Banknote className="h-5 w-5" />} title="PAPSS" sub="Settlement layer" tone="savanna" />
        <Box icon={<Globe2 className="h-5 w-5" />} title="PACM" sub="Currency exchange" tone="savanna" />
        <Box icon={<Building2 className="h-5 w-5" />} title="ADAPT" sub="Trade rails" tone="savanna" />
        <Box icon={<Building2 className="h-5 w-5" />} title="Customs" sub="Border agencies" tone="savanna" />
      </Layer>

      <p className="mt-6 text-xs text-ink-500">
        Compliance is the wedge: own the SME relationship through AfCFTA paperwork, then expand
        into payments, logistics, and trade finance on the same auth, the same data, the same
        verified-business graph.
      </p>
    </div>
  );
}

function Layer({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-ink-50 p-4 md:p-5">
      <div className="text-xs uppercase tracking-wider text-ink-500">{label}</div>
      <div className="mt-3 grid gap-3 md:grid-cols-4">{children}</div>
    </div>
  );
}

function Arrow() {
  return (
    <div className="my-3 flex justify-center">
      <ArrowDown className="h-5 w-5 text-ink-300" />
    </div>
  );
}

function Box({
  icon,
  title,
  sub,
  tone,
  badge
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  tone: "neutral" | "terracotta" | "savanna";
  badge?: string;
}) {
  const tones = {
    neutral: "bg-white border-ink-200 text-ink-800",
    terracotta: "bg-white border-terracotta-200 text-ink-900",
    savanna: "bg-white border-savanna-300 text-ink-800"
  } as const;
  return (
    <div className={`rounded-xl border px-4 py-3 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <div className="text-ink-700">{icon}</div>
        {badge && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
              badge === "Live"
                ? "bg-savanna-100 text-savanna-800"
                : badge === "Hero"
                ? "bg-terracotta-100 text-terracotta-800"
                : "bg-ink-100 text-ink-600"
            }`}
          >
            {badge}
          </span>
        )}
      </div>
      <div className="mt-2 text-sm font-semibold">{title}</div>
      <div className="text-xs text-ink-500">{sub}</div>
    </div>
  );
}
