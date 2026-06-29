import type { Metadata } from 'next';
import PRReportPageClient from './client';

// Next.js 16: params is a Promise — must be awaited in server components
export async function generateMetadata(
  { params }: { params: Promise<{ prNumber: string }> }
): Promise<Metadata> {
  const { prNumber } = await params;
  return {
    title: `PR #${prNumber} Report — FixLoop`,
    description: `Visual regression analysis for PR #${prNumber}`,
  };
}

export default async function PRReportPage(
  { params }: { params: Promise<{ prNumber: string }> }
) {
  const { prNumber } = await params;
  return <PRReportPageClient prNumber={parseInt(prNumber, 10)} />;
}
