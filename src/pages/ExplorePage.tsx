/* ====== TrustGen — Explore Page ====== */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'

// ── Hero carousel slides (images served from /public) ──
const HERO_SLIDES = [
    { src: '/heroes/hero-3d-studio.png', label: '3D Creation Studio', sub: 'Build stunning scenes with professional-grade tools' },
    { src: '/heroes/hero-ai-generation.png', label: 'AI Model Generation', sub: 'Describe any object and watch AI bring it to life' },
    { src: '/heroes/hero-animation.png', label: 'Animation Timeline', sub: 'Keyframe animation with easing curves and real-time preview' },
    { src: '/heroes/hero-effects.png', label: 'Post-Processing & FX', sub: 'Bloom, SSAO, depth of field, and cinematic color grading' },
    { src: '/heroes/hero-blockchain.png', label: 'Trust Layer', sub: 'Blockchain-verified provenance for every creation' },
]

const SLIDE_DURATION = 6000 // ms per slide

const FEATURES = [
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
        category: 'Blockchain',
        title: 'Trust Layer Integration',
        description: 'Every creation is hallmarked on Trust Layer\'s blockchain. Verify authenticity, track provenance, and earn Signal (SIG) rewards.',
        path: '/dashboard',
        cta: 'Learn More',
    },
    {
        icon: '💎',
        category: 'Plans',
        title: 'Subscription Plans',
        description: 'Free tier with full 3D editor access. Pro and Enterprise plans unlock advanced AI generation, priority rendering, and team features.',
        path: '/billing',
        cta: 'View Plans',
    },
    {
        icon: '📱',
        category: 'Notifications',
        title: 'SMS Alerts',
        description: 'Get real-time notifications for render completions, collaboration invites, and account security alerts via SMS.',
        path: '/sms-opt-in',
        cta: 'Enable SMS',
    },
]

export function ExplorePage() {
    const navigate = useNavigate()
    const [currentSlide, setCurrentSlide] = useState(0)
    const [nextSlide, setNextSlide] = useState<number | null>(null)
    const [transitioning, setTransitioning] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const goToSlide = useCallback((idx: number) => {
        if (idx === currentSlide || transitioning) return
        setNextSlide(idx)
        setTransitioning(true)

        // After crossfade completes, swap
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

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [currentSlide, goToSlide])

    const activeLabel = HERO_SLIDES[nextSlide ?? currentSlide]

    return (
        <div className="explore-page">
            {/* ═══ Hero Carousel ═══ */}
            <section className="hero-carousel">
                {/* Background images with crossfade */}
                <div className="hero-carousel-bg">
                    {/* Current slide */}
                    <div
                        className="hero-slide"
                        style={{
                            backgroundImage: `url(${HERO_SLIDES[currentSlide].src})`,
                            opacity: nextSlide !== null ? 0 : 1,
                        }}
                    />
                    {/* Next slide (fades in) */}
                    {nextSlide !== null && (
                        <div
                            className="hero-slide hero-slide-enter"
                            style={{
                                backgroundImage: `url(${HERO_SLIDES[nextSlide].src})`,
                            }}
                        />
                    )}
                    {/* Gradient overlay */}
                    <div className="hero-carousel-overlay" />
                </div>

                {/* Text content */}
                <div className="hero-carousel-content">
                    <div className="explore-hero-badge">
                        ◈ Trust Layer Ecosystem App
                    </div>
                    <h1>Create. Animate. Export.</h1>
                    <p className="hero-carousel-sub">
                        The premium AI-powered 3D creation platform — all in your browser.
                    </p>
                    <div className="hero-carousel-label" key={activeLabel.label}>
                        {activeLabel.label}
                    </div>
                    <div className="hero-carousel-label-sub">
                        {activeLabel.sub}
                    </div>
                    <button
                        className="explore-hero-cta"
                        onClick={() => navigate('/editor')}
                    >
                        Try the Studio Free →
                    </button>
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

            {/* ═══ Features ═══ */}
            <section className="explore-features">
                <h2 className="explore-section-title">Platform Features</h2>
                <p className="explore-section-sub">
                    Everything you need to create, animate, and ship 3D content
                </p>

                <div className="feature-grid">
                    {FEATURES.map(feature => (
                        <div
                            key={feature.title}
                            className="feature-card"
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
