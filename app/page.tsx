'use client';
import { useState, useEffect } from 'react';
import LiveFeed from '@/components/LiveFeed';
import PRReportCard from '@/components/PRReportCard';
import GitHubComment from '@/components/GitHubComment';
import type { PipelineReport } from '@/lib/types';

export default function DashboardPage() {
  const [selectedPR, setSelectedPR] = useState<number | null>(null);
  const [report, setReport] = useState<PipelineReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [tab, setTab] = useState<'report' | 'comment'>('report');

  useEffect(() => {
    if (!selectedPR) { setReport(null); return; }

    setReportLoading(true);
    fetch(`/api/report/${selectedPR}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setReport(data); setReportLoading(false); })
      .catch(() => setReportLoading(false));
  }, [selectedPR]);

  return (
    <div style={{
      height: 'calc(100vh - 52px)',
      display: 'flex',
      overflow: 'hidden',
    }}>
      {/* Left — Live Feed (35%) */}
      <div style={{
        width: '35%',
        minWidth: 300,
        maxWidth: 420,
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
      }}>
        <LiveFeed onSelectPR={setSelectedPR} selectedPR={selectedPR} />
      </div>

      {/* Right — PR Report (65%) */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!selectedPR && (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 48, textAlign: 'center',
          }}>
            {/* Hero */}
            <div style={{
              width: 80, height: 80, borderRadius: 20,
              background: 'var(--gradient-brand)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, marginBottom: 24,
              boxShadow: 'var(--shadow-glow)',
            }}>🔁</div>
            <h1 style={{
              fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em',
              margin: '0 0 12px', color: 'var(--text-primary)',
            }}>
              FixLoop Dashboard
            </h1>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.7, margin: '0 0 32px' }}>
              Your autonomous deployment guardian. Install the GitHub App on a repository, then open a PR to see the 4-agent analysis pipeline run in real time.
            </p>

            {/* Steps */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
              maxWidth: 640, width: '100%',
            }}>
              {[
                { step: '1', icon: '⚙️', title: 'Create GitHub App', desc: 'Register at github.com/settings/apps/new with the webhook URL below' },
                { step: '2', icon: '📷', title: 'Capture Baseline', desc: 'Set TARGET_PRODUCTION_URL and click Recapture Baseline in the Baselines tab' },
                { step: '3', icon: '🚀', title: 'Open a PR', desc: 'Make a CSS change in your repo — FixLoop analyzes it and posts a report' },
              ].map(s => (
                <div key={s.step} className="card" style={{ padding: 20, textAlign: 'left' }}>
                  <div style={{ fontSize: 24, marginBottom: 10 }}>{s.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-blue-bright)', marginBottom: 4 }}>STEP {s.step}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>{s.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              ))}
            </div>

            {/* Webhook URL box */}
            <div style={{
              marginTop: 32,
              background: 'var(--bg-glass)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 20px',
              maxWidth: 480, width: '100%',
              textAlign: 'left',
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                Webhook URL (paste in GitHub App settings)
              </div>
              <code style={{
                fontFamily: 'var(--font-mono)', fontSize: 13,
                color: 'var(--accent-blue-bright)',
                wordBreak: 'break-all',
              }}>
                {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/webhook
              </code>
            </div>
          </div>
        )}

        {selectedPR && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Tab bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 20px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-surface)',
              flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginRight: 8 }}>
                PR #{selectedPR}
              </span>
              {(['report', 'comment'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  style={{
                    padding: '5px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid',
                    borderColor: tab === t ? 'rgba(99,102,241,0.5)' : 'var(--border)',
                    background: tab === t ? 'rgba(99,102,241,0.15)' : 'transparent',
                    color: tab === t ? 'var(--accent-blue-bright)' : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {t === 'report' ? '📊 Report' : '💬 GitHub Comment'}
                </button>
              ))}
              <a
                href={`/pr/${selectedPR}`}
                style={{
                  marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                Full page ↗
              </a>
            </div>

            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {reportLoading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: 80 + i * 20, borderRadius: 12 }} />
                  ))}
                </div>
              )}

              {!reportLoading && !report && (
                <div style={{
                  textAlign: 'center', padding: 48, color: 'var(--text-muted)',
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                  <div>Pipeline is still running for PR #{selectedPR}…</div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>Refresh in a few seconds</div>
                </div>
              )}

              {!reportLoading && report && (
                <>
                  {tab === 'report' && <PRReportCard report={report} />}
                  {tab === 'comment' && <GitHubComment report={report} />}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
