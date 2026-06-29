'use client';
import type { PipelineReport } from '@/lib/types';

interface AgentTimelineProps {
  timings: { [agent: string]: number };
}

const AGENT_ROLES: Record<string, { name: string; color: string; icon: string }> = {
  A: { name: 'Visual QA', color: '#6366f1', icon: '👁' },
  B: { name: 'Root Cause', color: '#8b5cf6', icon: '🔍' },
  C: { name: 'Fix Gen', color: '#06b6d4', icon: '⚡' },
  D: { name: 'Verify', color: '#34d399', icon: '✓' },
};

export default function AgentTimeline({ timings }: AgentTimelineProps) {
  const entries = Object.entries(timings).filter(([, ms]) => ms > 0);
  if (entries.length === 0) return null;

  const totalMs = entries.reduce((sum, [, ms]) => sum + ms, 0);
  const maxMs = Math.max(...entries.map(([, ms]) => ms));

  return (
    <div>
      <h4 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Agent Timings · {(totalMs / 1000).toFixed(1)}s total
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {entries.map(([agent, ms]) => {
          const cfg = AGENT_ROLES[agent] || { name: `Agent ${agent}`, color: '#6366f1', icon: '•' };
          const pct = (ms / Math.max(maxMs, 1)) * 100;

          return (
            <div key={agent} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 26, height: 26,
                borderRadius: 6,
                background: `${cfg.color}20`,
                border: `1px solid ${cfg.color}40`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, flexShrink: 0,
              }}>
                {cfg.icon}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', width: 70, flexShrink: 0 }}>
                {cfg.name}
              </div>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}aa)`,
                  borderRadius: 3,
                  transition: 'width 0.6s ease-out',
                }} />
              </div>
              <div style={{
                fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
                width: 45, textAlign: 'right', flexShrink: 0,
              }}>
                {(ms / 1000).toFixed(1)}s
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
