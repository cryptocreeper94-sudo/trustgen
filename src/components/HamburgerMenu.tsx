/* ====== TrustGen — Hamburger Menu (Unified) ====== */
/* Grouped accordion navigation, help center, ecosystem apps */
import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { searchHelp, HELP_ARTICLES, HELP_CATEGORIES, type HelpArticle } from '../engine/HelpCenter'
import { ECOSYSTEM_APPS } from '../engine/Dashboard'
import { EcosystemRoadmap } from './EcosystemRoadmap'

// ── Nav Groups ──

interface NavGroup {
    label: string
    icon: string
    links: { label: string; path: string; icon: string; auth?: boolean }[]
}

const NAV_GROUPS: NavGroup[] = [
    {
        label: 'Create', icon: '🎨',
        links: [
            { label: 'Lume Studio', path: '/studio', icon: '◈', auth: true },
            { label: '3D Editor', path: '/editor', icon: '🎬', auth: true },
            { label: 'Dashboard', path: '/dashboard', icon: '📊', auth: true },
            { label: 'Asset Pipeline', path: '/workspace', icon: '📦', auth: true },
            { label: 'Explore', path: '/explore', icon: '🌐' },
        ],
    },
    {
        label: 'Account', icon: '👤',
        links: [
            { label: 'Billing', path: '/billing', icon: '💎', auth: true },
            { label: 'Share & Earn', path: '/affiliate', icon: '🤝', auth: true },
            { label: 'SMS Alerts', path: '/sms-opt-in', icon: '📱', auth: true },
        ],
    },
    {
        label: 'Resources', icon: '📚',
        links: [
            { label: 'Beta Program', path: '/beta', icon: '🧪' },
            { label: 'Blog', path: '/blog', icon: '📝' },
            { label: 'Investor Info', path: '/investors', icon: '📈' },
            { label: 'Dev Portal', path: '/dev-portal', icon: '🛠️' },
            { label: 'Legal', path: '/legal', icon: '⚖️' },
        ],
    },
]

export function HamburgerMenu() {
    const [open, setOpen] = useState(false)
    const [activeSection, setActiveSection] = useState<'nav' | 'help' | 'ecosystem' | 'shortcuts'>('nav')
    const [helpSearch, setHelpSearch] = useState('')
    const [expandedGroups, setExpandedGroups] = useState<string[]>(['Create'])
    const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null)
    const navigate = useNavigate()
    const location = useLocation()
    const isAuthenticated = useAuthStore(s => s.isAuthenticated)
    const user = useAuthStore(s => s.user)
    const logout = useAuthStore(s => s.logout)

    const go = (path: string) => {
        navigate(path)
        setOpen(false)
    }

    const toggleGroup = (label: string) => {
        setExpandedGroups(prev =>
            prev.includes(label) ? prev.filter(g => g !== label) : [...prev, label]
        )
    }

    const filteredHelp = useMemo(() =>
        helpSearch.trim() ? searchHelp(helpSearch) : HELP_ARTICLES.slice(0, 6),
        [helpSearch]
    )

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
                                        {(user.name || user.email || 'U')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="hamburger-username">{user.name || user.email}</div>
                                        <div className="hamburger-role">TrustGen Creator</div>
                                    </div>
                                </>
                            ) : (
                                <button className="hamburger-signin" onClick={() => go('/login')}>
                                    Sign In →
                                </button>
                            )}
                        </div>

                        {/* Section tabs */}
                        <div className="hamburger-section-tabs">
                            {(['nav', 'help', 'ecosystem', 'shortcuts'] as const).map(sec => (
                                <button
                                    key={sec}
                                    className={`hamburger-section-tab ${activeSection === sec ? 'active' : ''}`}
                                    onClick={() => { setActiveSection(sec); setSelectedArticle(null) }}
                                >
                                    {sec === 'nav' && '🧭 Navigate'}
                                    {sec === 'help' && '❓ Help'}
                                    {sec === 'ecosystem' && '🌐 Ecosystem'}
                                    {sec === 'shortcuts' && '⌨️ Keys'}
                                </button>
                            ))}
                        </div>

                        {/* ── Navigation Section ── */}
                        {activeSection === 'nav' && (
                            <div className="hamburger-nav">
                                {NAV_GROUPS.map(group => (
                                    <div key={group.label} className="hamburger-group">
                                        <button
                                            className="hamburger-group-header"
                                            onClick={() => toggleGroup(group.label)}
                                        >
                                            <span>{group.icon} {group.label}</span>
                                            <span className={`hamburger-chevron ${expandedGroups.includes(group.label) ? 'open' : ''}`}>▾</span>
                                        </button>
                                        {expandedGroups.includes(group.label) && (
                                            <div className="hamburger-group-links">
                                                {group.links
                                                    .filter(l => !l.auth || isAuthenticated)
                                                    .map(link => (
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
                                        )}
                                    </div>
                                ))}

                                {/* Mission */}
                                <div className="hamburger-mission">
                                    <div className="hamburger-mission-label">Our Mission</div>
                                    <p>
                                        TrustGen empowers creators to build, animate, and
                                        export production-ready 3D content with AI assistance — all verified
                                        on Trust Layer's blockchain.
                                    </p>
                                    <div className="hamburger-mission-brand">
                                        ◈ A DarkWave Studios Product
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── Help Center Section ── */}
                        {activeSection === 'help' && (
                            <div className="hamburger-help">
                                {!selectedArticle ? (
                                    <>
                                        {/* Search */}
                                        <div className="hamburger-help-search">
                                            <input
                                                type="text"
                                                placeholder="Search help articles..."
                                                value={helpSearch}
                                                onChange={e => setHelpSearch(e.target.value)}
                                                className="hamburger-help-input"
                                                autoFocus
                                            />
                                        </div>

                                        {/* Categories */}
                                        {!helpSearch && (
                                            <div className="hamburger-help-cats">
                                                {HELP_CATEGORIES.map(cat => (
                                                    <button
                                                        key={cat.id}
                                                        className="hamburger-help-cat"
                                                        onClick={() => setHelpSearch(cat.label)}
                                                    >
                                                        <span>{cat.icon}</span>
                                                        <span>{cat.label}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Articles */}
                                        <div className="hamburger-help-list">
                                            {filteredHelp.map(article => (
                                                <button
                                                    key={article.id}
                                                    className="hamburger-help-article"
                                                    onClick={() => setSelectedArticle(article)}
                                                >
                                                    <span className="hamburger-help-article-icon">{article.icon}</span>
                                                    <span className="hamburger-help-article-title">{article.title}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </>
                                ) : (
                                    /* Article detail view */
                                    <div className="hamburger-help-detail">
                                        <button
                                            className="hamburger-help-back"
                                            onClick={() => setSelectedArticle(null)}
                                        >
                                            ← Back
                                        </button>
                                        <h3 className="hamburger-help-detail-title">
                                            {selectedArticle.icon} {selectedArticle.title}
                                        </h3>
                                        <div className="hamburger-help-detail-content">
                                            {selectedArticle.content.split('\n').map((line, i) => (
                                                <p key={i} style={{ margin: line.startsWith('•') || line.startsWith('**') ? '4px 0' : '8px 0' }}>
                                                    {line}
                                                </p>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Ecosystem Section ── */}
                        {activeSection === 'ecosystem' && (
                            <div className="hamburger-ecosystem">
                                <div className="hamburger-ecosystem-label">Ecosystem Navigation</div>`n                                <EcosystemRoadmap />`n                                <div className="hamburger-ecosystem-label mt-6">Trust Layer Apps</div>`n                                <div className="hamburger-ecosystem-grid">
                                    {ECOSYSTEM_APPS.map(app => (
                                        <a
                                            key={app.id}
                                            href={app.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="hamburger-ecosystem-card"
                                            style={{ '--app-color': app.color } as React.CSSProperties}
                                        >
                                            <span className="hamburger-ecosystem-icon">{app.icon}</span>
                                            <div>
                                                <div className="hamburger-ecosystem-name">{app.name}</div>
                                                <div className="hamburger-ecosystem-desc">{app.description}</div>
                                            </div>
                                        </a>
                                    ))}
                                </div>
                                <div className="hamburger-ecosystem-footer">
                                    <a href="https://dwtl.io" target="_blank" rel="noopener noreferrer">dwtl.io</a>
                                    {' · '}
                                    <a href="https://trustshield.tech" target="_blank" rel="noopener noreferrer">TrustShield</a>
                                    {' · '}
                                    <a href="https://darkwavestudios.io" target="_blank" rel="noopener noreferrer">DarkWave Studios</a>
                                </div>
                            </div>
                        )}

                        {/* ── Keyboard Shortcuts Section ── */}
                        {activeSection === 'shortcuts' && (
                            <div className="hamburger-shortcuts">
                                <div className="hamburger-shortcuts-group">
                                    <div className="hamburger-shortcuts-label">Viewport</div>
                                    <div className="hamburger-shortcut"><kbd>W</kbd> Move tool</div>
                                    <div className="hamburger-shortcut"><kbd>E</kbd> Rotate tool</div>
                                    <div className="hamburger-shortcut"><kbd>R</kbd> Scale tool</div>
                                    <div className="hamburger-shortcut"><kbd>F</kbd> Focus selected</div>
                                    <div className="hamburger-shortcut"><kbd>G</kbd> Toggle grid</div>
                                    <div className="hamburger-shortcut"><kbd>Del</kbd> Delete selected</div>
                                </div>
                                <div className="hamburger-shortcuts-group">
                                    <div className="hamburger-shortcuts-label">Playback</div>
                                    <div className="hamburger-shortcut"><kbd>Space</kbd> Play / Pause</div>
                                    <div className="hamburger-shortcut"><kbd>←</kbd> <kbd>→</kbd> Step frame</div>
                                    <div className="hamburger-shortcut"><kbd>Home</kbd> Go to start</div>
                                    <div className="hamburger-shortcut"><kbd>K</kbd> Set keyframe</div>
                                </div>
                                <div className="hamburger-shortcuts-group">
                                    <div className="hamburger-shortcuts-label">General</div>
                                    <div className="hamburger-shortcut"><kbd>Ctrl+S</kbd> Save scene</div>
                                    <div className="hamburger-shortcut"><kbd>Ctrl+Z</kbd> Undo</div>
                                    <div className="hamburger-shortcut"><kbd>Ctrl+Shift+Z</kbd> Redo</div>
                                    <div className="hamburger-shortcut"><kbd>H</kbd> Toggle help</div>
                                    <div className="hamburger-shortcut"><kbd>P</kbd> Command palette</div>
                                </div>
                            </div>
                        )}

                        {/* Sign out */}
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
                        </div>
                    </nav>
                </div>
            )}
        </>
    )
}
