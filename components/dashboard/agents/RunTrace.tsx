"use client";

import { useState } from "react";
import {
  MessageSquare,
  Wrench,
  CornerDownRight,
  ShieldQuestion,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunSummary, Step } from "./types";

const STATUS_TONE: Record<string, string> = {
  queued: "text-ink-500",
  running: "text-blue-600",
  awaiting_approval: "text-amber-600",
  succeeded: "text-green-600",
  failed: "text-red-600",
  cancelled: "text-ink-500"
};

function StepIcon({ kind, error }: { kind: string; error: string | null }) {
  const cls = "h-3.5 w-3.5";
  if (error) return <XCircle className={cn(cls, "text-red-500")} />;
  switch (kind) {
    case "llm_text":
      return <MessageSquare className={cn(cls, "text-ink-500")} />;
    case "tool_call":
      return <Wrench className={cn(cls, "text-blue-500")} />;
    case "tool_result":
      return <CornerDownRight className={cn(cls, "text-green-600")} />;
    case "approval_request":
      return <ShieldQuestion className={cn(cls, "text-amber-500")} />;
    case "approval_resolved":
      return <CheckCircle2 className={cn(cls, "text-green-600")} />;
    default:
      return <CornerDownRight className={cls} />;
  }
}

function StepRow({ step }: { step: Step }) {
  const [open, setOpen] = useState(false);
  const hasDetail = step.input != null || step.output != null || step.error;

  const label =
    step.kind === "llm_text"
      ? "Reasoning"
      : step.kind === "tool_call"
        ? `Calling ${step.name}`
        : step.kind === "tool_result"
          ? `Result from ${step.name}`
          : step.kind === "approval_request"
            ? `Approval requested${step.name && step.name !== "request_approval" ? ` · ${step.name}` : ""}`
            : step.kind === "approval_resolved"
              ? "Approval resolved"
              : step.kind;

  const text =
    step.kind === "llm_text" && step.output && typeof step.output === "object"
      ? String((step.output as { text?: string }).text ?? "")
      : null;

  return (
    <li className="relative pl-6">
      <span className="absolute left-[7px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-white">
        <StepIcon kind={step.kind} error={step.error} />
      </span>
      <button
        type="button"
        onClick={() => hasDetail && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-1.5 py-1 text-left text-sm",
          hasDetail ? "cursor-pointer hover:text-ink-900" : "cursor-default"
        )}
      >
        <span className="font-medium text-ink-800">{label}</span>
        {step.durationMs != null && (
          <span className="text-xs text-ink-400">{step.durationMs}ms</span>
        )}
        {hasDetail && (
          <ChevronRight className={cn("ml-auto h-3.5 w-3.5 text-ink-400 transition-transform", open && "rotate-90")} />
        )}
      </button>

      {text && !open && <p className="mb-1 line-clamp-2 text-xs text-ink-600">{text}</p>}

      {open && hasDetail && (
        <div className="mb-2 space-y-1.5">
          {step.error && (
            <pre className="overflow-x-auto rounded-lg bg-red-50 p-2 text-xs text-red-700">{step.error}</pre>
          )}
          {step.input != null && (
            <pre className="overflow-x-auto rounded-lg bg-ink-50 p-2 text-[11px] leading-relaxed text-ink-700">
              {JSON.stringify(step.input, null, 2)}
            </pre>
          )}
          {step.output != null && (
            <pre className="overflow-x-auto rounded-lg bg-ink-50 p-2 text-[11px] leading-relaxed text-ink-700">
              {JSON.stringify(step.output, null, 2)}
            </pre>
          )}
        </div>
      )}
    </li>
  );
}

export function RunTrace({ run, steps }: { run: RunSummary | null; steps: Step[] }) {
  if (!run) return null;
  const running = run.status === "running" || run.status === "queued";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className={cn("inline-flex items-center gap-1 font-semibold capitalize", STATUS_TONE[run.status] ?? "text-ink-600")}>
          {running && <Loader2 className="h-3 w-3 animate-spin" />}
          {run.status.replace("_", " ")}
        </span>
        <span className="text-ink-400">·</span>
        <span className="text-ink-500">{run.stepCount} steps</span>
        <span className="text-ink-400">·</span>
        <span className="text-ink-500">
          {(run.inputTokens + run.outputTokens).toLocaleString()} tokens
        </span>
        <span className="text-ink-400">·</span>
        <span className="capitalize text-ink-500">{run.triggeredBy}</span>
      </div>

      {run.goal && (
        <p className="rounded-lg bg-sand-50 px-3 py-2 text-xs text-ink-700">
          <span className="font-medium text-ink-800">Goal:</span> {run.goal}
        </p>
      )}

      <ol className="relative space-y-0.5 border-l border-ink-200">
        {steps.length === 0 && (
          <li className="py-3 pl-6 text-sm text-ink-500">
            {running ? "Working…" : "No steps recorded."}
          </li>
        )}
        {steps.map((s) => (
          <StepRow key={s.id} step={s} />
        ))}
      </ol>

      {run.summary && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-900">
          <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-green-700">Summary</div>
          {run.summary}
        </div>
      )}
      {run.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          <div className="mb-0.5 text-xs font-semibold uppercase tracking-wide text-red-700">Error</div>
          {run.error}
        </div>
      )}
    </div>
  );
}
