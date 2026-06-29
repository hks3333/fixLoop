'use client';
import { useState, useEffect } from 'react';
import PRReportCard from '@/components/PRReportCard';
import GitHubComment from '@/components/GitHubComment';
import type { PipelineReport } from '@/lib/types';

export default function PRReportPageClient({ prNumber }: { prNumber: number }) {
  const [report, setReport] = useState<PipelineReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'report' | 'comment'>('report');

  useEffect(() => {
    fetch(`/api/report/${prNumber}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { setReport(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [prNumber]);

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)' }}>
        <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Dashboard</a>
        <span>/</span>
        <span style={{ color: 'var(--text-secondary)' }}>PR #{prNumber}</span>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['report', 'comment'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '7px 16px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: tab === t ? 'rgba(99,102,241,0.5)' : 'var(--border)',
              background: tab === t ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: tab === t ? 'var(--accent-blue-bright)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {t === 'report' ? '📊 Full Report' : '💬 GitHub Comment Preview'}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[120, 80, 200, 80].map((h, i) => (
            <div key={i} className="skeleton" style={{ height: h, borderRadius: 12 }} />
          ))}
        </div>
      )}

      {!loading && !report && (
        <div style={{
          textAlign: 'center', padding: '80px 32px',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-xl)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            Report not found for PR #{prNumber}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            The pipeline may still be running, or this PR has not been analyzed yet.
          </p>
          <a href="/" className="btn btn-ghost" style={{ marginTop: 16, display: 'inline-flex' }}>
            ← Back to Dashboard
          </a>
        </div>
      )}

      {!loading && report && (
        <>
          {tab === 'report' && <PRReportCard report={report} />}
          {tab === 'comment' && <GitHubComment report={report} />}
        </>
      )}
    </div>
  );
}
