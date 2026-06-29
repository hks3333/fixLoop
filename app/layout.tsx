import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Link from 'next/link';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'FixLoop — Autonomous Deployment Guardian',
  description:
    'FixLoop is a GitHub App that autonomously guards your deployments against visual and performance regressions using Cerebras Gemma 4 AI.',
  keywords: ['visual regression', 'GitHub App', 'deployment guardian', 'AI QA'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable} style={{ height: '100%' }}>
      <body style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Top nav */}
        <nav style={{
          position: 'sticky', top: 0, zIndex: 50,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(10,12,16,0.9)',
          backdropFilter: 'blur(16px)',
          padding: '0 24px',
          height: '52px',
          display: 'flex',
          alignItems: 'center',
          gap: '32px',
          flexShrink: 0,
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: 28, height: 28,
              background: 'var(--gradient-brand)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, color: '#fff', fontWeight: 800,
              flexShrink: 0,
            }}>F</span>
            <span style={{
              fontSize: 16, fontWeight: 700, color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}>FixLoop</span>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase',
              color: 'var(--accent-blue-bright)',
              background: 'rgba(99,102,241,0.15)',
              border: '1px solid rgba(99,102,241,0.3)',
              borderRadius: 100, padding: '1px 7px',
              marginLeft: 2,
            }}>GitHub App</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
            <Link href="/" style={{
              color: 'var(--text-secondary)', textDecoration: 'none',
              padding: '5px 12px', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 500,
              transition: 'color 0.15s, background 0.15s',
            }}
              className="nav-link"
            >Dashboard</Link>
            <Link href="/baselines" style={{
              color: 'var(--text-secondary)', textDecoration: 'none',
              padding: '5px 12px', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 500,
              transition: 'color 0.15s, background 0.15s',
            }}
              className="nav-link"
            >Baselines</Link>
            <Link href="/checkout-preview" style={{
              color: 'var(--text-secondary)', textDecoration: 'none',
              padding: '5px 12px', borderRadius: 'var(--radius-sm)',
              fontSize: 13, fontWeight: 500,
              transition: 'color 0.15s, background 0.15s',
            }}
              className="nav-link"
            >Demo</Link>
          </div>
        </nav>

        <main style={{ flex: 1 }}>
          {children}
        </main>
      </body>
    </html>
  );
}
