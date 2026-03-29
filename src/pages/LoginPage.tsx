/* ====== TrustGen — Login / Register Page (Ultra-Premium) ====== */
import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import KenBurnsBackground from '../components/KenBurnsBackground'

export function LoginPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const {
        login, register, biometricLogin, biometricAvailable,
        loading, error, clearError, isAuthenticated,
    } = useAuthStore()

    const returnTo = searchParams.get('returnTo') || '/dashboard'
    const reason = searchParams.get('reason')

    // If already authenticated, redirect to returnTo
    useEffect(() => {
        if (isAuthenticated) {
            navigate(returnTo, { replace: true })
        }
    }, [isAuthenticated, navigate, returnTo])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (mode === 'login') {
            await login(email, password)
        } else {
            await register(email, password, name)
        }
    }

    const handleBiometric = async () => {
        if (!biometricAvailable()) {
            alert('Biometric authentication is not available on this device.')
            return
        }
        await biometricLogin()
    }

    return (
        <div className="auth-page" style={{ position: 'relative', overflow: 'hidden' }}>
            {/* Cinematic Ken Burns Hero Background */}
            <KenBurnsBackground
                images={[
                    '/heroes/hero-3d-studio.png',
                    '/heroes/hero-ai-generation.png',
                    '/heroes/hero-animation.png',
                    '/heroes/hero-blockchain.png',
                    '/heroes/hero-effects.png'
                ]}
                overlayOpacity={0.7}
                duration={10000}
            />

            <div className="auth-card" style={{ zIndex: 10, position: 'relative' }}>
                <div className="auth-brand">
                    <div className="auth-brand-icon">◈</div>
                    <h1>TrustGen</h1>
                    <p>{mode === 'login' ? 'Sign in to your 3D workspace' : 'Create your 3D workspace'}</p>
                </div>

                {/* Reason banner — shown when redirected from a gated action */}
                {reason && (
                    <div className="auth-reason-banner">
                        <span className="auth-reason-icon">🔒</span>
                        <span>Sign in to <strong>{reason.replace(/-/g, ' ')}</strong> your work</span>
                    </div>
                )}

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

                    {/* Biometric / Passkey Login */}
                    <button
                        type="button"
                        className="auth-biometric-btn"
                        onClick={handleBiometric}
                        disabled={loading}
                    >
                        <span className="auth-biometric-icon">🔐</span>
                        Sign in with Biometrics
                    </button>

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

                {/* Platform links — all visible at proper size */}
                <div className="auth-links">
                    <a href="/explore">← Explore Platform</a>
                    <span className="auth-links-sep">·</span>
                    <a href="/dev-portal">🛠️ Developer Portal</a>
                    <span className="auth-links-sep">·</span>
                    <a href="/investors">Investors</a>
                    <span className="auth-links-sep">·</span>
                    <a href="/blog">Blog</a>
                    <span className="auth-links-sep">·</span>
                    <a href="/legal">Legal</a>
                </div>
            </div>
        </div>
    )
}
