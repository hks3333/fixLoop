import type { Metadata } from 'next';
import BaselineManager from '@/components/BaselineManager';

export const metadata: Metadata = {
  title: 'Baselines — FixLoop',
  description: 'View and manage baseline screenshots used for visual regression detection.',
};

export default function BaselinesPage() {
  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
      <BaselineManager />
    </div>
  );
}
