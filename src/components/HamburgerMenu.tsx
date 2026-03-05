/* ====== TrustGen — Hamburger Menu ====== */
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

const NAV_LINKS = [
    { label: 'Explore', path: '/explore', icon: '🌐' },
    { label: 'Dashboard', path: '/dashboard', icon: '📊', auth: true },
    { label: '3D Editor', path: '/editor', icon: '🎨', auth: true },
    { label: 'Blog', path: '/blog', icon: '📝' },
    { label: 'Billing', path: '/billing', icon: '💎', auth: true },
    { label: 'SMS Alerts', path: '/sms-opt-in', icon: '📱', auth: true },
    { label: 'Investor Info', path: '/investors', icon: '📈' },
    { label: 'Legal', path: '/legal', icon: '⚖️' },
    { label: 'Dev Portal', path: '/dev-portal', icon: '🛠️' },
]

export function HamburgerMenu() {
    const [open, setOpen] = useState(false)
    const navigate = useNavigate()
    const location = useLocation()
    const isAuthenticated = useAuthStore(s => s.isAuthenticated)
    const user = useAuthStore(s => s.user)
    const logout = useAuthStore(s => s.logout)

    const go = (path: string) => {
        navigate(path)
        setOpen(false)
    }

    return (
        <>
            {/* Hamburger button */}
            <button
                className="hamburger-btn"
                onClick={() => setOpen(!open)}
                aria-label="Menu"
            >
                <span className={`hamburger-line ${open ? 'open' : ''}`} />
                <span className={`hamburger-line ${open ? 'open' : ''}`} />
                <span className={`hamburger-line ${open ? 'open' : ''}`} />
            </button>

            {/* Overlay */}
            {open && (
                <div className="hamburger-overlay" onClick={() => setOpen(false)}>
                    <nav className="hamburger-panel" onClick={e => e.stopPropagation()}>
                        {/* Profile area */}
                        <div className="hamburger-profile">
                            {isAuthenticated && user ? (
                                <>
                                    <div className="hamburger-avatar">
                                        {(user.username || user.email || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="hamburger-username">{user.username || user.email}</div>
                                        <div className="hamburger-role">TrustGen Creator</div>
                                    </div>
                                </>
                            ) : (
                                <button className="hamburger-signin" onClick={() => go('/login')}>
                                    Sign In →
                                </button>
                            )}
                        </div>

                        {/* Mission Statement */}
                        <div className="hamburger-mission">
                            <div className="hamburger-mission-label">Our Mission</div>
                            <p>
                                TrustGen empowers creators to build, animate, and
                                export production-ready 3D content with AI assistance — all verified
                                and hallmarked on Trust Layer's blockchain. We're building the
                                future of authenticated digital creation where every asset has
                                provable provenance and every creator is rewarded.
                            </p>
                            <div className="hamburger-mission-brand">
                                ◈ A DarkWave Studios Product
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="hamburger-nav">
                            {NAV_LINKS.filter(l => !l.auth || isAuthenticated).map(link => (
                                <button
                                    key={link.path}
                                    className={`hamburger-link ${location.pathname === link.path ? 'active' : ''}`}
                                    onClick={() => go(link.path)}
                                >
                                    <span className="hamburger-link-icon">{link.icon}</span>
                                    {link.label}
                                </button>
                            ))}
                        </div>

                        {/* Actions */}
                        <div className="hamburger-bottom">
                            {isAuthenticated && (
                                <button
                                    className="hamburger-link"
                                    onClick={() => { logout(); go('/explore') }}
                                    style={{ color: 'var(--danger)' }}
                                >
                                    <span className="hamburger-link-icon">🚪</span>
                                    Sign Out
                                </button>
                            )}
                            <div className="hamburger-footer-text">
                                <a href="https://dwtl.io" target="_blank" rel="noopener noreferrer">Trust Layer</a>
                                {' · '}
                                <a href="https://trustshield.tech" target="_blank" rel="noopener noreferrer">TrustShield</a>
                                {' · '}
                                <a href="https://darkwavestudios.io" target="_blank" rel="noopener noreferrer">DarkWave Studios</a>
                            </div>
                        </div>
                    </nav>
                </div>
            )}
        </>
    )
}
