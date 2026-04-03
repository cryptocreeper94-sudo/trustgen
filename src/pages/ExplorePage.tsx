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
        image: '/features/lume_ide.jpg',
        category: 'Lume IDE',
        title: 'Intent-Resolving 3D IDE',
        description: 'Write Lume code or speak plain English. The 7-layer Tolerance Chain resolves your intent directly to 3D engine API calls — no scripting syntax, no translation burden.',
        path: '/editor',
        cta: 'Open IDE',
        accent: 'violet',
    },
    {
        image: '/features/studio_creation.jpg',
        category: 'Creation',
        title: '3D Creation Studio',
        description: 'Build stunning 3D scenes with primitives, materials, lighting, and real-time preview. Professional-grade tools in your browser.',
        path: '/editor',
        cta: 'Open Studio',
        accent: 'amber',
    },
    {
        image: '/features/ai_generation.jpg',
        category: 'AI Powered',
        title: 'AI Model Generation',
        description: 'Generate characters, creatures, trees, flowers, rocks, and more with our in-house procedural engine. 44 presets, infinite customization, zero external dependencies.',
        path: '/editor',
        cta: 'Try AI Gen',
        accent: 'emerald',
    },
    {
        image: '/features/animation_curve.jpg',
        category: 'Animation',
        title: 'Animation Timeline',
        description: 'Keyframe animation system with easing curves, playback controls, and real-time preview. Animate position, rotation, scale, and materials.',
        path: '/editor',
        cta: 'Animate',
        accent: 'red',
    },
    {
        image: '/features/voice_profiles.jpg',
        category: 'Voice & FX',
        title: 'Voice Commands & Effects',
        description: 'Speak your 3D commands naturally with adaptive voice profiles. Plus bloom, SSAO, depth of field, chromatic aberration, and cinematic color grading.',
        path: '/editor',
        cta: 'Try Voice',
        accent: 'blue',
    },
    {
        image: '/features/trust_layer.jpg',
        category: 'Ecosystem',
        title: 'Trust Layer Integration',
        description: 'Part of the Trust Layer ecosystem. SSO authentication, verified provenance, model import/export, and seamless connection to 36 ecosystem apps.',
        path: '/dashboard',
        cta: 'Learn More',
        accent: 'teal',
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
                    <span className="stat-number gradient-text">160+</span>
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
    const carouselRef = useRef<HTMLDivElement>(null)
    const [featuresIndex, setFeaturesIndex] = useState(0)

    const scrollFeatureCarousel = (direction: 'left' | 'right') => {
        if (carouselRef.current) {
            const cardWidth = window.innerWidth > 768 ? 624 : 304; 
            carouselRef.current.scrollBy({ left: direction === 'left' ? -cardWidth : cardWidth, behavior: 'smooth' })
        }
    }

    const handleCarouselScroll = useCallback(() => {
        if (!carouselRef.current) return
        const scrollLeft = carouselRef.current.scrollLeft
        const cardWidth = window.innerWidth > 768 ? 624 : 304
        const index = Math.round(scrollLeft / cardWidth)
        if (index !== featuresIndex) {
            setFeaturesIndex(index)
        }
    }, [featuresIndex])

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
                        The deterministic 3D studio with a built-in Lume IDE.
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
                        <a className="explore-hero-cta-secondary" href="https://dwsc.io#papers" target="_blank" rel="noopener">
                            Read the Research
                        </a>
                    </div>
                </div>
            </section>

            {/* ═══ Stats Ticker ═══ */}
            <StatsTicker />

            {/* ═══ Features ═══ */}
            <section className="explore-features">
                <h2 className="explore-section-title">Platform Features</h2>
                <p className="explore-section-sub">
                    A complete 3D creation platform with the world's first intent-resolving IDE
                </p>

                <div className="features-carousel-container">
                    <div 
                        className="features-carousel" 
                        ref={carouselRef} 
                        onScroll={handleCarouselScroll}
                    >
                        {FEATURES.map(feature => (
                            <div
                                key={feature.title}
                                className="feature-card-cinematic"
                                style={{ backgroundImage: `url(${feature.image})` }}
                                onClick={() => navigate(feature.path)}
                            >
                                {/* Void Glass overlay */}
                                <div className="feature-card-cinematic-glass">
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
                    {/* Cinematic Controls */}
                    <div className="carousel-controls">
                        <button className="carousel-arrow interactive" onClick={() => scrollFeatureCarousel('left')}>←</button>
                        <div className="carousel-dots">
                            {FEATURES.map((_, idx) => (
                                <div key={idx} className={`carousel-dot ${idx === featuresIndex ? 'active' : ''}`} />
                            ))}
                        </div>
                        <button className="carousel-arrow interactive" onClick={() => scrollFeatureCarousel('right')}>→</button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <Footer />
        </div>
    )
}
