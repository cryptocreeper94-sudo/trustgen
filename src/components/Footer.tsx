/* ====== TrustGen — Global Footer ====== */
import { useNavigate, useLocation } from 'react-router-dom'

const FOOTER_LINKS = [
    { label: 'Explore', path: '/explore' },
    { label: 'Blog', path: '/blog' },
    { label: 'Terms', path: '/terms' },
    { label: 'Privacy', path: '/privacy' },
    { label: 'Legal', path: '/legal' },
]

export function Footer() {
    const navigate = useNavigate()
    const location = useLocation()

    // Don't show footer on editor page
    if (location.pathname.startsWith('/editor')) return null

    return (
        <footer className="site-footer">
            <div className="footer-inner">
                {/* Brand row */}
                <div className="footer-brand-row">
                    <div className="footer-brand">
                        <span className="footer-logo">◈</span>
                        <span className="footer-brand-name">TrustGen</span>
                        <span className="footer-brand-sub">3D ENGINE</span>
                    </div>
                    <p className="footer-tagline">
                        Premium AI-powered 3D creation, animation &amp; export platform.
                    </p>
                </div>

                {/* Nav links */}
                <nav className="footer-nav">
                    {FOOTER_LINKS.map(link => (
                        <button
                            key={link.path}
                            className="footer-link"
                            onClick={() => navigate(link.path)}
                        >
                            {link.label}
                        </button>
                    ))}
                </nav>

                {/* Divider */}
                <div className="footer-divider" />

                {/* Trust badges */}
                <div className="footer-badges">
                    <a
                        href="https://dwtl.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-badge"
                    >
                        <span className="badge-icon">⛓️</span>
                        <span>Powered by <strong>Trust Layer</strong></span>
                    </a>
                    <a
                        href="https://trustshield.tech"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-badge"
                    >
                        <span className="badge-icon">🛡️</span>
                        <span>Protected by <strong>TrustShield.tech</strong></span>
                    </a>
                    <a
                        href="https://lume-lang.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-badge"
                    >
                        <span className="badge-icon">◈</span>
                        <span>Built with <strong>Lume</strong></span>
                    </a>
                    <a
                        href="https://dwsc.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-badge"
                    >
                        <span className="badge-icon">🔬</span>
                        <span><strong>DWSC</strong> R&D</span>
                    </a>
                </div>

                {/* Copyright + dev link */}
                <div className="footer-bottom">
                    <a
                        href="https://darkwavestudios.io"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="footer-copyright"
                    >
                        &copy; 2026 DarkWave Studios LLC
                    </a>
                    <button
                        className="footer-dev-link"
                        onClick={() => navigate('/dev-portal')}
                    >
                        Developer Portal
                    </button>
                </div>
            </div>
        </footer>
    )
}
