/* ====== TrustGen — Blog Post Page ====== */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'

const API_BASE = import.meta.env.VITE_API_URL || ''

interface BlogPost {
    id: string
    slug: string
    title: string
    content: string
    excerpt: string
    category: string
    tags: string[]
    author: string
    thumbnail_url: string
    published: boolean
    created_at: string
    updated_at: string
}

export function BlogPostPage() {
    const { slug } = useParams<{ slug: string }>()
    const [post, setPost] = useState<BlogPost | null>(null)
    const [loading, setLoading] = useState(true)
    const [notFound, setNotFound] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        if (!slug) return
        fetch(`${API_BASE}/api/blog/${slug}`)
            .then(r => {
                if (!r.ok) { setNotFound(true); setLoading(false); return null }
                return r.json()
            })
            .then(data => { if (data) { setPost(data); setLoading(false) } })
            .catch(() => { setNotFound(true); setLoading(false) })
    }, [slug])

    // SEO: Update document title
    useEffect(() => {
        if (post) {
            document.title = `${post.title} — TrustGen Blog`
            // Add/update meta description
            let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement
            if (!meta) {
                meta = document.createElement('meta')
                meta.name = 'description'
                document.head.appendChild(meta)
            }
            meta.content = post.excerpt || post.content.substring(0, 160)
        }
        return () => { document.title = 'TrustGen — 3D Engine' }
    }, [post])

    if (loading) {
        return (
            <div className="explore-page">
                <div style={{ textAlign: 'center', padding: '120px 24px', color: 'var(--text-muted)' }}>
                    Loading...
                </div>
            </div>
        )
    }

    if (notFound || !post) {
        return (
            <div className="explore-page">
                <div style={{ textAlign: 'center', padding: '120px 24px' }}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
                    <h2 style={{ color: 'var(--text-primary)', marginBottom: 8 }}>Post Not Found</h2>
                    <p style={{ color: 'var(--text-muted)' }}>This blog post doesn't exist.</p>
                    <button className="btn" style={{ marginTop: 16 }} onClick={() => navigate('/blog')}>
                        ← Back to Blog
                    </button>
                </div>
                <Footer />
            </div>
        )
    }

    const readingTime = Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200))

    return (
        <div className="explore-page">
            <article className="legal-page" style={{ maxWidth: 700 }}>
                {/* Back nav */}
                <button
                    className="feature-card-cta"
                    style={{ marginBottom: 24 }}
                    onClick={() => navigate('/blog')}
                >
                    ← Back to Blog
                </button>

                {/* Header */}
                <div className="legal-header" style={{ textAlign: 'left' }}>
                    <div className="feature-card-category" style={{ marginBottom: 12 }}>{post.category}</div>
                    <h1 style={{ fontSize: 32, lineHeight: 1.2 }}>{post.title}</h1>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 16 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{post.author}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                            {new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{readingTime} min read</span>
                    </div>
                </div>

                {/* Thumbnail */}
                {post.thumbnail_url && (
                    <img
                        src={post.thumbnail_url}
                        alt={post.title}
                        style={{
                            width: '100%', borderRadius: 'var(--radius-md)',
                            marginBottom: 32, border: '1px solid var(--border)',
                        }}
                    />
                )}

                {/* Content */}
                <div className="legal-content" dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} />

                {/* Tags */}
                {post.tags && post.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
                        {post.tags.map(tag => (
                            <span key={tag} style={{
                                padding: '4px 12px', borderRadius: 'var(--radius-round)',
                                background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)',
                                color: 'var(--accent)', fontSize: 11,
                            }}>
                                #{tag}
                            </span>
                        ))}
                    </div>
                )}

                {/* Share */}
                <div style={{ marginTop: 32, display: 'flex', gap: 12 }}>
                    <button className="btn btn-sm" onClick={() => {
                        navigator.clipboard.writeText(window.location.href)
                    }}>
                        🔗 Copy Link
                    </button>
                    <a
                        className="btn btn-sm"
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        𝕏 Share
                    </a>
                </div>
            </article>
            <Footer />
        </div>
    )
}

/** Simple markdown-like content formatting */
function formatContent(content: string): string {
    return content
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br/>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code style="background:rgba(168,85,247,0.1);padding:2px 6px;border-radius:4px;font-family:var(--font-mono);font-size:13px">$1</code>')
}
