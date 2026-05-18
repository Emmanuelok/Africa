import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "terracotta" | "savanna" | "sand" | "info" | "success" | "warn";

const tones: Record<Tone, string> = {
  neutral: "bg-ink-100 text-ink-700 border-ink-200",
  terracotta: "bg-terracotta-50 text-terracotta-700 border-terracotta-200",
  savanna: "bg-savanna-50 text-savanna-700 border-savanna-200",
  sand: "bg-sand-50 text-sand-700 border-sand-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warn: "bg-amber-50 text-amber-700 border-amber-200"
};

export function Badge({
  children,
  tone = "neutral",
  className
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
