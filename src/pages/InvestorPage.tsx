/* ====== TrustGen — Investor Summary Page ====== */
import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'

const KEY_METRICS = [
    { label: 'Total Addressable Market', value: '$48B', sub: '3D content creation by 2028' },
    { label: 'Trust Layer Ecosystem', value: '12+', sub: 'Connected apps & services' },
    { label: 'AI Model Gen Cost', value: '$0.00', sub: 'In-house procedural engine' },
    { label: 'Target Launch', value: 'Q3 2026', sub: 'August 23, 2026' },
]

const REVENUE_STREAMS = [
    { title: 'SaaS Subscriptions', desc: 'Pro ($19/mo) and Enterprise ($49/mo) tiers with AI generation, priority rendering, and team features.', pct: '60%' },
    { title: 'AI Generation Credits', desc: 'Pay-per-use AI model generation beyond plan limits. Scales with usage.', pct: '20%' },
    { title: 'Trust Layer Rewards', desc: 'Signal (SIG) ecosystem rewards for platform activity. Transaction fees on hallmark verification.', pct: '10%' },
    { title: 'Enterprise Licensing', desc: 'White-label 3D creation tools for studios and agencies. Custom integrations.', pct: '10%' },
]

const TECH_STACK = [
    { name: 'Frontend', detail: 'React 19, Three.js, Vite, Vercel' },
    { name: 'Backend', detail: 'Node.js, Express, PostgreSQL, Render' },
    { name: 'AI Engine', detail: 'In-house Procedural Gen, OpenAI GPT-4o' },
    { name: 'Blockchain', detail: 'Trust Layer (hallmarks, SIG rewards)' },
    { name: 'Payments', detail: 'Stripe (subscriptions, credits)' },
    { name: 'Comms', detail: 'Twilio (SMS), Signal Chat (support)' },
]

const MILESTONES = [
    { date: 'Q1 2026', status: 'done', text: 'Core 3D editor with real-time rendering' },
    { date: 'Q1 2026', status: 'done', text: 'In-house procedural generation engine (characters, creatures, nature)' },
    { date: 'Q1 2026', status: 'done', text: 'Trust Layer SSO and hallmark system' },
    { date: 'Q2 2026', status: 'current', text: 'Platform launch with billing and blog' },
    { date: 'Q2 2026', status: 'upcoming', text: 'Mobile app (PWA) and team collaboration' },
    { date: 'Q3 2026', status: 'upcoming', text: 'Trust Layer mainnet launch (Aug 23)' },
    { date: 'Q4 2026', status: 'upcoming', text: 'Enterprise tier + white-label licensing' },
    { date: '2027', status: 'upcoming', text: 'AI animation and real-time multiplayer editing' },
]

export function InvestorPage() {
    const navigate = useNavigate()

    return (
        <div className="explore-page">
            {/* Hero */}
            <section className="explore-hero" style={{ padding: '80px 24px 60px' }}>
                <div className="explore-hero-bg" />
                <div className="explore-hero-content">
                    <div className="explore-hero-badge">📈 Investor Summary</div>
                    <h1>TrustGen — 3D Creation Platform</h1>
                    <p>
                        AI-powered 3D asset creation with blockchain-verified provenance.
                        Part of the Trust Layer ecosystem by DarkWave Studios LLC.
                    </p>
                </div>
            </section>

            <div className="legal-page" style={{ maxWidth: 900 }}>
                {/* Executive Summary */}
                <section style={{ marginBottom: 48 }}>
                    <h2 className="explore-section-title" style={{ textAlign: 'left', fontSize: 20 }}>
                        Executive Summary
                    </h2>
                    <div className="legal-content">
                        <p>
                            TrustGen is a browser-based 3D creation platform that combines professional modeling,
                            AI-powered asset generation, and blockchain provenance verification into a single SaaS product.
                            Every 3D asset created on TrustGen is automatically hallmarked on Trust Layer's blockchain,
                            providing immutable proof of creation, ownership, and authenticity.
                        </p>
                        <p>
                            The platform targets independent creators, small studios, and enterprises who need
                            production-quality 3D content without the overhead of desktop software. Our AI generation
                            pipeline allows users to describe objects in natural language and receive textured 3D models
                            in seconds, dramatically reducing the barrier to 3D content creation.
                        </p>
                        <p>
                            TrustGen is the flagship creative application in the Trust Layer ecosystem,
                            which includes 12+ connected services sharing a unified identity system (TLID),
                            cross-app messaging (Signal Chat), and a blockchain-backed trust verification layer.
                        </p>
                    </div>
                </section>

                {/* Key Metrics */}
                <section style={{ marginBottom: 48 }}>
                    <h2 className="explore-section-title" style={{ textAlign: 'left', fontSize: 20 }}>
                        Key Metrics
                    </h2>
                    <div className="health-grid">
                        {KEY_METRICS.map(m => (
                            <div key={m.label} className="health-card">
                                <div className="health-card-label">{m.label}</div>
                                <div className="health-card-value" style={{ color: 'var(--accent)' }}>{m.value}</div>
                                <div className="health-card-sub">{m.sub}</div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Revenue Streams */}
                <section style={{ marginBottom: 48 }}>
                    <h2 className="explore-section-title" style={{ textAlign: 'left', fontSize: 20 }}>
                        Revenue Streams
                    </h2>
                    <div className="legal-cards">
                        {REVENUE_STREAMS.map(r => (
                            <div key={r.title} className="legal-card" style={{ cursor: 'default' }}>
                                <div className="legal-card-icon" style={{
                                    fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)',
                                    background: 'rgba(168, 85, 247, 0.15)', color: 'var(--accent)',
                                    padding: '8px 12px', borderRadius: 'var(--radius-sm)', minWidth: 48, textAlign: 'center',
                                }}>
                                    {r.pct}
                                </div>
                                <div>
                                    <h3>{r.title}</h3>
                                    <p>{r.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Tech Stack */}
                <section style={{ marginBottom: 48 }}>
                    <h2 className="explore-section-title" style={{ textAlign: 'left', fontSize: 20 }}>
                        Technology Stack
                    </h2>
                    <div className="env-grid">
                        {TECH_STACK.map(t => (
                            <div key={t.name} className="env-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                                <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-sans)' }}>{t.name}</span>
                                <span style={{ fontSize: 11, fontFamily: 'var(--font-sans)' }}>{t.detail}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Roadmap */}
                <section style={{ marginBottom: 48 }}>
                    <h2 className="explore-section-title" style={{ textAlign: 'left', fontSize: 20 }}>
                        Product Roadmap
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {MILESTONES.map((m, i) => (
                            <div key={i} style={{
                                display: 'flex', gap: 16, alignItems: 'flex-start',
                                padding: '12px 16px', borderRadius: 'var(--radius-sm)',
                                background: m.status === 'current' ? 'rgba(168, 85, 247, 0.08)' : 'transparent',
                                border: m.status === 'current' ? '1px solid rgba(168, 85, 247, 0.2)' : '1px solid transparent',
                            }}>
                                <div style={{
                                    width: 12, height: 12, borderRadius: '50%', marginTop: 4, flexShrink: 0,
                                    background: m.status === 'done' ? 'var(--success)'
                                        : m.status === 'current' ? 'var(--accent)' : 'var(--border)',
                                    boxShadow: m.status === 'done' ? '0 0 6px rgba(0,184,148,0.4)'
                                        : m.status === 'current' ? '0 0 6px rgba(168,85,247,0.4)' : 'none',
                                }} />
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 2 }}>{m.date}</div>
                                    <div style={{ fontSize: 14, color: m.status === 'upcoming' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                        {m.text}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Contact */}
                <section style={{ marginBottom: 48 }}>
                    <h2 className="explore-section-title" style={{ textAlign: 'left', fontSize: 20 }}>
                        Contact
                    </h2>
                    <div className="health-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                        <div className="health-card">
                            <div className="health-card-label">Company</div>
                            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>DarkWave Studios LLC</div>
                            <div className="health-card-sub">
                                <a href="https://darkwavestudios.io" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-2)' }}>
                                    darkwavestudios.io
                                </a>
                            </div>
                        </div>
                        <div className="health-card">
                            <div className="health-card-label">Email</div>
                            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
                                <a href="mailto:team@dwsc.io" style={{ color: 'var(--accent-2)' }}>team@dwsc.io</a>
                            </div>
                            <div className="health-card-sub">General & investor inquiries</div>
                        </div>
                        <div className="health-card">
                            <div className="health-card-label">Ecosystem</div>
                            <div style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: 600 }}>
                                <a href="https://dwtl.io" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-2)' }}>
                                    Trust Layer (dwtl.io)
                                </a>
                            </div>
                            <div className="health-card-sub">Blockchain infrastructure</div>
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <div style={{ textAlign: 'center', padding: '32px 0 48px' }}>
                    <button className="explore-hero-cta" onClick={() => navigate('/explore')}>
                        Explore the Platform →
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    )
}
