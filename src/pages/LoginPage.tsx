/* ====== TrustGen — Login / Register Page (Ultra-Premium) ====== */
import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { api } from '../api/apiClient'
import KenBurnsBackground from '../components/KenBurnsBackground'

export function LoginPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [name, setName] = useState('')
    const [betaPin, setBetaPin] = useState('')
    const [mustChangePassword, setMustChangePassword] = useState(false)
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [changingPassword, setChangingPassword] = useState(false)
    const [changeError, setChangeError] = useState('')
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const {
        login, register, biometricLogin, biometricAvailable,
        loading, error, clearError, isAuthenticated, user, setUser,
    } = useAuthStore()

    const returnTo = searchParams.get('returnTo') || '/dashboard'
    const reason = searchParams.get('reason')

    // After login, check if password change is required
    useEffect(() => {
        if (isAuthenticated && user?.mustChangePassword) {
            setMustChangePassword(true)
        } else if (isAuthenticated && !mustChangePassword) {
            navigate(returnTo, { replace: true })
        }
    }, [isAuthenticated, user, navigate, returnTo, mustChangePassword])

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        if (mode === 'login') {
            await login(email, password)
        } else {
            await register(email, password, name, betaPin || undefined)
        }
    }

    const handlePasswordChange = async (e: FormEvent) => {
        e.preventDefault()
        setChangeError('')
        if (newPassword.length < 8) {
            setChangeError('Password must be at least 8 characters')
            return
        }
        if (newPassword !== confirmPassword) {
            setChangeError('Passwords do not match')
            return
        }
        if (newPassword === 'Temp12345!') {
            setChangeError('Please choose a password different from the temporary one')
            return
        }
        setChangingPassword(true)
        try {
            await api.post('/api/auth/change-password', {
                currentPassword: password || 'Temp12345!',
                newPassword,
            })
            // Update user state to remove the flag
            if (user) {
                setUser({ ...user, mustChangePassword: false })
            }
            setMustChangePassword(false)
            navigate(returnTo, { replace: true })
        } catch (err: any) {
            setChangeError(err.message || 'Failed to change password')
        } finally {
            setChangingPassword(false)
        }
    }

    const handleBiometric = async () => {
        if (!biometricAvailable()) {
            alert('Biometric authentication is not available on this device.')
            return
        }
        await biometricLogin()
    }

    // ── Password Change Required Screen ──
    if (mustChangePassword) {
        return (
            <div className="auth-page" style={{ position: 'relative', overflow: 'hidden' }}>
                <KenBurnsBackground
                    images={['/heroes/hero-3d-studio.png', '/heroes/hero-ai-generation.png']}
                    overlayOpacity={0.7}
                    duration={10000}
                />
                <div className="auth-card" style={{ zIndex: 10, position: 'relative' }}>
                    <div className="auth-brand">
                        <div className="auth-brand-icon">◈</div>
                        <h1>Welcome, {user?.name}!</h1>
                        <p>Please set your permanent password to continue</p>
                    </div>

                    <div className="auth-reason-banner" style={{ background: 'rgba(6,182,212,0.15)', borderColor: 'rgba(6,182,212,0.3)' }}>
                        <span className="auth-reason-icon">🔑</span>
                        <span>You're logged in with a temporary password. Choose a new one to secure your account.</span>
                    </div>

                    <form className="auth-form" onSubmit={handlePasswordChange}>
                        <div className="auth-field">
                            <label>New Password</label>
                            <input
                                className="auth-input"
                                type="password"
                                placeholder="Choose a strong password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                required
                                minLength={8}
                                autoFocus
                            />
                        </div>

                        <div className="auth-field">
                            <label>Confirm Password</label>
                            <input
                                className="auth-input"
                                type="password"
                                placeholder="Re-enter your password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                            />
                        </div>

                        {changeError && <div className="auth-error">{changeError}</div>}

                        <button className="auth-submit" type="submit" disabled={changingPassword}>
                            {changingPassword ? 'Updating...' : 'Set Password & Continue'}
                        </button>
                    </form>

                    <div className="auth-links">
                        <span style={{ fontSize: '12px', opacity: 0.6 }}>Enterprise Beta Tester · Full Access</span>
                    </div>
                </div>
            </div>
        )
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
                    {mode === 'register' && (
                        <div className="auth-field">
                            <label>Beta PIN <span style={{ opacity: 0.4, fontWeight: 400 }}>(optional)</span></label>
                            <input
                                className="auth-input"
                                type="text"
                                placeholder="6-digit PIN"
                                value={betaPin}
                                onChange={e => setBetaPin(e.target.value)}
                                maxLength={6}
                                style={{ letterSpacing: '0.15em', fontFamily: 'monospace' }}
                            />
                            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: 4, display: 'block' }}>
                                Have a beta PIN? Enter it for 14-day Pro access. <a href="/beta" style={{ color: '#06b6d4' }}>Apply here</a>
                            </span>
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
                            const returnUrl = encodeURIComponent(window.location.origin + '/dashboard')
                            window.location.href = `https://dwtl.io/welcome?app=trustgen&returnTo=${returnUrl}`
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
