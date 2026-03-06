/* ====== TrustGen — Chronicles Asset Pipeline Workspace ====== */
import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'
import {
    ALL_ASSETS, ASSET_COUNTS,
    ERA_LABELS, CATEGORY_LABELS, STATUS_LABELS, STATUS_COLORS,
    CATEGORY_ICONS, ERA_ICONS,
} from '../data'
import type { ChroniclesAsset, AssetEra, AssetCategory, AssetStatus } from '../data'

/* ── Persisted status store ── */
function loadStatuses(): Record<string, AssetStatus> {
    try {
        const raw = localStorage.getItem('chronicles-asset-statuses')
        return raw ? JSON.parse(raw) : {}
    } catch { return {} }
}
function saveStatuses(s: Record<string, AssetStatus>) {
    localStorage.setItem('chronicles-asset-statuses', JSON.stringify(s))
}

export function WorkspacePage() {
    const navigate = useNavigate()

    /* ── Filters ── */
    const [eraFilter, setEraFilter] = useState<AssetEra | 'all'>('all')
    const [catFilter, setCatFilter] = useState<AssetCategory | 'all'>('all')
    const [statusFilter, setStatusFilter] = useState<AssetStatus | 'all'>('all')
    const [search, setSearch] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
    const [expandedId, setExpandedId] = useState<string | null>(null)

    /* ── Statuses (persisted) ── */
    const [statuses, setStatuses] = useState<Record<string, AssetStatus>>(loadStatuses)
    const getStatus = (id: string): AssetStatus => statuses[id] || 'pending'
    const setAssetStatus = useCallback((id: string, status: AssetStatus) => {
        setStatuses(prev => {
            const next = { ...prev, [id]: status }
            saveStatuses(next)
            return next
        })
    }, [])

    /* ── Copy to clipboard ── */
    const [copiedId, setCopiedId] = useState<string | null>(null)
    const copyDescription = useCallback((asset: ChroniclesAsset) => {
        navigator.clipboard.writeText(asset.description)
        setCopiedId(asset.id)
        setTimeout(() => setCopiedId(null), 2000)
    }, [])

    /* ── Filtered assets ── */
    const filtered = useMemo(() => {
        return ALL_ASSETS.filter(a => {
            if (eraFilter !== 'all' && a.era !== eraFilter) return false
            if (catFilter !== 'all' && a.category !== catFilter) return false
            if (statusFilter !== 'all' && getStatus(a.id) !== statusFilter) return false
            if (search) {
                const q = search.toLowerCase()
                return a.name.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
            }
            return true
        })
    }, [eraFilter, catFilter, statusFilter, search, statuses])

    /* ── Stats ── */
    const completedCount = ALL_ASSETS.filter(a => getStatus(a.id) === 'complete').length
    const generatedCount = ALL_ASSETS.filter(a => ['generated', 'rigged', 'complete'].includes(getStatus(a.id))).length
    const progressPct = Math.round((completedCount / ASSET_COUNTS.total) * 100)

    /* ── Bulk actions ── */
    const bulkSetStatus = (status: AssetStatus) => {
        setStatuses(prev => {
            const next = { ...prev }
            selectedIds.forEach(id => { next[id] = status })
            saveStatuses(next)
            return next
        })
        setSelectedIds(new Set())
    }
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }
    const selectAll = () => {
        if (selectedIds.size === filtered.length) {
            setSelectedIds(new Set())
        } else {
            setSelectedIds(new Set(filtered.map(a => a.id)))
        }
    }

    return (
        <div className="workspace-page">
            {/* ── Header ── */}
            <header className="workspace-header">
                <button className="workspace-back" onClick={() => navigate('/dashboard')}>← Back</button>
                <div className="workspace-header-content">
                    <h1 className="workspace-title">
                        <span className="workspace-title-icon">🎮</span>
                        Chronicles Asset Pipeline
                    </h1>
                    <p className="workspace-subtitle">
                        Generate, track, and manage all 3D assets for Chronicles
                    </p>
                </div>
                <div className="workspace-progress-ring">
                    <svg viewBox="0 0 100 100" className="progress-svg">
                        <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
                        <circle cx="50" cy="50" r="42" fill="none" stroke="url(#progressGrad)" strokeWidth="6"
                            strokeDasharray={`${progressPct * 2.64} ${264 - progressPct * 2.64}`}
                            strokeDashoffset="66" strokeLinecap="round"
                            style={{ transition: 'stroke-dasharray 0.6s ease' }} />
                        <defs>
                            <linearGradient id="progressGrad" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stopColor="#06b6d4" />
                                <stop offset="100%" stopColor="#14b8a6" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="progress-text">
                        <span className="progress-number">{completedCount}</span>
                        <span className="progress-label">/ {ASSET_COUNTS.total}</span>
                    </div>
                </div>
            </header>

            {/* ── Stats Bar ── */}
            <div className="workspace-stats">
                {(['character', 'pet', 'environment', 'storefront'] as AssetCategory[]).map(cat => {
                    const total = ASSET_COUNTS.byCategory[cat]
                    const done = ALL_ASSETS.filter(a => a.category === cat && getStatus(a.id) === 'complete').length
                    return (
                        <button key={cat} className={`stat-card ${catFilter === cat ? 'active' : ''}`}
                            onClick={() => setCatFilter(catFilter === cat ? 'all' : cat)}>
                            <span className="stat-icon">{CATEGORY_ICONS[cat]}</span>
                            <span className="stat-value">{done}/{total}</span>
                            <span className="stat-label">{CATEGORY_LABELS[cat]}</span>
                            <div className="stat-bar">
                                <div className="stat-bar-fill" style={{ width: `${(done / total) * 100}%` }} />
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* ── Filter Bar ── */}
            <div className="workspace-filters">
                <div className="filter-group">
                    <input className="filter-search" type="text" placeholder="🔍 Search assets..."
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                <div className="filter-group">
                    <label className="filter-label">Era</label>
                    <div className="filter-pills">
                        <button className={`pill ${eraFilter === 'all' ? 'active' : ''}`} onClick={() => setEraFilter('all')}>All</button>
                        {(['modern', 'medieval', 'wild-west'] as AssetEra[]).map(era => (
                            <button key={era} className={`pill ${eraFilter === era ? 'active' : ''}`}
                                onClick={() => setEraFilter(eraFilter === era ? 'all' : era)}>
                                {ERA_ICONS[era]} {ERA_LABELS[era]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="filter-group">
                    <label className="filter-label">Status</label>
                    <div className="filter-pills">
                        <button className={`pill ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
                        {(['pending', 'generating', 'generated', 'rigged', 'complete'] as AssetStatus[]).map(s => (
                            <button key={s} className={`pill ${statusFilter === s ? 'active' : ''}`}
                                onClick={() => setStatusFilter(statusFilter === s ? 'all' : s)}
                                style={{ '--pill-color': STATUS_COLORS[s] } as any}>
                                {STATUS_LABELS[s]}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="filter-group filter-actions">
                    <button className={`view-toggle ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>▦</button>
                    <button className={`view-toggle ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>☰</button>
                    <span className="filter-count">{filtered.length} assets</span>
                </div>
            </div>

            {/* ── Bulk Actions ── */}
            {selectedIds.size > 0 && (
                <div className="workspace-bulk">
                    <span className="bulk-count">{selectedIds.size} selected</span>
                    <button className="bulk-btn" onClick={() => bulkSetStatus('generating')}>⚡ Mark Generating</button>
                    <button className="bulk-btn" onClick={() => bulkSetStatus('generated')}>📦 Mark Generated</button>
                    <button className="bulk-btn" onClick={() => bulkSetStatus('rigged')}>🦴 Mark Rigged</button>
                    <button className="bulk-btn success" onClick={() => bulkSetStatus('complete')}>✅ Mark Complete</button>
                    <button className="bulk-btn danger" onClick={() => bulkSetStatus('pending')}>↩ Reset</button>
                    <button className="bulk-btn" onClick={() => setSelectedIds(new Set())}>✕ Clear</button>
                </div>
            )}

            {/* ── Select All ── */}
            <div className="workspace-selectall">
                <label className="selectall-label">
                    <input type="checkbox" checked={selectedIds.size === filtered.length && filtered.length > 0}
                        onChange={selectAll} />
                    Select all {filtered.length} visible
                </label>
            </div>

            {/* ── Asset Grid / List ── */}
            <div className={`workspace-assets ${viewMode}`}>
                {filtered.map(asset => {
                    const status = getStatus(asset.id)
                    const isSelected = selectedIds.has(asset.id)
                    const isExpanded = expandedId === asset.id
                    return (
                        <div key={asset.id}
                            className={`asset-card ${status} ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
                            style={{ '--status-color': STATUS_COLORS[status] } as any}>
                            {/* Select checkbox */}
                            <input type="checkbox" className="asset-checkbox"
                                checked={isSelected} onChange={() => toggleSelect(asset.id)} />

                            {/* Header row */}
                            <div className="asset-header" onClick={() => setExpandedId(isExpanded ? null : asset.id)}>
                                <span className="asset-era-icon">{ERA_ICONS[asset.era]}</span>
                                <span className="asset-cat-icon">{CATEGORY_ICONS[asset.category]}</span>
                                <h3 className="asset-name">{asset.name}</h3>
                                {asset.needsRigging && <span className="asset-rig-badge">🦴 Rig</span>}
                                <span className="asset-status-badge" style={{ background: STATUS_COLORS[status] }}>
                                    {STATUS_LABELS[status]}
                                </span>
                            </div>

                            {/* Description (expandable) */}
                            <p className={`asset-description ${isExpanded ? 'full' : ''}`}>{asset.description}</p>
                            <span className="asset-char-count">{asset.description.length} chars</span>

                            {/* Actions */}
                            <div className="asset-actions">
                                <button className={`asset-btn copy ${copiedId === asset.id ? 'copied' : ''}`}
                                    onClick={(e) => { e.stopPropagation(); copyDescription(asset) }}>
                                    {copiedId === asset.id ? '✓ Copied!' : '📋 Copy'}
                                </button>
                                <button className="asset-btn generate"
                                    onClick={(e) => { e.stopPropagation(); navigate('/editor/new?prompt=' + encodeURIComponent(asset.description)) }}>
                                    🚀 Generate
                                </button>
                                <select className="asset-status-select" value={status}
                                    onChange={e => { e.stopPropagation(); setAssetStatus(asset.id, e.target.value as AssetStatus) }}>
                                    <option value="pending">⏳ Pending</option>
                                    <option value="generating">⚡ Generating</option>
                                    <option value="generated">📦 Generated</option>
                                    <option value="rigged">🦴 Rigged</option>
                                    <option value="complete">✅ Complete</option>
                                </select>
                            </div>
                        </div>
                    )
                })}
            </div>

            {filtered.length === 0 && (
                <div className="workspace-empty">
                    <span className="empty-icon">🔍</span>
                    <p>No assets match your filters</p>
                    <button className="empty-reset" onClick={() => {
                        setEraFilter('all'); setCatFilter('all'); setStatusFilter('all'); setSearch('')
                    }}>Reset Filters</button>
                </div>
            )}

            <Footer />
        </div>
    )
}
