import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ prNumber: string }> }
) {
  // Next.js 16: params is a Promise — must be awaited
  const { prNumber } = await params;
  const num = parseInt(prNumber, 10);

  if (isNaN(num)) {
    return NextResponse.json({ error: 'Invalid PR number' }, { status: 400 });
  }

  const report = store.getReport(num);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json(report);
}
