import { NextResponse } from 'next/server';
import { restoreBug } from '@/lib/bugInjector';

export async function POST() {
  restoreBug();
  return NextResponse.json({ success: true });
}
