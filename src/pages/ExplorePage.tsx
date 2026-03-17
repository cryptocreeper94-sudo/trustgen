/* ====== TrustGen — Cinematic Explore Page ====== */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'

// ── Hero carousel slides ──
const HERO_SLIDES = [
    { src: '/heroes/hero-3d-studio.png', label: '3D Creation Studio', sub: 'Build stunning scenes with professional-grade tools' },
    { src: '/heroes/hero-ai-generation.png', label: 'AI Model Generation', sub: 'Describe any object and watch AI bring it to life' },
    { src: '/heroes/hero-animation.png', label: 'Animation Timeline', sub: 'Keyframe animation with easing curves and real-time preview' },
    { src: '/heroes/hero-effects.png', label: 'Post-Processing & FX', sub: 'Bloom, SSAO, depth of field, and cinematic color grading' },
    { src: '/heroes/hero-blockchain.png', label: 'Trust Layer', sub: 'Verified provenance for every creation' },
]

const SLIDE_DURATION = 6000

const FEATURES = [
    {
        icon: '✦',
        category: 'Lume IDE',
        title: 'Built-In Lume IDE',
        description: 'Write Lume code directly in TrustGen with full Monaco editor integration, syntax highlighting, and Lume language support. Compile English Mode to 3D scenes with the Tolerance Chain.',
        path: '/editor',
        cta: 'Open IDE',
        highlight: true,
    },
    {
        icon: '🎨',
        category: 'Creation',
        title: '3D Creation Studio',
        description: 'Build stunning 3D scenes with primitives, materials, lighting, and real-time preview. Professional-grade tools in your browser.',
        path: '/editor',
        cta: 'Open Studio',
    },
    {
        icon: '🤖',
        category: 'AI Powered',
        title: 'AI Model Generation',
        description: 'Generate characters, creatures, trees, flowers, rocks, and more with our in-house procedural engine. 44 presets, infinite customization, zero external dependencies.',
        path: '/editor',
        cta: 'Try AI Gen',
    },
    {
        icon: '🎬',
        category: 'Animation',
        title: 'Animation Timeline',
        description: 'Keyframe animation system with easing curves, playback controls, and real-time preview. Animate position, rotation, scale, and materials.',
        path: '/editor',
        cta: 'Animate',
    },
    {
        icon: '🎙️',
        category: 'Voice',
        title: 'Adaptive Voice Profiles',
        description: 'Speak your 3D commands naturally. TrustGen learns your dialect, accent, and filler words — the IDE adapts to you, not the other way around.',
        path: '/editor',
        cta: 'Try Voice',
    },
    {
        icon: '✨',
        category: 'Effects',
        title: 'Post-Processing & FX',
        description: 'Bloom, SSAO, depth of field, chromatic aberration, film grain, and color grading. Cinematic quality rendering in real-time.',
        path: '/editor',
        cta: 'Add Effects',
    },
    {
        icon: '📦',
        category: 'Export',
        title: 'Model Import & Export',
        description: 'Import GLTF/GLB models, export your scenes in multiple formats. Full pipeline from creation to production-ready assets.',
        path: '/editor',
        cta: 'Import/Export',
    },
    {
        icon: '🔐',
        category: 'Trust Layer',
        title: 'Ecosystem Integration',
        description: 'Part of the Trust Layer ecosystem. SSO authentication, verified provenance, and seamless connection to 36 ecosystem apps.',
        path: '/dashboard',
        cta: 'Learn More',
    },
]

// ── Floating Particle Component ──
function FloatingParticles() {
    return (
        <div className="particles-container" aria-hidden="true">
            {Array.from({ length: 30 }).map((_, i) => (
                <div
                    key={i}
                    className="particle"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        width: `${2 + Math.random() * 4}px`,
                        height: `${2 + Math.random() * 4}px`,
                        animationDelay: `${Math.random() * 8}s`,
                        animationDuration: `${6 + Math.random() * 8}s`,
                        opacity: 0.1 + Math.random() * 0.3,
                    }}
                />
            ))}
        </div>
    )
}

// ── Lume IDE Showcase Section ──
function LumeIDEShowcase() {
    const navigate = useNavigate()
    const [typedCode, setTypedCode] = useState('')
    const fullCode = `mode: english

create a metallic sphere
place it at the center
add a cyan point light above it
rotate the sphere slowly
show me the scene`

    useEffect(() => {
        let i = 0
        const interval = setInterval(() => {
            if (i <= fullCode.length) {
                setTypedCode(fullCode.slice(0, i))
                i++
            } else {
                clearInterval(interval)
            }
        }, 35)
        return () => clearInterval(interval)
    }, [])

    return (
        <section className="lume-ide-showcase">
            <div className="lume-ide-label">◈ Powered by Lume</div>
            <h2 className="lume-ide-title">
                The First <span className="gradient-text">Intent-Resolving</span> 3D IDE
            </h2>
            <p className="lume-ide-subtitle">
                Speak or type natural English. The Lume Tolerance Chain resolves your intent
                directly to 3D engine API calls. No scripting syntax. No translation burden.
                Just describe what you want.
            </p>

            <div className="lume-ide-demo">
                {/* Code panel */}
                <div className="ide-code-panel">
                    <div className="ide-tab-bar">
                        <div className="ide-tab active">scene.lume</div>
                        <div className="ide-tab">materials.lume</div>
                    </div>
                    <pre className="ide-code">
                        <code>
                            {typedCode}
                            <span className="cursor-blink">|</span>
                        </code>
                    </pre>
                    <div className="ide-status-bar">
                        <span>✦ Lume v0.8.0</span>
                        <span>Tolerance Chain: 7 layers</span>
                        <span className="ide-status-ready">● Ready</span>
                    </div>
                </div>

                {/* Output panel */}
                <div className="ide-output-panel">
                    <div className="ide-tab-bar">
                        <div className="ide-tab active">3D Preview</div>
                    </div>
                    <div className="ide-3d-preview">
                        <div className="preview-sphere" />
                        <div className="preview-light" />
                        <div className="preview-grid" />
                    </div>
                    <div className="ide-status-bar">
                        <span>WebGL2</span>
                        <span>Objects: 3</span>
                        <span className="ide-status-ready">● Compiled</span>
                    </div>
                </div>
            </div>

            <div className="lume-ide-cta-row">
                <button className="lume-cta-primary" onClick={() => navigate('/editor')}>
                    ◈ Try the IDE Free →
                </button>
                <a className="lume-cta-secondary" href="https://dwsc.io#papers" target="_blank" rel="noopener">
                    📄 Read the Research
                </a>
                <a className="lume-cta-secondary" href="https://dwsc.io" target="_blank" rel="noopener">
                    🔬 DWSC.io
                </a>
            </div>
        </section>
    )
}

// ── Stats Ticker ──
function StatsTicker() {
    return (
        <section className="stats-ticker">
            <div className="stats-ticker-inner">
                <div className="stat-item">
                    <span className="stat-number gradient-text">7</span>
                    <span className="stat-label">Tolerance Chain Layers</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-number gradient-text">34+</span>
                    <span className="stat-label">English Patterns</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-number gradient-text">44</span>
                    <span className="stat-label">AI Gen Presets</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-number gradient-text">10</span>
                    <span className="stat-label">Languages</span>
                </div>
                <div className="stat-divider" />
                <div className="stat-item">
                    <span className="stat-number gradient-text">0</span>
                    <span className="stat-label">CD Target Score</span>
                </div>
            </div>
        </section>
    )
}

export function ExplorePage() {
    const navigate = useNavigate()
    const [currentSlide, setCurrentSlide] = useState(0)
    const [nextSlide, setNextSlide] = useState<number | null>(null)
    const [transitioning, setTransitioning] = useState(false)
    const [heroVisible, setHeroVisible] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const goToSlide = useCallback((idx: number) => {
        if (idx === currentSlide || transitioning) return
        setNextSlide(idx)
        setTransitioning(true)
        setTimeout(() => {
            setCurrentSlide(idx)
            setNextSlide(null)
            setTransitioning(false)
        }, 800)
    }, [currentSlide, transitioning])

    // Auto-rotate
    useEffect(() => {
        timerRef.current = setTimeout(() => {
            const next = (currentSlide + 1) % HERO_SLIDES.length
            goToSlide(next)
        }, SLIDE_DURATION)
        return () => { if (timerRef.current) clearTimeout(timerRef.current) }
    }, [currentSlide, goToSlide])

    // Entrance animation
    useEffect(() => {
        const timer = setTimeout(() => setHeroVisible(true), 200)
        return () => clearTimeout(timer)
    }, [])

    const activeLabel = HERO_SLIDES[nextSlide ?? currentSlide]

    return (
        <div className="explore-page">
            {/* ═══ Cinematic Hero ═══ */}
            <section className={`hero-carousel cinematic ${heroVisible ? 'hero-visible' : ''}`}>
                <FloatingParticles />

                {/* Background images with crossfade */}
                <div className="hero-carousel-bg">
                    <div
                        className="hero-slide"
                        style={{
                            backgroundImage: `url(${HERO_SLIDES[currentSlide].src})`,
                            opacity: nextSlide !== null ? 0 : 1,
                        }}
                    />
                    {nextSlide !== null && (
                        <div
                            className="hero-slide hero-slide-enter"
                            style={{
                                backgroundImage: `url(${HERO_SLIDES[nextSlide].src})`,
                            }}
                        />
                    )}
                    <div className="hero-carousel-overlay" />
                </div>

                {/* Content */}
                <div className="hero-carousel-content">
                    <div className="explore-hero-badge">
                        ◈ Trust Layer Ecosystem · Lume IDE
                    </div>
                    <h1>
                        <span className="hero-line-1">Create with</span>
                        <span className="hero-line-2 gradient-text">Intent.</span>
                    </h1>
                    <p className="hero-carousel-sub">
                        The AI-powered 3D studio with a built-in Lume IDE.
                        Speak your vision. Watch it compile.
                    </p>
                    <div className="hero-carousel-label" key={activeLabel.label}>
                        {activeLabel.label}
                    </div>
                    <div className="hero-carousel-label-sub">
                        {activeLabel.sub}
                    </div>
                    <div className="hero-cta-group">
                        <button
                            className="explore-hero-cta"
                            onClick={() => navigate('/editor')}
                        >
                            Try the Studio Free →
                        </button>
                        <button
                            className="explore-hero-cta-secondary"
                            onClick={() => {
                                const el = document.querySelector('.lume-ide-showcase')
                                el?.scrollIntoView({ behavior: 'smooth' })
                            }}
                        >
                            See the Lume IDE ↓
                        </button>
                    </div>
                </div>

                {/* Dot navigation */}
                <div className="hero-carousel-dots">
                    {HERO_SLIDES.map((slide, idx) => (
                        <button
                            key={idx}
                            className={`hero-dot ${idx === (nextSlide ?? currentSlide) ? 'active' : ''}`}
                            onClick={() => goToSlide(idx)}
                            title={slide.label}
                        />
                    ))}
                </div>
            </section>

            {/* ═══ Stats Ticker ═══ */}
            <StatsTicker />

            {/* ═══ Lume IDE Showcase ═══ */}
            <LumeIDEShowcase />

            {/* ═══ Features ═══ */}
            <section className="explore-features">
                <h2 className="explore-section-title">Platform Features</h2>
                <p className="explore-section-sub">
                    A complete 3D creation platform with the world's first intent-resolving IDE
                </p>

                <div className="feature-grid">
                    {FEATURES.map(feature => (
                        <div
                            key={feature.title}
                            className={`feature-card ${feature.highlight ? 'feature-card-highlight' : ''}`}
                            onClick={() => navigate(feature.path)}
                        >
                            <div className="feature-card-glow" />
                            <div className="feature-card-image-placeholder">
                                {feature.icon}
                            </div>
                            <div className="feature-card-body">
                                <div className="feature-card-category">{feature.category}</div>
                                <h3>{feature.title}</h3>
                                <p>{feature.description}</p>
                                <button className="feature-card-cta">
                                    {feature.cta} →
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    )
}
