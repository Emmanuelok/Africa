import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-ink-200 bg-ink-950 text-ink-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-4 md:px-6">
        <div>
          <div className="text-xl font-semibold text-white">
            Sokoni<span className="text-terracotta-400">.</span>
          </div>
          <p className="mt-3 text-sm text-ink-300">
            Africa&apos;s trade engine. One platform for the 1.3B-person AfCFTA market.
          </p>
        </div>

        <div>
          <div className="text-sm font-semibold text-white">Platform</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/marketplace" className="hover:text-white">Marketplace</Link></li>
            <li><Link href="/suppliers" className="hover:text-white">Verified Suppliers</Link></li>
            <li><Link href="/commodities" className="hover:text-white">Commodity Prices</Link></li>
            <li><Link href="/logistics" className="hover:text-white">Logistics</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-white">Resources</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/afcfta" className="hover:text-white">AfCFTA Toolkit</Link></li>
            <li><Link href="/research" className="hover:text-white">Trade Research</Link></li>
            <li><Link href="/afcfta#rules" className="hover:text-white">Rules of Origin</Link></li>
            <li><Link href="/afcfta#tariff" className="hover:text-white">Tariff Calculator</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-white">Aligned with</div>
          <ul className="mt-3 space-y-2 text-sm text-ink-300">
            <li>AfCFTA Secretariat framework</li>
            <li>PAPSS (Pan-African Payments)</li>
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
