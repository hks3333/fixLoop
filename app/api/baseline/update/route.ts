import { NextRequest, NextResponse } from 'next/server';
import { promoteToBaseline } from '@/lib/baseline';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { route, viewport, chunks } = await req.json();

    if (!route || !viewport || !Array.isArray(chunks) || chunks.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: route, viewport, chunks[]' },
        { status: 400 }
      );
    }

    promoteToBaseline(route, viewport, chunks);
    return NextResponse.json({ promoted: true, route, viewport, chunks: chunks.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
