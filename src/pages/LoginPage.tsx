/* ====== TrustGen — Login / Register Page ====== */
import { useState, type FormEvent } from 'react'
import { useAuthStore } from '../stores/authStore'

export function LoginPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const { login, register, loading, error, clearError } = useAuthStore()

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (mode === 'login') {
            await login(email, password)
        } else {
            await register(email, password, name)
        }
    }

    return (
        <div className="auth-page">
            {/* Animated background gradient mesh */}
            <div className="auth-bg" style={{
                background: 'radial-gradient(ellipse at 20% 50%, rgba(168,85,247,0.15), transparent 60%), radial-gradient(ellipse at 80% 50%, rgba(6,182,212,0.1), transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(217,70,239,0.08), transparent 50%), var(--bg-void)',
            }} />

            <div className="auth-card">
                <div className="auth-brand">
                    <div className="auth-brand-icon">◈</div>
                    <h1>TrustGen</h1>
                    <p>{mode === 'login' ? 'Sign in to your 3D workspace' : 'Create your 3D workspace'}</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    {mode === 'register' && (
                        <div className="auth-field">
                            <label>Full Name</label>
                            <input
                                className="auth-input"
                                type="text"
                                placeholder="Your name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="auth-field">
                        <label>Email Address</label>
                        <input
                            className="auth-input"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label>Password</label>
                        <input
                            className="auth-input"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>

                    {error && <div className="auth-error">{error}</div>}

                    <button className="auth-submit" type="submit" disabled={loading}>
                        {loading ? '...' : mode === 'login' ? 'Sign In' : 'Create Account'}
                    </button>

                    <div className="auth-divider">or</div>

                    {/* Trust Layer SSO */}
                    <button
                        type="button"
                        className="auth-sso-btn"
                        onClick={() => {
                            const redirectUrl = encodeURIComponent(window.location.origin + '/api/auth/sso-callback')
                            window.location.href = `https://dwtl.io/hub/sso?app=trustgen&redirect=${redirectUrl}`
                        }}
                    >
                        <span className="auth-sso-icon">◈</span>
                        Sign in with Trust Layer
                    </button>

                    <div className="auth-toggle">
                        {mode === 'login' ? (
                            <>Don't have an account? <button type="button" onClick={() => { setMode('register'); clearError() }}>Sign Up</button></>
                        ) : (
                            <>Already have an account? <button type="button" onClick={() => { setMode('login'); clearError() }}>Sign In</button></>
                        )}
                    </div>
                </form>

                {/* Platform links */}
                <div className="auth-links">
                    <a href="/explore">← Explore Platform</a>
                    <span className="auth-links-sep">·</span>
                    <a href="/investors">Investors</a>
                    <span className="auth-links-sep">·</span>
                    <a href="/blog">Blog</a>
                    <span className="auth-links-sep">·</span>
                    <a href="/legal">Legal</a>
                </div>
                <div className="auth-links" style={{ marginTop: 4 }}>
                    <a href="/dev-portal" style={{ opacity: 0.5, fontSize: 10 }}>🛠️ Developer Portal</a>
                </div>
            </div>
        </div>
    )
}
