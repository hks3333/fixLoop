import { NextResponse } from 'next/server';
import { getBaselineMeta } from '@/lib/baseline';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const meta = getBaselineMeta();
    return NextResponse.json(meta);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
