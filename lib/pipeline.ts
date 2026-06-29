import { screenshotSite, measurePerformance } from './screenshotter';
import { triageScreenshots } from './pixeldiff';
import { loadAllBaselines, promoteToBaseline } from './baseline';
import { runAgentA, runAgentB, runAgentC, runAgentD } from './agents';
import { getPreviewUrl, openFixPR } from './github';
import { ROUTES_TO_CHECK } from './config';
import type { PipelineReport, Regression, WebhookPayload } from './types';

export async function runPipeline(params: {
  payload: WebhookPayload;
  onProgress?: (event: string, data: unknown) => void;
}): Promise<PipelineReport> {
  const startTime = Date.now();
  const { payload, onProgress } = params;
  const emit = (event: string, data: unknown) => onProgress?.(event, data);

  const prNumber = payload.pull_request.number;
  const prTitle = payload.pull_request.title;
  const prDescription = payload.pull_request.body || '';
  const branch = payload.pull_request.head.ref;
  const baseBranch = payload.pull_request.base.ref;
  const owner = payload.repository.owner.login;
  const repo = payload.repository.name;
  const installationId = payload.installation.id;

  const previewUrl = getPreviewUrl(branch);
  const productionUrl = process.env.TARGET_PRODUCTION_URL || 'http://localhost:3000';

  emit('pipeline_start', { prNumber, branch, previewUrl });

  // ── Screenshot preview deployment ─────────────────────────────────────────
  emit('screenshotting', { url: previewUrl });
  let screenshots: Awaited<ReturnType<typeof screenshotSite>>['screenshots'];
  let consoleErrors: Awaited<ReturnType<typeof screenshotSite>>['consoleErrors'];

  try {
    ({ screenshots, consoleErrors } = await screenshotSite(previewUrl, ROUTES_TO_CHECK, ['mobile', 'desktop']));
  } catch (err) {
    emit('screenshotter_error', { error: String(err) });
    throw new Error(`Failed to screenshot preview URL ${previewUrl}: ${err}`);
  }

  // ── Load baselines ────────────────────────────────────────────────────────
  const baselines = loadAllBaselines();

  // ── Pixel diff triage ─────────────────────────────────────────────────────
  emit('pixel_diff', {});
  const flaggedChunks = triageScreenshots({
    baseline: baselines as any,
    current: screenshots as any,
  });

  emit('triage_done', { flaggedCount: flaggedChunks.length });

  // ── Performance check ─────────────────────────────────────────────────────
  let performanceDeltas: PipelineReport['performanceDeltas'] = [];
  try {
    const [previewPerf, baselinePerf] = await Promise.all([
      measurePerformance(previewUrl),
      measurePerformance(productionUrl),
    ]);

    performanceDeltas = [
      { metric: 'TTFB', baseline: baselinePerf.ttfb, current: previewPerf.ttfb },
      { metric: 'DOM Interactive', baseline: baselinePerf.domInteractive, current: previewPerf.domInteractive },
      { metric: 'Load Complete', baseline: baselinePerf.loadComplete, current: previewPerf.loadComplete },
    ].filter(d => Math.abs(d.current - d.baseline) > 100); // only meaningful deltas
  } catch (err) {
    console.warn('Performance measurement failed:', err);
  }

  // ── If nothing flagged, return clean ──────────────────────────────────────
  if (flaggedChunks.length === 0) {
    return {
      prNumber, prTitle, branch,
      result: 'clean',
      regressions: [],
      intentionalChanges: [],
      routesSummary: ROUTES_TO_CHECK.map(r => ({
        route: r.path,
        viewports: ['mobile', 'desktop'],
        maxPixelDiff: 0,
      })),
      performanceDeltas,
      consoleErrors: [],
      totalMs: Date.now() - startTime,
      agentTimings: {},
      timestamp: new Date().toISOString(),
    };
  }

  // ── Run agents on each flagged chunk ──────────────────────────────────────
  const regressions: Regression[] = [];
  const intentionalChanges: string[] = [];
  const agentTimings: { [agent: string]: number } = { A: 0, B: 0, C: 0, D: 0 };
  let fixPRUrl: string | undefined;

  for (const flagged of flaggedChunks) {
    const baselineChunk = (baselines as any)[flagged.route]?.[flagged.viewport]?.[flagged.chunkIndex];
    if (!baselineChunk) continue;

    // ── Agent A: Visual QA ─────────────────────────────────────────────────
    emit('agent_start', { agent: 'A', route: flagged.route, viewport: flagged.viewport });
    const t0 = Date.now();
    let agentAResult;
    try {
      agentAResult = await runAgentA({
        baselineDesktop: baselineChunk,
        baselineMobile: flagged.baselineChunk,
        buggedDesktop: flagged.currentChunk,
        buggedMobile: flagged.currentChunk,
        prDescription,
      });
    } catch (err) {
      emit('agent_error', { agent: 'A', error: String(err) });
      continue;
    }
    agentTimings.A += Date.now() - t0;
    emit('agent_done', { agent: 'A', result: agentAResult });

    if (agentAResult.intentional_changes_detected?.length) {
      intentionalChanges.push(...agentAResult.intentional_changes_detected);
    }

    if (!agentAResult.regression_found) continue;

    // ── Agent B: Root Cause Analysis ────────────────────────────────────────
    emit('agent_start', { agent: 'B' });
    const t1 = Date.now();
    let agentBResult;
    try {
      agentBResult = await runAgentB({
        regressionDescription: agentAResult.description,
        affectedElement: agentAResult.affected_element,
        cssContent: '', // fetch from GitHub API in a full production build
        cssDiff: `PR #${prNumber}: ${prTitle}\n${prDescription}`,
      });
    } catch (err) {
      emit('agent_error', { agent: 'B', error: String(err) });
      continue;
    }
    agentTimings.B += Date.now() - t1;
    emit('agent_done', { agent: 'B', result: agentBResult });

    // ── Agent C: Fix Generation ─────────────────────────────────────────────
    emit('agent_start', { agent: 'C' });
    const t2 = Date.now();
    let agentCResult;
    try {
      agentCResult = await runAgentC({
        rootCause: agentBResult,
        cssContent: '',
      });
    } catch (err) {
      emit('agent_error', { agent: 'C', error: String(err) });
      agentTimings.C += Date.now() - t2;
      agentCResult = null;
    }
    agentTimings.C += Date.now() - t2;
    if (agentCResult) emit('agent_done', { agent: 'C', result: agentCResult });

    // ── Agent D: Verification ───────────────────────────────────────────────
    emit('agent_start', { agent: 'D' });
    const t3 = Date.now();
    let agentDResult;
    try {
      agentDResult = await runAgentD({
        baselineMobile: baselineChunk,
        fixedMobile: flagged.currentChunk,
        regressionDescription: agentAResult.description,
      });
    } catch (err) {
      emit('agent_error', { agent: 'D', error: String(err) });
      agentTimings.D += Date.now() - t3;
      agentDResult = null;
    }
    agentTimings.D += Date.now() - t3;
    if (agentDResult) emit('agent_done', { agent: 'D', result: agentDResult });

    // ── Classify business impact ────────────────────────────────────────────
    const businessImpact = classifyBusinessImpact({
      route: flagged.route,
      description: agentAResult.description,
      affectedElement: agentAResult.affected_element,
    });

    regressions.push({
      route: flagged.route,
      viewport: flagged.viewport,
      description: agentAResult.description,
      affectedElement: agentAResult.affected_element,
      severity: businessImpact.severity,
      businessImpact: businessImpact.impact,
      file: agentBResult.file,
      line: agentBResult.line,
      property: agentBResult.property,
      badValue: agentBResult.new_value,
      correctValue: agentBResult.old_value,
      patch: agentCResult ? {
        oldCode: agentCResult.old_code,
        newCode: agentCResult.new_code,
        explanation: agentCResult.explanation,
      } : undefined,
      screenshots: {
        baseline: baselineChunk,
        current: flagged.currentChunk,
        diff: flagged.diff.diffImageBase64,
      },
    });
  }

  // ── Open fix PR if we have patches ────────────────────────────────────────
  const fixableRegressions = regressions.filter(r => r.patch);
  if (fixableRegressions.length > 0 && fixableRegressions[0].patch) {
    try {
      fixPRUrl = await openFixPR({
        installationId,
        owner,
        repo,
        baseBranch: branch,
        fixBranchName: `fixloop/regression-pr-${prNumber}-${Date.now()}`,
        filePath: fixableRegressions[0].file,
        oldContent: fixableRegressions[0].patch!.oldCode,
        newContent: fixableRegressions[0].patch!.newCode,
        commitMessage: `fix: auto-patch regression on ${fixableRegressions[0].route} [FixLoop]`,
        prTitle: `[FixLoop] Fix visual regression in PR #${prNumber}`,
        prBody: `Auto-generated fix by FixLoop for regression detected in PR #${prNumber}.\n\n**Issue:** ${fixableRegressions[0].description}\n**Root cause:** \`${fixableRegressions[0].file}:${fixableRegressions[0].line}\`\n\n---\n*This PR was opened automatically by [FixLoop](${process.env.APP_URL}).*`,
      });
      emit('fix_pr_opened', { url: fixPRUrl });
    } catch (err) {
      console.error('Failed to open fix PR:', err);
      emit('fix_pr_error', { error: String(err) });
    }
  }

  const allConsoleErrors = Object.values(consoleErrors).flat();

  return {
    prNumber, prTitle, branch,
    result: regressions.length === 0 ? 'clean' : fixPRUrl ? 'fixed' : 'escalated',
    regressions,
    intentionalChanges: [...new Set(intentionalChanges)],
    routesSummary: ROUTES_TO_CHECK.map(r => ({
      route: r.path,
      viewports: ['mobile', 'desktop'],
      maxPixelDiff: Math.max(
        ...flaggedChunks.filter(f => f.route === r.path).map(f => f.diff.score),
        0
      ),
    })),
    performanceDeltas,
    consoleErrors: allConsoleErrors,
    fixPRUrl,
    totalMs: Date.now() - startTime,
    agentTimings,
    timestamp: new Date().toISOString(),
  };
}

function classifyBusinessImpact(params: {
  route: string;
  description: string;
  affectedElement: string;
}): { severity: 'critical' | 'high' | 'medium' | 'low'; impact: string } {
  const desc = params.description.toLowerCase();
  const elem = params.affectedElement.toLowerCase();

  if (
    elem.includes('button') || elem.includes('checkout') ||
    elem.includes('payment') || desc.includes('invisible') ||
    desc.includes('hidden') || desc.includes('not clickable')
  ) {
    return { severity: 'critical', impact: 'Interactive element blocked — users cannot complete the action' };
  }
  if (elem.includes('nav') || elem.includes('link') || desc.includes('broken') || desc.includes('missing')) {
    return { severity: 'high', impact: 'Navigation impaired — users may not reach key pages' };
  }
  if (desc.includes('shift') || desc.includes('overlap') || desc.includes('cut off')) {
    return { severity: 'medium', impact: 'Layout shift detected — may affect user experience on some devices' };
  }
  return { severity: 'low', impact: 'Minor visual inconsistency — unlikely to affect user flows' };
}

// ─── Baseline capture helper (used by installation webhook & API route) ────────
export async function captureAndSaveBaseline(): Promise<{ routes: number; viewports: number }> {
  const { screenshotSite: ss } = await import('./screenshotter');
  const { saveBaseline: sb } = await import('./baseline');
  const { ROUTES_TO_CHECK: routes } = await import('./config');

  const productionUrl = process.env.TARGET_PRODUCTION_URL || 'http://localhost:3000';
  const { screenshots } = await ss(productionUrl, routes, ['mobile', 'desktop']);

  let routeCount = 0;
  let vpCount = 0;
  for (const [route, viewports] of Object.entries(screenshots)) {
    routeCount++;
    for (const [viewport, chunks] of Object.entries(viewports)) {
      if (chunks && chunks.length > 0) {
        sb(route, viewport, chunks as string[]);
        vpCount++;
      }
    }
  }

  return { routes: routeCount, viewports: vpCount };
}
