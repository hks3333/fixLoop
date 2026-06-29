import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { runPipeline, captureAndSaveBaseline } from '@/lib/pipeline';
import { buildPRComment } from '@/lib/commentBuilder';
import { postPRComment } from '@/lib/github';
import { promoteToBaseline } from '@/lib/baseline';
import { screenshotSite } from '@/lib/screenshotter';
import { ROUTES_TO_CHECK } from '@/lib/config';
import { store } from '@/lib/store';
import type { WebhookPayload } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for Railway

function verifySignature(body: string, signature: string): boolean {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) return false; // if no secret configured, skip verification in dev
  const hmac = createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(body).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-hub-signature-256') || '';
  const event = req.headers.get('x-github-event') || '';

  // Verify webhook signature (skip in dev if secret is the default placeholder)
  if (signature && process.env.GITHUB_WEBHOOK_SECRET !== 'fixloop-dev-secret') {
    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
  }

  let payload: any;
  try {
    payload = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // ── App installation: capture baseline ────────────────────────────────────
  if (event === 'installation' && payload.action === 'created') {
    const feedEvent = store.pushFeedEvent({
      type: 'installation',
      timestamp: new Date().toISOString(),
      status: 'running',
      data: { repos: payload.repositories?.length || 0 },
    });

    // Run async — respond to GitHub immediately
    (async () => {
      try {
        const result = await captureAndSaveBaseline();
        store.updateFeedEvent(feedEvent.id, {
          status: 'clean',
          data: { message: `Baseline captured for ${result.routes} routes × ${result.viewports} viewports` },
        });
      } catch (err) {
        console.error('Baseline capture error:', err);
        store.updateFeedEvent(feedEvent.id, {
          status: 'error',
          data: { error: String(err) },
        });
      }
    })();

    return NextResponse.json({ received: true });
  }

  // ── PR opened or updated: run pipeline ────────────────────────────────────
  if (event === 'pull_request' && ['opened', 'synchronize', 'reopened'].includes(payload.action)) {
    const webhookPayload = payload as WebhookPayload;
    const prNumber = webhookPayload.pull_request.number;

    const feedEvent = store.pushFeedEvent({
      type: 'pr_received',
      prNumber,
      prTitle: webhookPayload.pull_request.title,
      branch: webhookPayload.pull_request.head.ref,
      timestamp: new Date().toISOString(),
      status: 'running',
    });

    // Run pipeline async — respond to GitHub within 10s
    (async () => {
      try {
        const report = await runPipeline({
          payload: webhookPayload,
          onProgress: (eventType, data) => {
            store.pushFeedEvent({
              type: eventType,
              prNumber,
              timestamp: new Date().toISOString(),
              data,
            });
          },
        });

        store.setReport(prNumber, report);
        store.updateFeedEvent(feedEvent.id, { status: report.result });

        // Post comment to GitHub
        const comment = buildPRComment(report);
        try {
          await postPRComment({
            installationId: webhookPayload.installation.id,
            owner: webhookPayload.repository.owner.login,
            repo: webhookPayload.repository.name,
            prNumber,
            body: comment,
          });
        } catch (commentErr) {
          console.error('Failed to post PR comment (GitHub creds may not be configured):', commentErr);
        }

      } catch (err) {
        console.error('Pipeline error:', err);
        store.updateFeedEvent(feedEvent.id, {
          status: 'error',
          data: { error: String(err) },
        });
      }
    })();

    return NextResponse.json({ received: true });
  }

  // ── PR merged to main: promote baseline ───────────────────────────────────
  if (event === 'pull_request' && payload.action === 'closed' && payload.pull_request?.merged) {
    store.pushFeedEvent({
      type: 'pr_merged',
      prNumber: payload.pull_request.number,
      timestamp: new Date().toISOString(),
      status: 'clean',
      data: { message: 'Baseline update scheduled in 30s' },
    });

    (async () => {
      // Wait for Vercel to deploy the merged changes
      await new Promise(r => setTimeout(r, 30000));

      const productionUrl = process.env.TARGET_PRODUCTION_URL || 'http://localhost:3000';
      try {
        const { screenshots } = await screenshotSite(productionUrl, ROUTES_TO_CHECK, ['mobile', 'desktop']);
        for (const [route, viewports] of Object.entries(screenshots)) {
          for (const [viewport, chunks] of Object.entries(viewports)) {
            if (chunks && chunks.length > 0) {
              promoteToBaseline(route, viewport, chunks as string[]);
            }
          }
        }
        store.pushFeedEvent({
          type: 'baseline_updated',
          prNumber: payload.pull_request.number,
          timestamp: new Date().toISOString(),
          data: { message: 'Baseline updated to post-merge state' },
        });
      } catch (err) {
        console.error('Baseline promotion error:', err);
      }
    })();

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}
