'use client';
import type { PipelineReport } from '@/lib/types';

interface GitHubCommentProps {
  report: PipelineReport;
}

export default function GitHubComment({ report }: GitHubCommentProps) {
  const statusEmoji = report.result === 'clean' ? '✅' : report.result === 'fixed' ? '🔧' : '⚠️';

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid #30363d',
      borderRadius: 8,
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontSize: 14,
    }}>
      {/* GitHub comment header */}
      <div style={{
        background: '#161b22',
        borderBottom: '1px solid #30363d',
        padding: '10px 16px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: '50%',
          background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, color: '#fff', fontWeight: 700,
        }}>FL</div>
        <div>
          <span style={{ color: '#e6edf3', fontWeight: 600 }}>fixloop-bot</span>
          <span style={{ color: '#7d8590', marginLeft: 6 }}>commented</span>
        </div>
        <div style={{
          marginLeft: 'auto', background: 'rgba(99,102,241,0.2)', color: '#818cf8',
          border: '1px solid rgba(99,102,241,0.4)', borderRadius: 4,
          padding: '1px 7px', fontSize: 11, fontWeight: 600,
        }}>Bot</div>
      </div>

      {/* Comment body */}
      <div style={{ padding: '16px', color: '#e6edf3', lineHeight: 1.7 }}>
        <h2 style={{ margin: '0 0 4px', fontSize: 18, color: '#e6edf3', borderBottom: '1px solid #30363d', paddingBottom: 8 }}>
          {statusEmoji} FixLoop Report
        </h2>
        <p style={{ margin: '8px 0 16px', color: '#7d8590', fontSize: 13 }}>
          {report.result === 'clean' ? 'No regressions detected' : report.result === 'fixed' ? 'Regression detected and auto-fixed' : 'Regression detected — needs human review'}
          {' · '}{(report.totalMs / 1000).toFixed(1)}s · Powered by Cerebras Gemma 4
        </p>

        {/* Routes table */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 15, color: '#e6edf3' }}>
            {report.regressions.length === 0 ? 'All routes clean' : `${report.regressions.length} regression${report.regressions.length !== 1 ? 's' : ''} found`}
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {['Route', 'Viewports', 'Pixel diff', 'Status'].map(h => (
                  <th key={h} style={{
                    textAlign: 'left', padding: '6px 8px',
                    background: '#161b22', color: '#7d8590',
                    borderBottom: '1px solid #30363d', fontWeight: 600,
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.routesSummary.map(r => (
                <tr key={r.route} style={{ borderBottom: '1px solid #21262d' }}>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: '#79c0ff' }}>{r.route}</td>
                  <td style={{ padding: '6px 8px', color: '#7d8590' }}>{r.viewports.join(', ')}</td>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', color: r.maxPixelDiff > 0.02 ? '#f97316' : '#7d8590' }}>
                    {(r.maxPixelDiff * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '6px 8px', color: r.maxPixelDiff > 0.02 ? '#f87171' : '#3fb950' }}>
                    {r.maxPixelDiff > 0.02 ? '⚠️ Flagged' : '✅ Clean'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {report.fixPRUrl && (
          <div style={{
            background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: 6, padding: '10px 14px', marginBottom: 16,
          }}>
            <strong>🔧 Fix PR opened automatically: </strong>
            <a href={report.fixPRUrl} style={{ color: '#79c0ff' }}>{report.fixPRUrl}</a>
          </div>
        )}

        <div style={{ borderTop: '1px solid #30363d', paddingTop: 10, color: '#7d8590', fontSize: 12 }}>
          <em>FixLoop · View full report at /pr/{report.prNumber}</em>
        </div>
      </div>
    </div>
  );
}
