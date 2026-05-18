import Link from "next/link";
import { Info } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 md:px-8">
      <div className="flex items-start gap-2 text-xs text-amber-900">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div>
          <strong>Demo workspace.</strong> You&apos;re seeing example data because no account is
          signed in (or no database is connected). Want to make this yours?{" "}
          <Link href="/signup" className="font-semibold underline">Reserve early access</Link> · or
          read the{" "}
          <Link href="/docs/getting-started" className="font-semibold underline">quickstart</Link>.
        </div>
      </div>
    </div>
  );
}
