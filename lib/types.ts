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
