// Shared client types for the agents console. Mirror the API route payloads.

export type AgentTemplate = {
  kind: string;
  name: string;
  shortDescription: string;
  longDescription: string;
  tools: string[];
  triggers: Array<{ kind: string; defaultCron?: string; event?: string }>;
  defaults: {
    schedule?: string;
    eventTrigger?: string;
    autoApproveThresholdUsd?: number;
    maxSteps?: number;
    maxTokens?: number;
  };
  icon: string;
};

export type Agent = {
  id: string;
  kind: string;
  name: string;
  description: string | null;
  enabled: boolean;
  schedule: string | null;
  eventTrigger: string | null;
  autoApproveThresholdUsd: number | null;
  maxSteps: number;
  maxTokens: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  createdAt: string;
  template: AgentTemplate | null;
};

export type RunSummary = {
  id: string;
  agentId: string;
  status: string;
  triggeredBy: string;
  goal: string | null;
  summary: string | null;
  error: string | null;
  stepCount: number;
  inputTokens: number;
  outputTokens: number;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
};

export type Step = {
  id: string;
  idx: number;
  kind: string;
  name: string | null;
  input: unknown;
  output: unknown;
  durationMs: number | null;
  error: string | null;
  createdAt: string;
};

export type Approval = {
  id: string;
  runId: string;
  question: string;
  payload: unknown;
  toolName: string | null;
  createdAt: string;
};
