'use client';
import { useState } from 'react';

interface DiffViewerProps {
  baseline?: string;   // base64 PNG
  current?: string;    // base64 PNG
  diff?: string;       // base64 PNG (pixelmatch output)
  // Legacy props for existing demo
  bugged?: string;
  fixed?: string;
}

type Tab = 'baseline' | 'current' | 'diff';

export default function DiffViewer({ baseline, current, diff, bugged, fixed }: DiffViewerProps) {
  // Support legacy prop names from the old demo
  const baselineImg = baseline || baseline;
  const currentImg = current || bugged;
  const diffImg = diff;
  const fixedImg = fixed;

  const [tab, setTab] = useState<Tab>('baseline');

  const tabs: { id: Tab; label: string; hasContent: boolean }[] = [
    { id: 'baseline', label: 'Baseline', hasContent: !!baselineImg },
    { id: 'current',  label: 'Current',  hasContent: !!currentImg  },
    { id: 'diff',     label: 'Diff',     hasContent: !!diffImg || !!fixedImg },
  ];

  const activeImage = tab === 'baseline' ? baselineImg
    : tab === 'current'  ? currentImg
    : (diffImg || fixedImg);

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {tabs.filter(t => t.hasContent).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '4px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid',
              borderColor: tab === t.id ? 'rgba(99,102,241,0.5)' : 'var(--border)',
              background: tab === t.id ? 'rgba(99,102,241,0.15)' : 'transparent',
              color: tab === t.id ? 'var(--accent-blue-bright)' : 'var(--text-secondary)',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Image */}
      {activeImage ? (
        <div style={{
          background: 'rgba(0,0,0,0.3)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`data:image/png;base64,${activeImage}`}
            alt={tab}
            style={{ width: '100%', display: 'block', maxHeight: 400, objectFit: 'contain' }}
          />
        </div>
      ) : (
        <div style={{
          height: 120,
          background: 'var(--bg-glass)',
          borderRadius: 'var(--radius-md)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-muted)', fontSize: 13,
        }}>
          No image available
        </div>
      )}
    </div>
  );
}
