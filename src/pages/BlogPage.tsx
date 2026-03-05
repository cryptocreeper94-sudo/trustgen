/* ====== TrustGen — Blog Page ====== */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'

const API_BASE = import.meta.env.VITE_API_URL || ''

interface BlogPost {
    id: string
    slug: string
    title: string
    excerpt: string
    category: string
    tags: string[]
    author: string
    thumbnail_url: string
    published: boolean
    created_at: string
    updated_at: string
}

const CATEGORIES = ['All', 'Product Updates', 'Tutorials', 'Industry', 'Trust Layer', 'AI & 3D']

export function BlogPage() {
    const [posts, setPosts] = useState<BlogPost[]>([])
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState('All')
    const navigate = useNavigate()

    useEffect(() => {
        fetch(`${API_BASE}/api/blog`)
            .then(r => r.json())
            .then(data => { setPosts(Array.isArray(data) ? data : []); setLoading(false) })
            .catch(() => setLoading(false))
    }, [])

    const filtered = activeCategory === 'All'
        ? posts
        : posts.filter(p => p.category?.toLowerCase() === activeCategory.toLowerCase())

    const featured = filtered[0]
    const rest = filtered.slice(1)

    return (
        <div className="explore-page">
            {/* Hero */}
            <section className="explore-hero" style={{ paddingBottom: 40 }}>
                <div className="explore-hero-bg" />
                <div className="explore-hero-content">
                    <div className="explore-hero-badge">📝 TrustGen Blog</div>
                    <h1>Insights & Updates</h1>
                    <p>AI-powered 3D creation, Trust Layer ecosystem news, tutorials, and industry insights.</p>
                </div>
            </section>

            {/* Categories */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px 32px' }}>
                <div className="dev-tabs" style={{ margin: 0 }}>
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            className={`dev-tab ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setActiveCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Posts */}
            <section className="explore-features">
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)' }}>
                        Loading posts...
                    </div>
                ) : posts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 48 }}>
                        <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
                        <h3 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Blog Coming Soon</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                            AI-generated articles about 3D creation, Trust Layer ecosystem, and industry insights
                            will appear here.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Featured post */}
                        {featured && (
                            <div
                                className="feature-card"
                                style={{ marginBottom: 32, cursor: 'pointer' }}
                                onClick={() => navigate(`/blog/${featured.slug}`)}
                            >
                                <div className="feature-card-glow" />
                                {featured.thumbnail_url ? (
                                    <img className="feature-card-image" src={featured.thumbnail_url} alt={featured.title} />
                                ) : (
                                    <div className="feature-card-image-placeholder" style={{ height: 280, fontSize: 64 }}>📰</div>
                                )}
                                <div className="feature-card-body">
                                    <div className="feature-card-category">{featured.category}</div>
                                    <h3 style={{ fontSize: 24 }}>{featured.title}</h3>
                                    <p>{featured.excerpt}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {featured.author} · {new Date(featured.created_at).toLocaleDateString()}
                                        </span>
                                        <button className="feature-card-cta">Read More →</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Rest */}
                        <div className="feature-grid">
                            {rest.map(post => (
                                <div
                                    key={post.id}
                                    className="feature-card"
                                    onClick={() => navigate(`/blog/${post.slug}`)}
                                >
                                    <div className="feature-card-glow" />
                                    {post.thumbnail_url ? (
                                        <img className="feature-card-image" src={post.thumbnail_url} alt={post.title} />
                                    ) : (
                                        <div className="feature-card-image-placeholder">📄</div>
                                    )}
                                    <div className="feature-card-body">
                                        <div className="feature-card-category">{post.category}</div>
                                        <h3>{post.title}</h3>
                                        <p>{post.excerpt}</p>
                                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                                            {new Date(post.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>

            <Footer />
        </div>
    )
}
