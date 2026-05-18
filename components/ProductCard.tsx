import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ShieldCheck } from "lucide-react";
import { type Product } from "@/lib/data/products";
import { getSupplier } from "@/lib/data/suppliers";
import { getCountry } from "@/lib/data/countries";
import { lookupTariff } from "@/lib/data/tariffs";
import { formatCurrency } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const supplier = getSupplier(product.supplierId);
  const origin = getCountry(product.origin);
  const tariff = lookupTariff(product.hsCode);

  return (
    <Link href={`/marketplace/${product.id}`} className="block">
      <Card className="lift h-full">
        <div className="flex items-start justify-between gap-4">
          <div className="grid h-14 w-14 place-items-center rounded-xl bg-sand-50 text-3xl">
            {product.image}
          </div>
          {tariff && tariff.afcftaRate < tariff.mfnRate && (
            <Badge tone="savanna">
              AfCFTA −{(tariff.mfnRate - tariff.afcftaRate).toFixed(1)}pp
            </Badge>
          )}
        </div>

        <div className="mt-4">
          <div className="text-xs uppercase tracking-wide text-ink-500">{product.category}</div>
          <h3 className="mt-1 line-clamp-2 font-semibold leading-snug">{product.name}</h3>
        </div>

        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-lg font-semibold">{formatCurrency(product.pricePerUnit, product.currency)}</span>
          <span className="text-sm text-ink-500">/ {product.unit}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {product.tags.slice(0, 2).map((t) => (
            <Badge key={t} tone="sand">{t}</Badge>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-ink-100 pt-4 text-xs text-ink-600">
          <span className="flex items-center gap-1.5">
            {origin?.flag} {origin?.name}
          </span>
          {supplier?.verified && (
            <span className="flex items-center gap-1 text-savanna-700">
              <ShieldCheck className="h-3.5 w-3.5" /> {supplier.kybLevel} KYB
            </span>
          )}
        </div>
      </Card>
    </Link>
  );
}
