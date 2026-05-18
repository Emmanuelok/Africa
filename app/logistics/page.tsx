import { Truck, Ship, Train, Plane, ShieldCheck, Star } from "lucide-react";
import { LOGISTICS } from "@/lib/data/logistics";
import { getCountry } from "@/lib/data/countries";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const metadata = { title: "Logistics — Sokoni" };

const ICONS = { Road: Truck, Sea: Ship, Rail: Train, Air: Plane } as const;

export default function LogisticsPage() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-6 md:py-14">
        <Badge tone="terracotta">Logistics</Badge>
        <h1 className="mt-3 font-display text-3xl font-semibold md:text-4xl">
          Corridor-aware freight & customs partners
        </h1>
        <p className="mt-2 max-w-3xl text-ink-600">
          Africa&apos;s road transport eats <strong>29% of the final goods price</strong> versus 7%
          globally. Sokoni matches each shipment to forwarders who actually run the corridor — with
          customs brokerage bundled in.
        </p>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {LOGISTICS.map((l) => {
            const hq = getCountry(l.hq);
            return (
              <Card key={l.id} className="lift">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{l.name}</h3>
                    <div className="mt-1 text-sm text-ink-600">
                      HQ: {hq?.flag} {hq?.name}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Star className="h-4 w-4 text-amber-500" /> {l.rating}
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wide text-ink-500">Corridors</div>
                  <ul className="mt-1 space-y-1 text-sm">
                    {l.corridors.map((c) => (
                      <li key={c} className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-terracotta-500" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {l.modes.map((m) => {
                    const Icon = ICONS[m];
                    return (
                      <span
                        key={m}
                        className="inline-flex items-center gap-1 rounded-full bg-ink-100 px-2 py-0.5 text-xs"
                      >
                        <Icon className="h-3 w-3" /> {m}
                      </span>
                    );
                  })}
                  {l.customsBroker && (
                    <Badge tone="success">
                      <ShieldCheck className="h-3 w-3" /> Customs broker
                    </Badge>
                  )}
                </div>

                <div className="mt-4">
                  <div className="text-xs uppercase tracking-wide text-ink-500">Services</div>
                  <div className="mt-1 text-sm text-ink-700">{l.services.join(" · ")}</div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
