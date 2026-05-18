"use client";

import { Printer } from "lucide-react";

export function PrintBar() {
  return (
    <div className="no-print mx-auto mb-6 flex max-w-3xl items-center justify-between">
      <a href="/afriorigin" className="text-sm text-ink-600 hover:text-terracotta-700">
        ← Back to wizard
      </a>
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-lg bg-terracotta-600 px-4 py-2 text-sm font-medium text-white hover:bg-terracotta-700"
      >
        <Printer className="h-4 w-4" /> Print / Save as PDF
      </button>
    </div>
  );
}
