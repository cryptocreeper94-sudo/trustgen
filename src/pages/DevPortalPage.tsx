/* ====== TrustGen — Developer Portal ====== */
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'

const MASTER_PIN = '0424'
const API_BASE = import.meta.env.VITE_API_URL || ''

const TABS = [
    { key: 'health', label: '⚡ System Health' },
    { key: 'apis', label: '🔌 API Console' },
    { key: 'database', label: '🗄️ Database' },
    { key: 'env', label: '🔐 Environment' },
    { key: 'trust', label: '⛓️ Trust Layer' },
    { key: 'workspace', label: '📁 My Workspace' },
]

const API_ENDPOINTS = [
    { method: 'GET', path: '/api/health', desc: 'Server health check' },
    { method: 'POST', path: '/api/auth/register', desc: 'Register new user' },
    { method: 'POST', path: '/api/auth/login', desc: 'User login' },
    { method: 'GET', path: '/api/projects', desc: 'List user projects' },
    { method: 'POST', path: '/api/projects', desc: 'Create project' },
    { method: 'PUT', path: '/api/projects/:id', desc: 'Update project' },
    { method: 'DELETE', path: '/api/projects/:id', desc: 'Delete project' },
    { method: 'POST', path: '/api/sms/opt-in', desc: 'SMS opt-in' },
    { method: 'POST', path: '/api/sms/verify', desc: 'Verify SMS code' },
    { method: 'POST', path: '/api/billing/create-session', desc: 'Create Stripe checkout' },
    { method: 'GET', path: '/api/billing/status', desc: 'Get billing status' },
    { method: 'POST', path: '/api/trustlayer/hallmark', desc: 'Create Trust Layer hallmark' },
    { method: 'GET', path: '/api/trustlayer/stamps', desc: 'Get user stamps' },
    { method: 'GET', path: '/api/network/stats', desc: 'Trust Layer network stats' },
    { method: 'GET', path: '/api/admin/health', desc: 'Admin system health (PIN required)' },
    { method: 'GET', path: '/api/admin/stats', desc: 'Admin DB stats (PIN required)' },
    { method: 'GET', path: '/api/admin/env-status', desc: 'Admin env vars status (PIN required)' },
]

const ENV_VARS = [
    'DATABASE_URL', 'JWT_SECRET', 'RESEND_API_KEY',
    'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER',
    'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_PRO', 'STRIPE_PRICE_ENTERPRISE',
    'TRUSTLAYER_API_KEY', 'TRUSTLAYER_API_SECRET', 'TRUSTLAYER_BASE_URL',
    'CLIENT_URL',
]

interface HealthData {
    status: string
    timestamp: string
    uptime?: number
    memory?: { used: number; total: number }
    dbConnected?: boolean
    tables?: Record<string, number>
    envStatus?: Record<string, boolean>
}

export function DevPortalPage() {
    const [pin, setPin] = useState('')
    const [authenticated, setAuthenticated] = useState(false)
    const [pinError, setPinError] = useState('')
    const [activeTab, setActiveTab] = useState('health')
    const [healthData, setHealthData] = useState<HealthData | null>(null)
    const [loading, setLoading] = useState(false)
    const [apiTestResult, setApiTestResult] = useState<{ endpoint: string; status: number; data: any } | null>(null)
    const navigate = useNavigate()

    // Check session
    useEffect(() => {
        const stored = sessionStorage.getItem('dev-portal-auth')
        if (stored === MASTER_PIN) setAuthenticated(true)
    }, [])

    const handlePinSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (pin === MASTER_PIN) {
            setAuthenticated(true)
            sessionStorage.setItem('dev-portal-auth', pin)
            setPinError('')
        } else {
            setPinError('Invalid PIN')
            setPin('')
        }
    }

    const fetchHealth = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API_BASE}/api/health`)
            const data = await res.json()

            // Also try admin endpoints
            let adminData: any = {}
            try {
                const statsRes = await fetch(`${API_BASE}/api/admin/stats`)
                if (statsRes.ok) adminData.stats = await statsRes.json()
            } catch { /* admin route may not exist yet */ }

            try {
                const envRes = await fetch(`${API_BASE}/api/admin/env-status`)
                if (envRes.ok) adminData.env = await envRes.json()
            } catch { /* admin route may not exist yet */ }

            setHealthData({
                ...data,
                uptime: data.uptime || 0,
                memory: data.memory || { used: 0, total: 0 },
                dbConnected: data.status === 'ok',
                tables: adminData.stats?.tables || {},
                envStatus: adminData.env?.variables || {},
            })
        } catch (err) {
            setHealthData({
                status: 'unreachable',
                timestamp: new Date().toISOString(),
                dbConnected: false,
            })
        }
        setLoading(false)
    }, [])

    useEffect(() => {
        if (authenticated) {
            fetchHealth()
            const interval = setInterval(fetchHealth, 30000)
            return () => clearInterval(interval)
        }
    }, [authenticated, fetchHealth])

    const testEndpoint = async (method: string, path: string) => {
        try {
            const res = await fetch(`${API_BASE}${path}`, {
                method: method === 'GET' ? 'GET' : 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            let data
            try {
                data = await res.json()
            } catch {
                data = { raw: await res.text() }
            }
            setApiTestResult({ endpoint: `${method} ${path}`, status: res.status, data })
        } catch (err: any) {
            setApiTestResult({ endpoint: `${method} ${path}`, status: 0, data: { error: err.message } })
        }
    }

    // PIN Gate
    if (!authenticated) {
        return (
            <div className="dev-portal-pin">
                <form className="pin-form" onSubmit={handlePinSubmit}>
                    <div style={{ fontSize: 48, marginBottom: 16 }}>🔐</div>
                    <h2>Developer Portal</h2>
                    <p>Enter your master PIN to access system controls</p>
                    <input
                        type="password"
                        className="pin-input"
                        value={pin}
                        onChange={e => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="• • • •"
                        maxLength={4}
                        autoFocus
                    />
                    {pinError && <div className="pin-error">{pinError}</div>}
                </form>
            </div>
        )
    }

    return (
        <div className="dev-portal">
            {/* Header */}
            <div style={{
                padding: '24px',
                textAlign: 'center',
                borderBottom: '1px solid var(--border)',
            }}>
                <h1 style={{
                    fontSize: 24, fontWeight: 700,
                    background: 'linear-gradient(135deg, #b86bff, #06b6d4)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    🛠️ Developer Portal
                </h1>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                    System administration • TrustGen 3D Engine
                </p>
            </div>

            {/* Tabs */}
            <div className="dev-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`dev-tab ${activeTab === tab.key ? 'active' : ''}`}
                        onClick={() => {
                            if (tab.key === 'workspace') navigate('/dashboard')
                            else setActiveTab(tab.key)
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="dev-content">
                {/* ── System Health Tab ── */}
                {activeTab === 'health' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>System Health</h2>
                            <button className="btn btn-sm" onClick={fetchHealth} disabled={loading}>
                                {loading ? '⏳ Checking...' : '🔄 Refresh'}
                            </button>
                        </div>
                        <div className="health-grid">
                            <div className="health-card">
                                <div className="health-card-label">Server Status</div>
                                <div className={`health-card-value ${healthData?.status === 'ok' ? 'ok' : 'error'}`}>
                                    {healthData?.status === 'ok' ? '● ONLINE' : '● OFFLINE'}
                                </div>
                                <div className="health-card-sub">
                                    {healthData?.timestamp ? new Date(healthData.timestamp).toLocaleTimeString() : '—'}
                                </div>
                            </div>
                            <div className="health-card">
                                <div className="health-card-label">Database</div>
                                <div className={`health-card-value ${healthData?.dbConnected ? 'ok' : 'error'}`}>
                                    {healthData?.dbConnected ? '● CONNECTED' : '● DOWN'}
                                </div>
                                <div className="health-card-sub">PostgreSQL (Render)</div>
                            </div>
                            <div className="health-card">
                                <div className="health-card-label">API Base</div>
                                <div className="health-card-value" style={{ fontSize: 12, wordBreak: 'break-all' }}>
                                    {API_BASE || 'Not Set'}
                                </div>
                                <div className="health-card-sub">VITE_API_URL</div>
                            </div>
                            <div className="health-card">
                                <div className="health-card-label">Frontend</div>
                                <div className="health-card-value ok">● LIVE</div>
                                <div className="health-card-sub">Vercel (trustgen.tlid.io)</div>
                            </div>
                        </div>

                        {/* Quick links */}
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                            <a href="https://dashboard.render.com" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                🖥️ Render Dashboard
                            </a>
                            <a href="https://vercel.com/darkwavestudios/trustgen-3d" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                ▲ Vercel Dashboard
                            </a>
                            <a href="https://dashboard.stripe.com" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                💳 Stripe Dashboard
                            </a>
                            <a href="https://github.com/cryptocreeper94-sudo/trustgen" target="_blank" rel="noopener noreferrer" className="btn btn-sm">
                                🐙 GitHub Repo
                            </a>
                        </div>
                    </>
                )}

                {/* ── API Console Tab ── */}
                {activeTab === 'apis' && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>API Console</h2>

                        {apiTestResult && (
                            <div style={{
                                marginBottom: 24, padding: 16,
                                borderRadius: 'var(--radius-md)', background: 'var(--bg-secondary)',
                                border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 12,
                            }}>
                                <div style={{ marginBottom: 8, color: 'var(--text-muted)' }}>
                                    {apiTestResult.endpoint} → <span style={{
                                        color: apiTestResult.status >= 200 && apiTestResult.status < 300 ? 'var(--success)' : 'var(--danger)'
                                    }}>{apiTestResult.status}</span>
                                </div>
                                <pre style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto' }}>
                                    {JSON.stringify(apiTestResult.data, null, 2)}
                                </pre>
                            </div>
                        )}

                        <table className="api-table">
                            <thead>
                                <tr>
                                    <th>Method</th>
                                    <th>Endpoint</th>
                                    <th>Description</th>
                                    <th>Test</th>
                                </tr>
                            </thead>
                            <tbody>
                                {API_ENDPOINTS.map(ep => (
                                    <tr key={`${ep.method}-${ep.path}`}>
                                        <td>
                                            <span className={`api-method ${ep.method.toLowerCase()}`}>
                                                {ep.method}
                                            </span>
                                        </td>
                                        <td>{ep.path}</td>
                                        <td style={{ fontFamily: 'var(--font-sans)' }}>{ep.desc}</td>
                                        <td>
                                            {ep.method === 'GET' && (
                                                <button
                                                    className="btn btn-sm"
                                                    onClick={() => testEndpoint(ep.method, ep.path)}
                                                    style={{ fontSize: 10, padding: '3px 8px' }}
                                                >
                                                    ▶ Test
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </>
                )}

                {/* ── Database Tab ── */}
                {activeTab === 'database' && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Database</h2>
                        <div className="health-grid">
                            {healthData?.tables && Object.entries(healthData.tables).length > 0 ? (
                                Object.entries(healthData.tables).map(([table, count]) => (
                                    <div key={table} className="health-card">
                                        <div className="health-card-label">{table}</div>
                                        <div className="health-card-value">{count}</div>
                                        <div className="health-card-sub">rows</div>
                                    </div>
                                ))
                            ) : (
                                <>
                                    {['tenants', 'users', 'projects', 'trust_stamps', 'subscriptions'].map(table => (
                                        <div key={table} className="health-card">
                                            <div className="health-card-label">{table}</div>
                                            <div className="health-card-value" style={{ color: 'var(--text-muted)' }}>—</div>
                                            <div className="health-card-sub">admin routes needed</div>
                                        </div>
                                    ))}
                                </>
                            )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
                            ℹ️ Full DB stats require the admin API routes to be implemented on the backend.
                        </div>
                    </>
                )}

                {/* ── Environment Tab ── */}
                {activeTab === 'env' && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Environment Variables</h2>
                        <div className="env-grid">
                            {ENV_VARS.map(name => {
                                const isSet = healthData?.envStatus?.[name] ?? null
                                return (
                                    <div key={name} className="env-item">
                                        <div className={`env-dot ${isSet === null ? 'unset' : isSet ? 'set' : 'unset'}`} />
                                        {name}
                                    </div>
                                )
                            })}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 16 }}>
                            ℹ️ Status shows whether each variable is set (not its value). Requires admin API routes.
                        </div>
                    </>
                )}

                {/* ── Trust Layer Tab ── */}
                {activeTab === 'trust' && (
                    <>
                        <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 16 }}>Trust Layer Integration</h2>
                        <div className="health-grid">
                            <div className="health-card">
                                <div className="health-card-label">Ecosystem Status</div>
                                <div className="health-card-value ok">● REGISTERED</div>
                                <div className="health-card-sub">App: TrustGen (TN)</div>
                            </div>
                            <div className="health-card">
                                <div className="health-card-label">Base URL</div>
                                <div className="health-card-value" style={{ fontSize: 12 }}>dwtl.io</div>
                                <div className="health-card-sub">TRUSTLAYER_BASE_URL</div>
                            </div>
                            <div className="health-card">
                                <div className="health-card-label">API Key</div>
                                <div className={`health-card-value ${healthData?.envStatus?.TRUSTLAYER_API_KEY ? 'ok' : 'error'}`}>
                                    {healthData?.envStatus?.TRUSTLAYER_API_KEY ? '● SET' : '● MISSING'}
                                </div>
                                <div className="health-card-sub">Authentication</div>
                            </div>
                            <div className="health-card">
                                <div className="health-card-label">Launch Date</div>
                                <div className="health-card-value" style={{ fontSize: 14 }}>Aug 23, 2026</div>
                                <div className="health-card-sub">Network mainnet</div>
                            </div>
                        </div>

                        <div style={{ marginTop: 24 }}>
                            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12 }}>Integration Endpoints</h3>
                            <table className="api-table">
                                <thead>
                                    <tr><th>Feature</th><th>Status</th><th>Endpoint</th></tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ fontFamily: 'var(--font-sans)' }}>SSO (TLID)</td>
                                        <td><span style={{ color: 'var(--success)' }}>● Active</span></td>
                                        <td>/api/auth/tlid</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontFamily: 'var(--font-sans)' }}>Hallmarks</td>
                                        <td><span style={{ color: 'var(--success)' }}>● Active</span></td>
                                        <td>/api/trustlayer/hallmark</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontFamily: 'var(--font-sans)' }}>Trust Stamps</td>
                                        <td><span style={{ color: 'var(--success)' }}>● Active</span></td>
                                        <td>/api/trustlayer/stamps</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontFamily: 'var(--font-sans)' }}>Webhooks</td>
                                        <td><span style={{ color: 'var(--warning)' }}>● Pending</span></td>
                                        <td>/api/webhooks/trustlayer</td>
                                    </tr>
                                    <tr>
                                        <td style={{ fontFamily: 'var(--font-sans)' }}>Public Creations API</td>
                                        <td><span style={{ color: 'var(--warning)' }}>● Pending</span></td>
                                        <td>/api/public/creations</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            <Footer />
        </div>
    )
}
