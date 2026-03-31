/* ====== TrustGen — Dashboard Page ====== */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { useProjectStore, type Project } from '../stores/projectStore'

export function DashboardPage() {
    const user = useAuthStore(s => s.user)
    const logout = useAuthStore(s => s.logout)
    const { projects, loading, loadProjects, createProject } = useProjectStore()
    const navigate = useNavigate()

    useEffect(() => {
        loadProjects()
    }, [loadProjects])

    const handleCreateProject = async () => {
        const project = await createProject(`Project ${projects.length + 1}`)
        navigate(`/editor/${project.id}`)
    }

    const handleOpenProject = (project: Project) => {
        navigate(`/editor/${project.id}`)
    }

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div className="brand">
                    <div className="brand-logo">◈</div>
                    <div>
                        <h1 style={{
                            fontSize: 18, fontWeight: 700,
                            background: 'linear-gradient(135deg, #b86bff, #06b6d4, #d946ef)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                        }}>TrustGen</h1>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>3D ENGINE</div>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <button className="btn btn-sm" onClick={() => navigate('/billing')}>
                        💎 {user?.subscriptionTier?.toUpperCase() || 'FREE'}
                    </button>
                    <button className="btn btn-sm" onClick={() => navigate('/sms-opt-in')}>
                        📱 SMS Settings
                    </button>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                        {user?.name || user?.email}
                    </div>
                    <button className="btn btn-sm" onClick={logout}>Sign Out</button>
                </div>
            </div>

            {/* Personalized Welcome Banner */}
            <div style={{
                margin: '0 24px 16px',
                padding: '20px 24px',
                borderRadius: 16,
                background: 'linear-gradient(135deg, rgba(184,107,255,0.08), rgba(6,182,212,0.08), rgba(217,70,239,0.08))',
                border: '1px solid rgba(184,107,255,0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
            }}>
                <div>
                    <h2 style={{
                        fontSize: 22, fontWeight: 800, margin: 0,
                        background: 'linear-gradient(135deg, #fff, #06b6d4)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        Welcome back, {user?.name?.split(' ')[0] || 'Creator'}!
                    </h2>
                    <div style={{ display: 'flex', gap: 12, marginTop: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                        {user?.trustLayerId && (
                            <span style={{
                                fontSize: 11, fontFamily: 'var(--font-mono)',
                                padding: '3px 10px', borderRadius: 8,
                                background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.25)',
                                color: '#06b6d4',
                            }}>
                                🛡️ {user.trustLayerId}
                            </span>
                        )}
                        <span style={{
                            fontSize: 11, fontFamily: 'var(--font-mono)',
                            padding: '3px 10px', borderRadius: 8,
                            background: user?.subscriptionTier === 'enterprise'
                                ? 'rgba(184,107,255,0.12)' : 'rgba(16,185,129,0.12)',
                            border: user?.subscriptionTier === 'enterprise'
                                ? '1px solid rgba(184,107,255,0.25)' : '1px solid rgba(16,185,129,0.25)',
                            color: user?.subscriptionTier === 'enterprise' ? '#b86bff' : '#10b981',
                        }}>
                            💎 {user?.subscriptionTier?.toUpperCase() || 'FREE'} Tier
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                            {user?.email}
                        </span>
                    </div>
                </div>
                <button className="btn btn-sm" onClick={() => navigate('/editor/new')} style={{
                    background: 'linear-gradient(135deg, #b86bff, #06b6d4)',
                    color: '#fff', border: 'none', padding: '8px 20px', borderRadius: 10,
                    fontWeight: 700, fontSize: 13, cursor: 'pointer',
                }}>
                    + New Scene
                </button>
            </div>

            <div className="dashboard-body">
                <div className="dashboard-section">
                    <h2>Your Projects</h2>
                    <div className="project-grid">
                        {/* Create new project card */}
                        <div className="project-card create" onClick={handleCreateProject}>
                            <div className="create-icon">+</div>
                            <div className="create-text">New Project</div>
                        </div>

                        {loading && projects.length === 0 && (
                            <div className="project-card" style={{ opacity: 0.5 }}>
                                <div className="project-card-thumb">⏳</div>
                                <div className="project-card-name">Loading...</div>
                            </div>
                        )}

                        {projects.map(project => (
                            <div key={project.id} className="project-card" onClick={() => handleOpenProject(project)}>
                                <div className="project-card-thumb">
                                    {project.thumbnailUrl ? (
                                        <img src={project.thumbnailUrl} alt={project.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }} />
                                    ) : '🎨'}
                                </div>
                                <div className="project-card-name">{project.name}</div>
                                <div className="project-card-meta">
                                    Updated {new Date(project.updatedAt).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
