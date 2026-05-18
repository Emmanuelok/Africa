import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-ink-950 text-ink-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-5 md:px-6">
        <div className="md:col-span-2">
          <div className="text-xl font-semibold text-white">
            Sokoni<span className="text-terracotta-400">.</span>
          </div>
          <p className="mt-3 max-w-xs text-sm text-ink-300">
            Africa&apos;s trade engine. AfriOrigin is module one of the open TradeOS stack for the
            1.3B-person AfCFTA market.
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold text-white">Product</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/afriorigin" className="hover:text-white">AfriOrigin</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link href="/developers" className="hover:text-white">Developer API</Link></li>
            <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-white">Roadmap</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/marketplace" className="hover:text-white">Marketplace</Link></li>
            <li><Link href="/suppliers" className="hover:text-white">Verified suppliers</Link></li>
            <li><Link href="/commodities" className="hover:text-white">Commodity prices</Link></li>
            <li><Link href="/logistics" className="hover:text-white">Logistics</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-white">Aligned with</div>
          <ul className="mt-3 space-y-2 text-sm text-ink-300">
            <li>AfCFTA Secretariat framework</li>
            <li>PAPSS — pan-African payments</li>
            <li>PACM — pan-African currency marketplace</li>
            <li>ADAPT — Afreximbank trade rails</li>
            <li>AU Digital Trade Protocol (2025)</li>
            <li>WCO HS 2022 nomenclature</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ink-800 px-4 py-6 text-center text-xs text-ink-400 md:px-6">
        © {new Date().getFullYear()} Sokoni — Built for the African Continental Free Trade Area.
      </div>
    </footer>
  );
}
