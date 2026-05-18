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
          <div className="mt-5 flex items-center gap-3 text-xs">
            <Link href="/status" className="inline-flex items-center gap-1.5 rounded-full bg-savanna-950 px-2.5 py-1 text-savanna-300 hover:bg-savanna-900">
              <span className="h-2 w-2 rounded-full bg-savanna-400" /> All systems operational
            </Link>
          </div>
        </div>

        <div>
          <div className="text-sm font-semibold text-white">Product</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/afriorigin" className="hover:text-white">AfriOrigin</Link></li>
            <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
            <li><Link href="/developers" className="hover:text-white">Developer API</Link></li>
            <li><Link href="/commodities" className="hover:text-white">Live Africa Map</Link></li>
            <li><Link href="/changelog" className="hover:text-white">Changelog</Link></li>
            <li><Link href="/status" className="hover:text-white">Status</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-sm font-semibold text-white">Company</div>
          <ul className="mt-3 space-y-2 text-sm">
            <li><Link href="/about" className="hover:text-white">About</Link></li>
            <li><Link href="/research" className="hover:text-white">Research</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/security" className="hover:text-white">Security</Link></li>
            <li><Link href="/terms" className="hover:text-white">Terms</Link></li>
            <li><Link href="/privacy" className="hover:text-white">Privacy</Link></li>
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
        © {new Date().getFullYear()} Sokoni Holdings Ltd — Built for the African Continental Free Trade Area.
      </div>
    </footer>
  );
}
