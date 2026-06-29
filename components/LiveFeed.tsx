'use client';
import { useState, useEffect, useRef } from 'react';
import type { FeedEvent } from '@/lib/types';

const STATUS_CONFIG = {
  running:   { label: 'Running', dot: 'running', cls: 'badge-running' },
  clean:     { label: 'Clean',   dot: 'clean',   cls: 'badge-clean'   },
  fixed:     { label: 'Fixed',   dot: 'fixed',   cls: 'badge-fixed'   },
  escalated: { label: 'Review',  dot: 'escalated', cls: 'badge-escalated' },
  error:     { label: 'Error',   dot: 'error',   cls: 'badge-error'   },
} as const;

const EVENT_LABELS: Record<string, string> = {
  pr_received: 'PR received',
  pipeline_start: 'Pipeline started',
  screenshotting: 'Screenshotting',
  pixel_diff: 'Pixel diffing',
  triage_done: 'Triage complete',
  agent_start: 'Agent running',
  agent_done: 'Agent done',
  agent_error: 'Agent error',
  fix_pr_opened: 'Fix PR opened',
  fix_pr_error: 'Fix PR failed',
  baseline_capture_started: 'Baseline capture',
  baseline_updated: 'Baseline updated',
  installation: 'App installed',
  pr_merged: 'PR merged',
};

interface LiveFeedProps {
  onSelectPR?: (prNumber: number) => void;
  selectedPR?: number | null;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return `${Math.floor(diff / 3600000)}h ago`;
}

function EventRow({ event, selected, onClick }: {
  event: FeedEvent;
  selected: boolean;
  onClick: () => void;
}) {
  const cfg = STATUS_CONFIG[event.status || 'running'] || STATUS_CONFIG.running;
  const label = EVENT_LABELS[event.type] || event.type.replace(/_/g, ' ');

  return (
    <button
      onClick={onClick}
      className="animate-slide-in"
      style={{
        width: '100%',
        textAlign: 'left',
        background: selected ? 'rgba(99,102,241,0.1)' : 'var(--bg-glass)',
        border: `1px solid ${selected ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '11px 14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        display: 'block',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
        <span className={`pulse-dot ${cfg.dot}`} />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 13, flex: 1 }}>
          {event.prNumber ? `PR #${event.prNumber}` : label}
        </span>
        <span className={`badge ${cfg.cls}`}>{cfg.label}</span>
      </div>

      {event.prTitle && (
        <div style={{
          color: 'var(--text-secondary)', fontSize: 12, marginBottom: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {event.prTitle}
        </div>
      )}

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {event.branch && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)',
            background: 'rgba(255,255,255,0.05)', padding: '1px 6px', borderRadius: 4,
          }}>
            {event.branch}
          </span>
        )}
        <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
          {timeAgo(event.timestamp)}
        </span>
      </div>
    </button>
  );
}

export default function LiveFeed({ onSelectPR, selectedPR }: LiveFeedProps) {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const prevCount = useRef(0);

  useEffect(() => {
    let mounted = true;

    async function poll() {
      try {
        const res = await fetch('/api/report/feed');
        if (!mounted) return;
        const data = await res.json();
        setEvents(data);
        setLoading(false);
        prevCount.current = data.length;
      } catch {
        if (mounted) setLoading(false);
      }
    }

    poll();
    const id = setInterval(poll, 2000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const prEvents = events.filter(e => e.prNumber && e.type === 'pr_received');

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            Live Activity
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="pulse-dot running" style={{ animation: 'pulse-amber 1.4s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Live</span>
          </div>
        </div>
        <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
          {events.length} events · polls every 2s
        </p>
      </div>

      {/* Event list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 76, borderRadius: 10 }} />
            ))}
          </div>
        )}

        {!loading && events.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '48px 16px',
            color: 'var(--text-muted)',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔌</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Waiting for webhooks
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.6 }}>
              Install the GitHub App on a repository and open a PR to see the pipeline in action.
            </div>
          </div>
        )}

        {!loading && events.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {events.map(event => (
              <EventRow
                key={event.id}
                event={event}
                selected={!!(event.prNumber && event.prNumber === selectedPR)}
                onClick={() => {
                  if (event.prNumber) onSelectPR?.(event.prNumber);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Setup tip */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 12px',
          fontSize: 11, color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}>
          <strong style={{ color: 'var(--accent-blue-bright)' }}>Webhook URL:</strong><br />
          <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
            {typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook
          </code>
        </div>
      </div>
    </div>
  );
}
