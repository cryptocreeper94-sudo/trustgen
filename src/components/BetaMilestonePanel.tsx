import { useState, useEffect } from 'react'
import { useAuthStore } from '../stores/authStore'
import { api } from '../api/apiClient'

interface Milestone {
    key: string; title: string; description: string; order: number
    completed: boolean; completedAt: string | null
}
interface MilestoneData {
    isBetaTester: boolean; betaStatus: string; betaExpiresAt: string
    daysLeft: number | null; milestones: Milestone[]
    allComplete: boolean; completedCount: number; totalCount: number
}

export function BetaMilestonePanel() {
    const user = useAuthStore(s => s.user)
    const [data, setData] = useState<MilestoneData | null>(null)
    const [collapsed, setCollapsed] = useState(false)
    const [hidden, setHidden] = useState(false)

    useEffect(() => {
        if (!user?.betaStatus) return
        api.get<MilestoneData>('/api/beta/milestones').then(setData).catch(() => {})
    }, [user?.betaStatus])

    if (!user?.betaStatus || !data?.isBetaTester || hidden) return null

    const isFounder = data.betaStatus === 'founder'
    const progress = (data.completedCount / data.totalCount) * 100

    return (
        <div className={`beta-panel ${isFounder ? 'founder' : ''}`}>
            <div className="beta-panel-header" onClick={() => setCollapsed(!collapsed)}>
                <div className="beta-panel-title">
                    <span>{isFounder ? '🏆' : '🧪'}</span>
                    <span>{isFounder ? 'Founder Status' : 'Beta Milestones'}</span>
                    {!isFounder && data.daysLeft !== null && (
                        <span className="beta-panel-days">{data.daysLeft}d left</span>
                    )}
                </div>
                <div className="beta-panel-progress-mini">
                    <span>{data.completedCount}/{data.totalCount}</span>
                    <span className="beta-panel-chevron">{collapsed ? '▸' : '▾'}</span>
                </div>
            </div>
            {!collapsed && (
                <div className="beta-panel-body">
                    {isFounder ? (
                        <div className="beta-panel-founder">
                            <p>🎉 You are a <strong>Founding Beta Tester</strong>. Full Pro access is yours permanently.</p>
                            <button className="beta-panel-dismiss" onClick={() => setHidden(true)}>Dismiss</button>
                        </div>
                    ) : (
                        <>
                            <div className="beta-panel-bar">
                                <div className="beta-panel-bar-fill" style={{ width: progress + '%' }} />
                            </div>
                            <div className="beta-panel-list">
                                {data.milestones.map(m => (
                                    <div key={m.key} className={`beta-panel-item ${m.completed ? 'done' : ''}`}>
                                        <span className="beta-panel-check">{m.completed ? '✓' : m.order}</span>
                                        <div>
                                            <strong>{m.title}</strong>
                                            <p>{m.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="beta-panel-hint">Complete all milestones for permanent Founder access.</p>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}
