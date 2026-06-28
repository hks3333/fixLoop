'use client';
import { AgentState } from '@/lib/types';

interface Props {
  name: string;
  role: string;
  state: AgentState;
  outputSummary?: string;
}

export default function AgentCard({ name, role, state, outputSummary }: Props) {
  const statusColor = {
    idle: 'bg-gray-300',
    running: 'bg-yellow-400 animate-pulse',
    done: 'bg-green-500',
    error: 'bg-red-500',
  }[state.status];

  const duration = state.startedAt && state.completedAt
    ? `${((state.completedAt - state.startedAt) / 1000).toFixed(1)}s` 
    : null;

  return (
    <div className={`border rounded-xl p-4 transition-all duration-300 ${state.status === 'running' ? 'border-yellow-400 bg-yellow-50' : state.status === 'done' ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-3 h-3 rounded-full ${statusColor}`} />
        <div className="flex-1">
          <div className="font-semibold text-sm">{name}</div>
          <div className="text-xs text-gray-500">{role}</div>
        </div>
        {duration && <div className="text-xs text-gray-400 font-mono">{duration}</div>}
      </div>
      {outputSummary && state.status === 'done' && (
        <div className="mt-3 text-sm bg-white rounded-lg p-3 border border-gray-100 font-mono text-gray-700 whitespace-pre-wrap text-xs">
          {outputSummary}
        </div>
      )}
    </div>
  );
}
