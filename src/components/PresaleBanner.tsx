/**
 * PresaleBanner — Self-contained Signal (SIG) presale promotion.
 * No external CSS or dependencies required.
 * Dismissible per-session (sessionStorage) — comes back next visit.
 */
import { useState } from 'react';

const PRESALE_URL = 'https://dwtl.io/presale';

const styles: Record<string, React.CSSProperties> = {
  container: { position: 'fixed', bottom: 72, left: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 280, animation: 'slideUp 0.5s ease-out' },
  widget: { position: 'relative', background: 'linear-gradient(135deg, rgba(6,182,212,0.15) 0%, rgba(168,85,247,0.1) 100%)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 16, padding: 16, boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(6,182,212,0.15)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  live: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 8px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#34d399' },
  dot: { width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 8px rgba(52,211,153,0.8)', animation: 'pulse 2s infinite' },
  dismiss: { background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 16, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', transition: 'background 0.2s, color 0.2s' },
  title: { fontSize: 14, fontWeight: 800, color: '#fff', marginBottom: 4 },
  desc: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 12, lineHeight: 1.4 },
  price: { color: '#67e8f9', fontWeight: 700 },
  cta: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', padding: 10, borderRadius: 8, background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)', color: '#fff', fontSize: 13, fontWeight: 800, textDecoration: 'none', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(6,182,212,0.3)', transition: 'transform 0.2s, box-shadow 0.2s' }
};

export function PresaleBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return sessionStorage.getItem('presale-banner-dismissed') === 'true'; } catch { return false; }
  });

  if (dismissed) return null;

  return (
    <div style={styles.container}>
      <div style={styles.widget}>
        <div style={styles.header}>
            <span style={styles.live}><span style={styles.dot} /> LIVE</span>
            <button style={styles.dismiss} onClick={() => { setDismissed(true); try { sessionStorage.setItem('presale-banner-dismissed', 'true') } catch {} }} aria-label="Dismiss">✕</button>
        </div>
        <div style={styles.title}>Signal Charging</div>
        <div style={styles.desc}>Get <span style={styles.price}>$0.001</span> early access before TGE ($0.01).</div>
        <a style={styles.cta} href={PRESALE_URL} target="_blank" rel="noopener noreferrer">⚡ Join Presale</a>
      </div>
      <style>{`@keyframes slideUp { from { transform: translateY(100px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }`}</style>
    </div>
  );
}

