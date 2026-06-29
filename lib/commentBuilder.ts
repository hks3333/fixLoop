import type { PipelineReport } from './types';

export function buildPRComment(report: PipelineReport): string {
  const statusEmoji =
    report.result === 'clean' ? '✅' :
    report.result === 'fixed' ? '🔧' : '⚠️';

  const statusLabel =
    report.result === 'clean' ? 'No regressions detected' :
    report.result === 'fixed' ? 'Regression detected and auto-fixed' :
    'Regression detected — needs human review';

  const lines: string[] = [
    `## ${statusEmoji} FixLoop Report`,
    `**${statusLabel}** · Analyzed in ${(report.totalMs / 1000).toFixed(1)}s · Powered by Cerebras Gemma 4`,
    '',
  ];

  if (report.intentionalChanges.length > 0) {
    lines.push('### ✓ Intentional changes detected (preserved)');
    report.intentionalChanges.forEach(c => lines.push(`- ${c}`));
    lines.push('');
  }

  if (report.regressions.length === 0) {
    lines.push('### All routes clean');
    lines.push('');
    lines.push('| Route | Viewports checked | Pixel diff | Status |');
    lines.push('|-------|-------------------|------------|--------|');
    report.routesSummary.forEach(r => {
      lines.push(
        `| \`${r.route}\` | ${r.viewports.join(', ')} | ${(r.maxPixelDiff * 100).toFixed(1)}% | ✅ Clean |`
      );
    });
  } else {
    lines.push('### Regressions found');
    lines.push('');

    report.regressions.forEach((reg, i) => {
      const severityEmoji =
        reg.severity === 'critical' ? '🔴' :
        reg.severity === 'high' ? '🟠' :
        reg.severity === 'medium' ? '🟡' : '🟢';

      lines.push(`#### ${i + 1}. ${severityEmoji} ${reg.severity.toUpperCase()}: ${reg.description}`);
      lines.push(`- **Route:** \`${reg.route}\` at ${reg.viewport} viewport`);
      lines.push(`- **Element:** ${reg.affectedElement}`);
      lines.push(`- **Business impact:** ${reg.businessImpact}`);
      lines.push(`- **Root cause:** \`${reg.file}:${reg.line}\` — \`${reg.property}: ${reg.badValue}\``);
      lines.push('');

      if (reg.patch) {
        lines.push('**Auto-fix applied:**');
        lines.push('```diff');
        lines.push(`- ${reg.patch.oldCode.trim()}`);
        lines.push(`+ ${reg.patch.newCode.trim()}`);
        lines.push('```');
        lines.push('');
      }
    });

    if (report.fixPRUrl) {
      lines.push('### 🔧 Fix PR opened automatically');
      lines.push(`[View fix PR →](${report.fixPRUrl})`);
      lines.push('');
    }
  }

  if (report.performanceDeltas.length > 0) {
    lines.push('### Performance');
    lines.push('| Metric | Baseline | Current | Delta |');
    lines.push('|--------|----------|---------|-------|');
    report.performanceDeltas.forEach(p => {
      const delta = p.current - p.baseline;
      const emoji = delta > 500 ? '🔴' : delta > 200 ? '🟡' : '🟢';
      lines.push(
        `| ${p.metric} | ${p.baseline}ms | ${p.current}ms | ${emoji} ${delta > 0 ? '+' : ''}${delta}ms |`
      );
    });
    lines.push('');
  }

  if (report.consoleErrors.length > 0) {
    lines.push('### Console errors (new since baseline)');
    report.consoleErrors.slice(0, 10).forEach(e => lines.push(`- \`${e}\``));
    if (report.consoleErrors.length > 10) {
      lines.push(`- *… and ${report.consoleErrors.length - 10} more*`);
    }
    lines.push('');
  }

  // Agent timings
  const timings = Object.entries(report.agentTimings);
  if (timings.length > 0) {
    lines.push('<details>');
    lines.push('<summary>⚡ Agent timings</summary>');
    lines.push('');
    lines.push('| Agent | Role | Time |');
    lines.push('|-------|------|------|');
    const roles: Record<string, string> = {
      A: 'Visual QA', B: 'Root Cause', C: 'Fix Generation', D: 'Verification',
    };
    timings.forEach(([agent, ms]) => {
      lines.push(`| Agent ${agent} | ${roles[agent] || agent} | ${(ms / 1000).toFixed(1)}s |`);
    });
    lines.push('');
    lines.push('</details>');
    lines.push('');
  }

  const appUrl = process.env.APP_URL || 'http://localhost:3000';
  lines.push('---');
  lines.push(`*[FixLoop](${appUrl}) · [View full report →](${appUrl}/pr/${report.prNumber})*`);

  return lines.join('\n');
}
