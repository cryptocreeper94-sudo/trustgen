/* ====== TrustGen — Affiliate Dashboard ====== */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/apiClient'

interface AffiliateStats {
    profile: {
        tier: string
        lifetime_earnings: number
        pending_commission: number
        total_clicks: number
        total_signups: number
        total_conversions: number
    }
    code: { code: string; user_hash: string; clicks: number; signups: number } | null
    recentReferrals: { referred_name: string; referred_email: string; status: string; created_at: string }[]
    tier: string
    commissionRate: number
    nextTier: string | null
    nextTierThreshold: number
}

const TIER_CONFIG: Record<string, { label: string; icon: string; color: string; gradient: string }> = {
    explorer: { label: 'Explorer', icon: '🌱', color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)' },
    builder: { label: 'Builder', icon: '🔨', color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' },
    architect: { label: 'Architect', icon: '🏛️', color: '#06b6d4', gradient: 'linear-gradient(135deg, #06b6d4, #9333ea)' },
    oracle: { label: 'Oracle', icon: '✨', color: '#f59e0b', gradient: 'linear-gradient(135deg, #d946ef, #06b6d4)' },
}

const COMMISSION_TABLE = [
    { tier: 'Explorer', rate: '5%', signups: '0–4', color: '#06b6d4' },
    { tier: 'Builder', rate: '8%', signups: '5–19', color: '#8b5cf6' },
    { tier: 'Architect', rate: '12%', signups: '20–49', color: '#06b6d4' },
    { tier: 'Oracle', rate: '18%', signups: '50+', color: '#d946ef' },
]

export function AffiliatePage() {
    const navigate = useNavigate()
    const [stats, setStats] = useState<AffiliateStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [copied, setCopied] = useState(false)

    const fetchStats = useCallback(async () => {
        try {
            const data = await api.get<AffiliateStats>('/api/referrals/stats')
            setStats(data)
        } catch (err) {
            console.error('Failed to load affiliate stats:', err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchStats() }, [fetchStats])

    const copyLink = async () => {
        if (!stats?.code) return
        const link = `${window.location.origin}/ref/${stats.code.code}`
        await navigator.clipboard.writeText(link)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const tierConfig = TIER_CONFIG[stats?.tier || 'explorer']
    const progress = stats?.nextTierThreshold
        ? Math.min(100, ((stats.profile?.total_signups || 0) / stats.nextTierThreshold) * 100)
        : 100

    if (loading) {
        return (
            <div className="affiliate-page">
                <div className="affiliate-loading">
                    <div className="affiliate-spinner" />
                    <p>Loading affiliate dashboard…</p>
                </div>
            </div>
        )
    }

    return (
        <div className="affiliate-page">
            <header className="affiliate-header">
                <button className="affiliate-back" onClick={() => navigate(-1)}>← Back</button>
                <h1>Share & Earn</h1>
                <p className="affiliate-subtitle">Refer creators to TrustGen and earn commissions on their subscriptions</p>
            </header>

            {/* Tier Badge */}
            <div className="affiliate-tier-card" style={{ background: tierConfig.gradient }}>
                <div className="affiliate-tier-icon">{tierConfig.icon}</div>
                <div className="affiliate-tier-info">
                    <div className="affiliate-tier-label">{tierConfig.label} Tier</div>
                    <div className="affiliate-tier-rate">{((stats?.commissionRate || 0) * 100).toFixed(0)}% Commission</div>
                </div>
                {stats?.nextTier && (
                    <div className="affiliate-tier-progress">
                        <div className="affiliate-tier-progress-label">
                            {stats.profile?.total_signups || 0} / {stats.nextTierThreshold} to {TIER_CONFIG[stats.nextTier]?.label}
                        </div>
                        <div className="affiliate-progress-bar">
                            <div className="affiliate-progress-fill" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="affiliate-stats-grid">
                <div className="affiliate-stat-card">
                    <div className="affiliate-stat-value">{stats?.profile?.total_clicks || 0}</div>
                    <div className="affiliate-stat-label">Link Clicks</div>
                </div>
                <div className="affiliate-stat-card">
                    <div className="affiliate-stat-value">{stats?.profile?.total_signups || 0}</div>
                    <div className="affiliate-stat-label">Signups</div>
                </div>
                <div className="affiliate-stat-card">
                    <div className="affiliate-stat-value">{stats?.profile?.total_conversions || 0}</div>
                    <div className="affiliate-stat-label">Conversions</div>
                </div>
                <div className="affiliate-stat-card">
                    <div className="affiliate-stat-value">${(stats?.profile?.lifetime_earnings || 0).toFixed(2)}</div>
                    <div className="affiliate-stat-label">Lifetime Earnings</div>
                </div>
                <div className="affiliate-stat-card highlight">
                    <div className="affiliate-stat-value">${(stats?.profile?.pending_commission || 0).toFixed(2)}</div>
                    <div className="affiliate-stat-label">Pending Payout</div>
                </div>
                <div className="affiliate-stat-card">
                    <div className="affiliate-stat-value">{stats?.code?.user_hash || '—'}</div>
                    <div className="affiliate-stat-label">Your Hash (TN-)</div>
                </div>
            </div>

            {/* Referral Link */}
            <div className="affiliate-link-card">
                <h3>Your Referral Link</h3>
                <div className="affiliate-link-box">
                    <code>{stats?.code ? `${window.location.origin}/ref/${stats.code.code}` : '—'}</code>
                    <button className="affiliate-copy-btn" onClick={copyLink}>
                        {copied ? '✓ Copied!' : '📋 Copy'}
                    </button>
                </div>
            </div>

            {/* Commission Table */}
            <div className="affiliate-commission-card">
                <h3>Commission Structure</h3>
                <table className="affiliate-commission-table">
                    <thead>
                        <tr><th>Tier</th><th>Rate</th><th>Signups Required</th></tr>
                    </thead>
                    <tbody>
                        {COMMISSION_TABLE.map(row => (
                            <tr key={row.tier} className={row.tier.toLowerCase() === stats?.tier ? 'current-tier' : ''}>
                                <td style={{ color: row.color }}>{row.tier}</td>
                                <td>{row.rate}</td>
                                <td>{row.signups}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Recent Referrals */}
            <div className="affiliate-referrals-card">
                <h3>Recent Referrals</h3>
                {(stats?.recentReferrals?.length || 0) > 0 ? (
                    <div className="affiliate-referral-list">
                        {stats!.recentReferrals.map((r, i) => (
                            <div key={i} className="affiliate-referral-item">
                                <div className="affiliate-referral-name">{r.referred_name || 'Anonymous'}</div>
                                <div className={`affiliate-referral-status ${r.status}`}>{r.status}</div>
                                <div className="affiliate-referral-date">
                                    {new Date(r.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="affiliate-empty">No referrals yet. Share your link to get started!</p>
                )}
            </div>

            {/* Payout Button */}
            <div className="affiliate-payout-section">
                <button className="affiliate-payout-btn" disabled={(stats?.profile?.pending_commission || 0) === 0}>
                    Request Payout (SIG or Fiat)
                </button>
            </div>
        </div>
    )
}
