/* ====== TrustGen — Billing / Subscription Page ====== */
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type SubscriptionTier } from '../stores/authStore'
import { api } from '../api/apiClient'
import { showToast } from '../components/Toast'

const PLANS: { tier: SubscriptionTier; name: string; price: string; period: string; desc: string; featured?: boolean; features: string[] }[] = [
    {
        tier: 'free', name: 'Free', price: '$0', period: '', desc: 'Get started with essential 3D tools',
        features: [
            '3 projects',
            '5 AI generations / month',
            'Basic primitives & materials',
            'PNG export',
            'Community support',
        ],
    },
    {
        tier: 'pro', name: 'Pro', price: '$29', period: '/mo', desc: 'For creators who need the full toolkit', featured: true,
        features: [
            'Unlimited projects',
            '100 AI generations / month',
            'All primitives, materials & textures',
            'GLB / GLTF export',
            'Post-processing & particles',
            'Animation engine',
            'Priority support',
        ],
    },
    {
        tier: 'enterprise', name: 'Enterprise', price: '$99', period: '/mo', desc: 'Team features & custom integrations',
        features: [
            'Everything in Pro',
            'Unlimited AI generations',
            'Team collaboration',
            'SSO / SAML integration',
            'Custom branding',
            'API access',
            'Blockchain / NFT minting',
            'Dedicated support',
        ],
    },
]

export function BillingPage() {
    const navigate = useNavigate()
    const user = useAuthStore(s => s.user)
    const currentTier = user?.subscriptionTier || 'free'

    const handleManage = async () => {
        try {
            const { url } = await api.post<{ url: string }>('/api/billing/portal')
            window.location.href = url
        } catch (err: any) {
            showToast('error', err.message || 'Failed to open billing portal')
        }
    }

    return (
        <div className="billing-page">
            <div className="dashboard-header">
                <div className="brand">
                    <div className="brand-logo">◈</div>
                    <div>
                        <h1 style={{
                            fontSize: 18, fontWeight: 700,
                            background: 'linear-gradient(135deg, #b86bff, #06b6d4)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>Subscription Plans</h1>
                    </div>
                </div>
                <button className="btn btn-sm" onClick={() => navigate('/dashboard')}>← Back to Dashboard</button>
            </div>

            <div style={{ textAlign: 'center', padding: '32px 16px 0' }}>
                <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-bright)', marginBottom: 8 }}>
                    Choose Your Plan
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 14, maxWidth: 500, margin: '0 auto' }}>
                    Unlock the full power of TrustGen 3D Engine with a plan that fits your workflow
                </p>
                {currentTier !== 'free' && (
                    <button className="btn btn-sm" style={{ marginTop: 16 }} onClick={handleManage}>
                        ⚙️ Manage Subscription
                    </button>
                )}
            </div>

            <div className="pricing-grid">
                {PLANS.map(plan => (
                    <div key={plan.tier} className={`pricing-card ${plan.featured ? 'featured' : ''}`}>
                        <div className="pricing-tier">{plan.name}</div>
                        <div className="pricing-price">{plan.price}<span>{plan.period}</span></div>
                        <div className="pricing-desc">{plan.desc}</div>

                        <ul className="pricing-features">
                            {plan.features.map((f, i) => (
                                <li key={i}><span className="check">✓</span> {f}</li>
                            ))}
                        </ul>

                        {currentTier === plan.tier ? (
                            <button className="btn full-width" disabled>Current Plan</button>
                        ) : plan.tier === 'free' ? (
                            <button className="btn full-width" disabled>Free Forever</button>
                        ) : (
                            <button className="btn full-width" disabled style={{ opacity: 0.6, position: 'relative' }}>
                                Coming Soon 🚀
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ textAlign: 'center', padding: '24px 16px 32px', color: 'var(--text-muted)', fontSize: 12 }}>
                Stripe integration coming soon. All plans will be available at launch.
            </div>
        </div>
    )
}
