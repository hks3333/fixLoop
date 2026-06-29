'use client';
import { useState, useEffect } from 'react';
import type { BaselineMeta } from '@/lib/types';

interface BaselineMetas {
  [route: string]: BaselineMeta;
}

export default function BaselineManager() {
  const [meta, setMeta] = useState<BaselineMetas>({});
  const [loading, setLoading] = useState(true);
  const [capturing, setCapturing] = useState(false);
  const [captureMsg, setCaptureMsg] = useState('');

  async function loadMeta() {
    try {
      const res = await fetch('/api/baseline/list');
      if (res.ok) setMeta(await res.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadMeta(); }, []);

  async function handleCapture() {
    setCapturing(true);
    setCaptureMsg('Starting Playwright browser. This may take up to 60 seconds...');
    try {
      const res = await fetch('/api/baseline/capture', { method: 'POST' });
      const data = await res.json();
      
      if (data.started) {
        setCaptureMsg('Capture in progress. Waiting for Playwright to finish...');
        let attempts = 0;
        
        const poll = async () => {
          attempts++;
          try {
            const listRes = await fetch('/api/baseline/list');
            if (listRes.ok) {
              const newMeta = await listRes.json();
              setMeta(newMeta);
              
              // If we have baselines now, we can stop polling after a few attempts
              if (Object.keys(newMeta).length > 0 && attempts > 4) {
                 setCaptureMsg('Capture complete!');
                 setCapturing(false);
                 return; // Stop polling
              }
            }
          } catch {}
          
          if (attempts < 30) {
            setTimeout(poll, 2000);
          } else {
            setCapturing(false);
            setCaptureMsg('Capture timed out or took too long. Please check the logs in your Railway dashboard.');
          }
        };
        
        // Start polling loop
        setTimeout(poll, 2000);
      } else {
        setCaptureMsg('Failed to start capture.');
        setCapturing(false);
      }
    } catch {
      setCaptureMsg('Error starting capture.');
      setCapturing(false);
    }
  }

  const routes = Object.keys(meta);
  const allViewports = [...new Set(routes.flatMap(r => Object.keys(meta[r])))];

  return (
    <div>
      {/* Action bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 24, gap: 16, flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Baseline Screenshots
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-muted)' }}>
            {routes.length} routes · screenshots compared against every PR
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleCapture}
          disabled={capturing}
        >
          {capturing ? (
            <>
              <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
              Capturing…
            </>
          ) : '📷 Recapture Baseline'}
        </button>
      </div>

      {captureMsg && (
        <div style={{
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: 'var(--radius-md)', padding: '10px 16px',
          marginBottom: 20, fontSize: 13, color: 'var(--accent-blue-bright)',
        }}>
          {captureMsg}
        </div>
      )}

      {loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 200, borderRadius: 12 }} />
          ))}
        </div>
      )}

      {!loading && routes.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 32px',
          border: '1px dashed var(--border)', borderRadius: 'var(--radius-xl)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📸</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
            No baselines captured yet
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
            Set <code style={{ fontFamily: 'var(--font-mono)' }}>TARGET_PRODUCTION_URL</code> in .env.local and click Recapture Baseline.
          </p>
          <button className="btn btn-primary" onClick={handleCapture} disabled={capturing}>
            📷 Capture Now
          </button>
        </div>
      )}

      {!loading && routes.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {routes.flatMap(route =>
            Object.entries(meta[route]).map(([viewport, info]) => (
              <div key={`${route}-${viewport}`} className="card" style={{ overflow: 'hidden' }}>
                {/* Placeholder image area */}
                <div style={{
                  height: 160,
                  background: 'var(--bg-elevated)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexDirection: 'column', gap: 8,
                  borderBottom: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 32 }}>
                    {viewport === 'mobile' ? '📱' : viewport === 'tablet' ? '💻' : '🖥'}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {info.chunkCount} chunk{info.chunkCount !== 1 ? 's' : ''}
                  </div>
                </div>

                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <code style={{
                      fontFamily: 'var(--font-mono)', fontSize: 12,
                      color: 'var(--text-primary)', fontWeight: 600,
                    }}>{route}</code>
                    <span style={{
                      fontSize: 10, textTransform: 'uppercase', fontWeight: 700,
                      color: 'var(--text-muted)',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '2px 7px', borderRadius: 4,
                    }}>{viewport}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    Last captured: {new Date(info.savedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
