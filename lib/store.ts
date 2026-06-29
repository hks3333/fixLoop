import type { FeedEvent, PipelineReport } from './types';

// In-memory store — shared singleton across webhook and report routes.
// Survives hot-reload in dev because of module caching.
// NOTE: Does NOT survive process restarts — use a DB for production persistence.

const _reports = new Map<number, PipelineReport>();
const _feedEvents: FeedEvent[] = [];

export const store = {
  getReport(prNumber: number): PipelineReport | undefined {
    return _reports.get(prNumber);
  },

  setReport(prNumber: number, report: PipelineReport): void {
    _reports.set(prNumber, report);
  },

  getAllReports(): PipelineReport[] {
    return Array.from(_reports.values()).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  },

  getFeedEvents(): FeedEvent[] {
    return _feedEvents.slice(0, 100); // cap at 100 events
  },

  pushFeedEvent(event: Omit<FeedEvent, 'id'>): FeedEvent {
    const fullEvent: FeedEvent = {
      ...event,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    _feedEvents.unshift(fullEvent);
    if (_feedEvents.length > 100) _feedEvents.pop();
    return fullEvent;
  },

  updateFeedEvent(id: string, updates: Partial<FeedEvent>): void {
    const idx = _feedEvents.findIndex(e => e.id === id);
    if (idx !== -1) {
      Object.assign(_feedEvents[idx], updates);
    }
  },
};
