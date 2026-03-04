/* ====== TrustGen — SMS Opt-In Page ====== */
import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/apiClient'
import { showToast } from '../components/Toast'

export function SMSOptInPage() {
    const navigate = useNavigate()
    const [step, setStep] = useState<'phone' | 'verify'>('phone')
    const [countryCode, setCountryCode] = useState('+1')
    const [phone, setPhone] = useState('')
    const [agreed, setAgreed] = useState(false)
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmitPhone = async (e: FormEvent) => {
        e.preventDefault()
        if (!agreed) { setError('You must agree to receive SMS messages'); return }
        setLoading(true)
        setError('')
        try {
            await api.post('/api/auth/sms-opt-in', { phone: `${countryCode}${phone}` })
            setStep('verify')
            showToast('info', 'Verification code sent via SMS')
        } catch (err: any) {
            setError(err.message || 'Failed to send verification code')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async (fullCode: string) => {
        setLoading(true)
        try {
            await api.post('/api/auth/verify-sms', { phone: `${countryCode}${phone}`, code: fullCode })
            showToast('success', 'Phone verified! SMS notifications enabled.')
            navigate('/dashboard')
        } catch (err: any) {
            setError(err.message || 'Invalid verification code')
        } finally {
            setLoading(false)
        }
    }

    const handleCodeChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return
        const newCode = [...code]
        newCode[index] = value.slice(-1)
        setCode(newCode)
        // Auto-focus next input
        if (value && index < 5) {
            const next = document.querySelector(`.verification-code-inputs input:nth-child(${index + 2})`) as HTMLInputElement
            next?.focus()
        }
        // Auto-submit when all filled
        if (newCode.every(c => c) && index === 5) {
            handleVerify(newCode.join(''))
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-bg" style={{
                background: 'radial-gradient(ellipse at 30% 50%, rgba(0,206,201,0.12), transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(108,92,231,0.1), transparent 60%), var(--bg-void)',
            }} />

            <div className="auth-card sms-optin-card">
                <div className="auth-brand">
                    <div className="auth-brand-icon">📱</div>
                    <h1>SMS Notifications</h1>
                    <p>{step === 'phone' ? 'Get account alerts & updates via text' : 'Enter verification code'}</p>
                </div>

                {step === 'phone' ? (
                    <form className="auth-form" onSubmit={handleSubmitPhone}>
                        <div className="auth-field">
                            <label>Phone Number</label>
                            <div className="phone-input-row">
                                <select
                                    value={countryCode}
                                    onChange={e => setCountryCode(e.target.value)}
                                    style={{ padding: '12px 8px', fontSize: 14 }}
                                >
                                    <option value="+1">🇺🇸 +1</option>
                                    <option value="+44">🇬🇧 +44</option>
                                    <option value="+61">🇦🇺 +61</option>
                                    <option value="+49">🇩🇪 +49</option>
                                    <option value="+33">🇫🇷 +33</option>
                                    <option value="+81">🇯🇵 +81</option>
                                    <option value="+91">🇮🇳 +91</option>
                                </select>
                                <input
                                    className="auth-input"
                                    type="tel"
                                    placeholder="(555) 123-4567"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="compliance-box">
                            <input
                                type="checkbox"
                                checked={agreed}
                                onChange={e => setAgreed(e.target.checked)}
                                id="sms-consent"
                            />
                            <label htmlFor="sms-consent" className="compliance-text">
                                By checking this box, I consent to receive transactional and marketing
                                text messages from TrustGen at the phone number provided. Message and
                                data rates may apply. Message frequency varies. Reply STOP to unsubscribe
                                or HELP for help. View our{' '}
                                <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Privacy Policy</span> and{' '}
                                <span style={{ color: 'var(--accent)', cursor: 'pointer' }}>Terms of Service</span>.
                            </label>
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <button className="auth-submit" type="submit" disabled={loading || !agreed}>
                            {loading ? 'Sending...' : 'Send Verification Code'}
                        </button>

                        <button
                            type="button"
                            className="btn full-width"
                            onClick={() => navigate('/dashboard')}
                        >
                            Skip for Now
                        </button>
                    </form>
                ) : (
                    <div className="auth-form">
                        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)' }}>
                            Enter the 6-digit code sent to {countryCode}{phone}
                        </p>

                        <div className="verification-code-inputs">
                            {code.map((digit, i) => (
                                <input
                                    key={i}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={e => handleCodeChange(i, e.target.value)}
                                    autoFocus={i === 0}
                                />
                            ))}
                        </div>

                        {error && <div className="auth-error">{error}</div>}

                        <button
                            type="button"
                            className="btn full-width"
                            style={{ marginTop: 8 }}
                            onClick={() => { setStep('phone'); setCode(['', '', '', '', '', '']); setError('') }}
                        >
                            ← Back
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
