'use client';
import type { PipelineReport, Regression } from '@/lib/types';
import AgentTimeline from './AgentTimeline';
import DiffViewer from './DiffViewer';

interface PRReportCardProps {
  report: PipelineReport;
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: '#f87171',
  high: '#fb923c',
  medium: '#fbbf24',
  low: '#34d399',
};

const SEVERITY_BG: Record<string, string> = {
  critical: 'rgba(248,113,113,0.08)',
  high: 'rgba(251,146,60,0.08)',
  medium: 'rgba(251,191,36,0.08)',
  low: 'rgba(52,211,153,0.08)',
};

function RegressionCard({ reg, index }: { reg: Regression; index: number }) {
  return (
    <div style={{
      border: `1px solid ${SEVERITY_COLOR[reg.severity]}33`,
      background: SEVERITY_BG[reg.severity],
      borderRadius: 'var(--radius-md)',
      padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
        <span style={{
          width: 22, height: 22, borderRadius: '50%',
          background: `${SEVERITY_COLOR[reg.severity]}20`,
          border: `1px solid ${SEVERITY_COLOR[reg.severity]}60`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, fontWeight: 800, flexShrink: 0,
          color: SEVERITY_COLOR[reg.severity],
        }}>{index + 1}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
            {reg.description}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
            {reg.affectedElement} · {reg.route} · {reg.viewport}
          </div>
        </div>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
          color: SEVERITY_COLOR[reg.severity], flexShrink: 0,
        }}>{reg.severity}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
        <div style={{
          background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 12px',
          fontSize: 12,
        }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>Root Cause</div>
          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: 11 }}>
            {reg.file}:{reg.line}
          </div>
          <div style={{ color: 'var(--status-escalated)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            {reg.property}: {reg.badValue}
          </div>
        </div>
        <div style={{
          background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 12px',
          fontSize: 12,
        }}>
          <div style={{ color: 'var(--text-muted)', marginBottom: 3 }}>Business Impact</div>
          <div style={{ color: 'var(--text-primary)', fontSize: 12, lineHeight: 1.4 }}>
            {reg.businessImpact}
          </div>
        </div>
      </div>

      {reg.patch && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
            Auto-fix
          </div>
          <div style={{
            background: 'rgba(0,0,0,0.3)', borderRadius: 6, overflow: 'hidden',
            fontFamily: 'var(--font-mono)', fontSize: 11,
          }}>
            <div className="diff-remove" style={{ padding: '3px 12px' }}>- {reg.patch.oldCode.trim()}</div>
            <div className="diff-add" style={{ padding: '3px 12px' }}>+ {reg.patch.newCode.trim()}</div>
          </div>
        </div>
      )}

      {reg.screenshots && (
        <DiffViewer
          baseline={reg.screenshots.baseline}
          current={reg.screenshots.current}
          diff={reg.screenshots.diff}
        />
      )}
    </div>
  );
}

export default function PRReportCard({ report }: PRReportCardProps) {
  const statusColor =
    report.result === 'clean' ? 'var(--status-clean)' :
    report.result === 'fixed' ? 'var(--accent-blue-bright)' : 'var(--status-escalated)';

  const statusLabel =
    report.result === 'clean' ? '✅ No regressions detected' :
    report.result === 'fixed' ? '🔧 Regression auto-fixed' : '⚠️ Needs human review';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div style={{
            width: 44, height: 44,
            borderRadius: 10,
            background: `${statusColor}15`,
            border: `1px solid ${statusColor}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, flexShrink: 0,
          }}>
            {report.result === 'clean' ? '✅' : report.result === 'fixed' ? '🔧' : '⚠️'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
              PR #{report.prNumber} — {report.prTitle}
            </div>
            <div style={{ fontSize: 13, color: statusColor, marginBottom: 8 }}>
              {statusLabel}
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span>⏱ {(report.totalMs / 1000).toFixed(1)}s</span>
              <span>🌿 {report.branch}</span>
              {report.regressions.length > 0 && (
                <span style={{ color: 'var(--status-escalated)' }}>
                  {report.regressions.length} regression{report.regressions.length !== 1 ? 's' : ''}
                </span>
              )}
              {report.fixPRUrl && (
                <a
                  href={report.fixPRUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-blue-bright)', textDecoration: 'none', fontWeight: 600 }}
                >
                  🔧 View Fix PR →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Agent timings */}
      {Object.keys(report.agentTimings).length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <AgentTimeline timings={report.agentTimings} />
        </div>
      )}

      {/* Route summary */}
      <div className="card" style={{ padding: 20 }}>
        <h4 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Routes Checked
        </h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Route', 'Viewports', 'Max Diff', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '6px 10px',
                    color: 'var(--text-muted)', fontWeight: 600, fontSize: 11,
                    borderBottom: '1px solid var(--border)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.routesSummary.map(r => (
                <tr key={r.route}>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: 11 }}>{r.route}</td>
                  <td style={{ padding: '7px 10px', color: 'var(--text-secondary)' }}>{r.viewports.join(', ')}</td>
                  <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: r.maxPixelDiff > 0.02 ? 'var(--status-running)' : 'var(--text-muted)' }}>
                    {(r.maxPixelDiff * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '7px 10px' }}>
                    <span className={`badge ${r.maxPixelDiff > 0.02 ? 'badge-escalated' : 'badge-clean'}`}>
                      {r.maxPixelDiff > 0.02 ? 'Flagged' : 'Clean'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regressions */}
      {report.regressions.length > 0 && (
        <div>
          <h4 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Regressions ({report.regressions.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {report.regressions.map((reg, i) => (
              <RegressionCard key={i} reg={reg} index={i} />
            ))}
          </div>
        </div>
      )}

      {/* Performance */}
      {report.performanceDeltas.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Performance Deltas
          </h4>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Metric', 'Baseline', 'Current', 'Delta'].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '6px 10px',
                      color: 'var(--text-muted)', fontWeight: 600, fontSize: 11,
                      borderBottom: '1px solid var(--border)',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {report.performanceDeltas.map(p => {
                  const delta = p.current - p.baseline;
                  const emoji = delta > 500 ? '🔴' : delta > 200 ? '🟡' : '🟢';
                  return (
                    <tr key={p.metric}>
                      <td style={{ padding: '7px 10px', color: 'var(--text-primary)', fontWeight: 600 }}>{p.metric}</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{p.baseline}ms</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{p.current}ms</td>
                      <td style={{ padding: '7px 10px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                        {emoji} {delta > 0 ? '+' : ''}{delta}ms
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Console errors */}
      {report.consoleErrors.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Console Errors ({report.consoleErrors.length})
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {report.consoleErrors.slice(0, 8).map((err, i) => (
              <div key={i} style={{
                fontFamily: 'var(--font-mono)', fontSize: 11,
                color: 'var(--status-escalated)',
                background: 'rgba(248,113,113,0.05)',
                border: '1px solid rgba(248,113,113,0.15)',
                borderRadius: 4, padding: '4px 8px',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {err}
              </div>
            ))}
            {report.consoleErrors.length > 8 && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: '4px' }}>
                +{report.consoleErrors.length - 8} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Intentional changes */}
      {report.intentionalChanges.length > 0 && (
        <div className="card" style={{ padding: 20 }}>
          <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            ✓ Intentional Changes (preserved)
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {report.intentionalChanges.map((c, i) => (
              <div key={i} style={{
                fontSize: 12, color: 'var(--accent-green)',
                background: 'rgba(52,211,153,0.06)',
                border: '1px solid rgba(52,211,153,0.15)',
                borderRadius: 4, padding: '4px 8px',
              }}>
                ✓ {c}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
