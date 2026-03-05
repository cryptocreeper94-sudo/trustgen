/* ====== TrustGen — Explore Page ====== */
import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'

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
        description: 'Describe any object and watch AI bring it to life as a textured 3D model. Powered by Meshy.ai with up to 800 character prompts.',
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

    return (
        <div className="explore-page">
            {/* Hero */}
            <section className="explore-hero">
                <div className="explore-hero-bg" />
                <div className="explore-hero-content">
                    <div className="explore-hero-badge">
                        ◈ Trust Layer Ecosystem App
                    </div>
                    <h1>Create. Animate. Export.</h1>
                    <p>
                        The premium AI-powered 3D creation platform. Build stunning scenes,
                        generate models with AI, animate with keyframes, and export
                        production-ready assets — all in your browser.
                    </p>
                    <button
                        className="explore-hero-cta"
                        onClick={() => navigate('/login')}
                    >
                        Get Started Free →
                    </button>
                </div>
            </section>

            {/* Features */}
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
