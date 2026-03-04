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
