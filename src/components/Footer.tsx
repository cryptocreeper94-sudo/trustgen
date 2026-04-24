/* ====== TrustGen — Global Footer (Unified Ecosystem) ====== */
import { useNavigate, useLocation } from 'react-router-dom'
import { useRef, useCallback } from 'react'

const socialLinks = [
  { name: "Twitter", url: "https://x.com/TrustSignal26", icon: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
  { name: "Discord", url: "https://discord.gg/PtkWpzE6", icon: "M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" },
  { name: "Telegram", url: "https://t.me/dwsccommunity", icon: "M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" },
  { name: "Facebook", url: "https://www.facebook.com/profile.php?id=61585553137979", icon: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" },
];

export function Footer() {
  const navigate = useNavigate()
  const location = useLocation()
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleShieldClick = useCallback(() => {
    clickCountRef.current += 1;
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    if (clickCountRef.current >= 3) {
      clickCountRef.current = 0;
      window.open("https://dwtl.io/developer-portal", "_blank");
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickCountRef.current = 0;
      }, 2000);
    }
  }, []);

  // Don't show footer on editor page
  if (location.pathname.startsWith('/editor')) return null

  return (
    <footer style={{ borderTop: '1px solid rgba(255,255,255,0.08)', background: '#070b16' }} data-testid="footer">
      {/* Site Links */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 32, textAlign: 'center' }}>
            <div>
              <h4 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 16, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Platform</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><button onClick={() => navigate('/explore')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', padding: 0 }} className="footer-link">Explore</button></li>
                <li><button onClick={() => navigate('/workspace')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', padding: 0 }} className="footer-link">Workspace</button></li>
                <li><button onClick={() => navigate('/pricing')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', padding: 0 }} className="footer-link">Pricing</button></li>
                <li><button onClick={() => navigate('/blog')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', padding: 0 }} className="footer-link">Blog</button></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 16, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Ecosystem</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><a href="https://dwtl.io" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecoration: 'none' }} className="footer-link">Trust Layer</a></li>
                <li><a href="https://dwtl.io/presale" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecoration: 'none' }} className="footer-link">Signal Presale</a></li>
                <li><a href="https://trustshield.tech" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecoration: 'none' }} className="footer-link">TrustShield</a></li>
                <li><a href="https://darkwavestudios.io" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecoration: 'none' }} className="footer-link">DarkWave Studios</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 16, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Resources</h4>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li><button onClick={() => navigate('/terms')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', padding: 0 }} className="footer-link">Terms</button></li>
                <li><button onClick={() => navigate('/privacy')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', padding: 0 }} className="footer-link">Privacy</button></li>
                <li><button onClick={() => navigate('/legal')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer', padding: 0 }} className="footer-link">Legal</button></li>
                <li><a href="https://dwsc.io" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, textDecoration: 'none' }} className="footer-link">DWSC R&D</a></li>
              </ul>
            </div>
            <div>
              <h4 style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 16, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Community</h4>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
                {socialLinks.map((s) => (
                  <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.3)' }} className="footer-link" title={s.name}>
                    <svg viewBox="0 0 24 24" style={{ width: 16, height: 16, fill: 'currentColor' }}><path d={s.icon} /></svg>
                  </a>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', margin: 0 }}>Join our growing community</p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '4px 8px', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>DarkWave Studios, LLC</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
          <span>&copy; 2026</span>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
          <a href="https://dwtl.io" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }} className="footer-link">Trust Layer</a>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
          <a href="https://trustshield.tech" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }} className="footer-link">TrustShield</a>
          <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
          <button
            onClick={handleShieldClick}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.1)', cursor: 'pointer', padding: 0, lineHeight: 0 }}
            data-testid="shield-easter-egg"
            aria-label="Shield"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          </button>
        </div>
      </div>
    </footer>
  )
}
