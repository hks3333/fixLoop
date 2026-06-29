// ─── Existing demo types (kept for backward compatibility) ────────────────────

export type AgentStatus = 'idle' | 'running' | 'done' | 'error';

export interface AgentState {
  status: AgentStatus;
  output?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface LoopState {
  agentA: AgentState;
  agentB: AgentState;
  agentC: AgentState;
  agentD: AgentState;
  screenshots?: {
    baseline: { desktop: string; mobile: string };
    bugged: { desktop: string; mobile: string };
    fixed: { desktop: string; mobile: string };
  };
  patch?: {
    file: string;
    line: number;
    oldCode: string;
    newCode: string;
    explanation: string;
  };
  result?: 'pass' | 'fixed' | 'escalated';
  totalMs?: number;
}

export interface AgentAOutput {
  regression_found: boolean;
  description: string;
  affected_element: string;
  viewport: string;
  intentional_changes_detected?: string[];
}

export interface AgentBOutput {
  file: string;
  line: number;
  property: string;
  old_value: string;
  new_value: string;
  explanation: string;
  confidence: number;
}

export interface AgentCOutput {
  old_code: string;
  new_code: string;
  line: number;
  explanation: string;
  confidence: number;
}

export interface AgentDOutput {
  regression_resolved: boolean;
  description: string;
}

export interface SSEEvent {
  type: 'agent_start' | 'agent_done' | 'screenshot' | 'patch' | 'result' | 'error';
  agent?: 'A' | 'B' | 'C' | 'D';
  data: unknown;
}

// ─── GitHub App pipeline types ────────────────────────────────────────────────

export interface Regression {
  route: string;
  viewport: string;
  description: string;
  affectedElement: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  businessImpact: string;
  file: string;
  line: number;
  property: string;
  badValue: string;
  correctValue: string;
  patch?: {
    oldCode: string;
    newCode: string;
    explanation: string;
  };
  screenshots: {
    baseline: string;
    current: string;
    diff: string;
    fixed?: string;
  };
}

export interface PerformanceDelta {
  metric: string;
  baseline: number;
  current: number;
}

export interface RouteSummary {
  route: string;
  viewports: string[];
  maxPixelDiff: number;
}

export interface PipelineReport {
  prNumber: number;
  prTitle: string;
  branch: string;
  result: 'clean' | 'fixed' | 'escalated';
  regressions: Regression[];
  intentionalChanges: string[];
  routesSummary: RouteSummary[];
  performanceDeltas: PerformanceDelta[];
  consoleErrors: string[];
  fixPRUrl?: string;
  totalMs: number;
  agentTimings: { [agent: string]: number };
  timestamp: string;
}

export interface WebhookPayload {
  action: string;
  pull_request: {
    number: number;
    title: string;
    body: string;
    head: { ref: string; sha: string };
    base: { ref: string };
  };
  repository: {
    name: string;
    owner: { login: string };
  };
  installation: { id: number };
}

export interface FeedEvent {
  id: string;
  type: string;
  timestamp: string;
  prNumber?: number;
  prTitle?: string;
  branch?: string;
  status?: 'running' | 'clean' | 'fixed' | 'escalated' | 'error';
  data?: unknown;
}

export interface BaselineMeta {
  [viewport: string]: {
    chunkCount: number;
    savedAt: string;
  };
}
