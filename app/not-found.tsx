import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="bg-pattern">
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center md:px-6">
        <div className="font-display text-7xl font-semibold text-terracotta-700">404</div>
        <h1 className="mt-4 font-display text-2xl font-semibold">
          That page isn&apos;t on the trade route.
        </h1>
        <p className="mt-2 text-ink-600">
          Head back to the marketplace, or check the toolkit if you were looking up tariffs.
        </p>
        <div className="mt-6 flex gap-2">
          <Button href="/">Home</Button>
          <Button href="/marketplace" variant="outline">Marketplace</Button>
        </div>
      </div>
    </div>
  );
}
