import { NextResponse } from 'next/server';
import { captureAndSaveBaseline } from '@/lib/pipeline';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST() {
  const feedEvent = store.pushFeedEvent({
    type: 'baseline_capture_started',
    timestamp: new Date().toISOString(),
    status: 'running',
    data: { url: process.env.TARGET_PRODUCTION_URL },
  });

  // Start async capture — return immediately
  (async () => {
    try {
      const result = await captureAndSaveBaseline();
      console.log(`[Baseline Capture] Success: ${result.routes} routes captured`);
      store.updateFeedEvent(feedEvent.id, {
        status: 'clean',
        data: { message: `Captured ${result.routes} routes × ${result.viewports} viewports` },
      });
    } catch (err) {
      console.error(`[Baseline Capture] FAILED:`, err);
      store.updateFeedEvent(feedEvent.id, {
        status: 'error',
        data: { error: String(err) },
      });
    }
  })();

  return NextResponse.json({ started: true, eventId: feedEvent.id });
}
