import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || ''

export function BetaPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ name: '', email: '', whatBuilding: '', githubUrl: '' })
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState<any>(null)
    const [error, setError] = useState('')
    const [spots, setSpots] = useState<{ total: number, used: number, remaining: number } | null>(null)

    useEffect(() => { fetch(API+'/api/beta/spots').then(r => r.json()).then(setSpots).catch(() => {}) }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); setLoading(true); setError('')
        try {
            const res = await fetch(API+'/api/beta/apply', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
            const data = await res.json()
            if (!res.ok) { setError(data.error || 'Something went wrong'); return }
            setResult(data)
        } catch { setError('Network error.') } finally { setLoading(false) }
    }

    const perks = [
        { icon: '🔓', title: 'Full Pro Access', desc: '14 days of unrestricted access to every feature.' },
        { icon: '♾️', title: 'Permanent Access', desc: 'Complete all milestones → free Pro forever.' },
        { icon: '📜', title: 'Named in Docs', desc: 'Your name listed as a Founding Beta Tester.' },
        { icon: '💬', title: 'Direct Line', desc: 'Signal Chat access to the dev team for feedback.' },
    ]
    const milestones = [
        { n: 1, title: 'Create Your Account', desc: 'Sign up with your beta PIN.' },
        { n: 2, title: 'Create a Project', desc: 'Start your first 3D project.' },
        { n: 3, title: 'Add a 3D Asset', desc: 'Add a model or shape to your scene.' },
        { n: 4, title: 'Use AI Generation', desc: 'Generate content with any AI feature.' },
        { n: 5, title: 'Render or Export', desc: 'Export a video or image.' },
        { n: 6, title: 'Submit Feedback', desc: 'Send feedback via Signal Chat.' },
    ]

    return (
        <div className="beta-page">
            <div className="beta-bg-orb beta-orb-1" /><div className="beta-bg-orb beta-orb-2" />
            <div className="beta-container">
                <div className="beta-header">
                    <div className="beta-badge">🧪 Beta Program · Wave 1</div>
                    <h1 className="beta-title">Be a <span className="beta-gradient-text">Founding Tester</span></h1>
                    <p className="beta-subtitle">
                        {spots && spots.remaining > 0 ? spots.remaining+' of '+spots.total+' spots remaining. Complete all milestones during the 14-day beta and earn permanent full access.'
                         : spots && spots.remaining === 0 ? 'All beta slots have been claimed!'
                         : 'Limited to 20 qualified testers. Help us build something extraordinary.'}
                    </p>
                    {spots && <div className="beta-spots-bar"><div className="beta-spots-fill" style={{ width: (spots.used/spots.total*100)+'%' }} /><span className="beta-spots-label">{spots.used}/{spots.total} claimed</span></div>}
                </div>

                {result ? (
                    <div className="beta-result">
                        <div className="beta-result-icon">🎉</div>
                        <h2>You're In!</h2>
                        <p>{result.message}</p>
                        <div className="beta-pin-display"><span className="beta-pin-label">Your Beta PIN</span><span className="beta-pin-value">{result.pin}</span></div>
                        <div className="beta-next-steps"><h3>Next Steps</h3><ol><li>Create your TrustGen account</li><li>Enter your Beta PIN during registration</li><li>Complete 6 milestones in 14 days</li><li>Earn permanent <strong>Founder</strong> status</li></ol></div>
                        <button className="beta-btn-primary" onClick={() => navigate('/login?mode=register')}>Create Your Account →</button>
                    </div>
                ) : (<>
                    <div className="beta-perks"><h3>What Founders Get</h3><div className="beta-perks-grid">{perks.map((p,i) => <div key={i} className="beta-perk-card"><span className="beta-perk-icon">{p.icon}</span><strong>{p.title}</strong><p>{p.desc}</p></div>)}</div></div>
                    <div className="beta-milestones-preview"><h3>The 6 Milestones</h3><p className="beta-milestones-desc">Complete all 6 during your 14-day beta to unlock permanent Founder status.</p><div className="beta-milestone-list">{milestones.map(m => <div key={m.n} className="beta-milestone-item"><span className="beta-milestone-num">{m.n}</span><div><strong>{m.title}</strong><p>{m.desc}</p></div></div>)}</div></div>
                    <form className="beta-form" onSubmit={handleSubmit}>
                        <h3>Apply for Beta Access</h3>
                        {error && <div className="beta-error">{error}</div>}
                        <div className="beta-field"><label>Full Name *</label><input type="text" required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Your name" /></div>
                        <div className="beta-field"><label>Email *</label><input type="email" required value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="your@email.com" /></div>
                        <div className="beta-field"><label>What are you building? *</label><textarea required value={form.whatBuilding} onChange={e => setForm(f => ({...f, whatBuilding: e.target.value}))} placeholder="Tell us about your project." rows={3} /></div>
                        <div className="beta-field"><label>GitHub / Portfolio <span className="beta-optional">(optional)</span></label><input type="url" value={form.githubUrl} onChange={e => setForm(f => ({...f, githubUrl: e.target.value}))} placeholder="https://github.com/you" /></div>
                        <button type="submit" className="beta-btn-primary" disabled={loading || (spots !== null && spots.remaining <= 0)}>{loading ? 'Submitting...' : 'Apply for Beta Access'}</button>
                    </form>
                </>)}
            </div>
        </div>
    )
}
