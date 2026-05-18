import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function Card({
  children,
  className
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-ink-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,15,14,0.04)]",
        className
      )}
    >
      {children}
    </div>
  );
}
