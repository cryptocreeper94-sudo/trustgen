/* ====== TrustGen — Studio IDE Panel ====== */
/* Split-screen code editor + file tree + bottom panel */
import React, { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
import { useStudioStore, PROJECT_TEMPLATES, type StudioFile } from '../stores/studioStore'

// Lazy-load Monaco and AI panel to avoid blocking initial render
const MonacoEditor = lazy(() => import('./MonacoEditor'))
const AiAssistantPanel = lazy(() => import('./AiAssistantPanel'))

// ── File icons ──
function FileIcon({ name, isFolder }: { name: string; isFolder: boolean }) {
    if (isFolder) return <span className="studio-icon">📁</span>
    const ext = name.split('.').pop()?.toLowerCase() || ''
    const icons: Record<string, string> = {
        ts: '🟦', tsx: '⚛️', js: '🟨', jsx: '⚛️', py: '🐍', rs: '🦀',
        go: '🐹', html: '🌐', css: '🎨', json: '📋', md: '📄',
        glsl: '🔮', wgsl: '🔮', glb: '🧊', gltf: '🧊', fbx: '📦',
        obj: '📐', hdr: '🌅', yml: '⚙️', yaml: '⚙️', toml: '⚙️',
    }
    return <span className="studio-icon">{icons[ext] || '📄'}</span>
}

// ── File Tree Item ──
function FileTreeItem({ file, depth = 0 }: { file: StudioFile; depth?: number }) {
    const [expanded, setExpanded] = useState(true)
    const { selectFile, deleteFile, activeFileId, files } = useStudioStore()
    const isActive = activeFileId === file.id

    const children = files.filter(f => {
        if (file.is_folder) {
            const parentPath = file.path.endsWith('/') ? file.path : file.path + '/'
            return f.path.startsWith(parentPath) && f.path !== file.path &&
                f.path.slice(parentPath.length).indexOf('/') === -1
        }
        return false
    })

    return (
        <div>
            <div
                className={`studio-file-item ${isActive ? 'active' : ''}`}
                style={{ paddingLeft: 8 + depth * 16 }}
                onClick={() => file.is_folder ? setExpanded(!expanded) : selectFile(file)}
                onContextMenu={(e) => {
                    e.preventDefault()
                    if (confirm(`Delete "${file.name}"?`)) deleteFile(file.id)
                }}
            >
                {file.is_folder && (
                    <span className="studio-folder-arrow">{expanded ? '▾' : '▸'}</span>
                )}
                <FileIcon name={file.name} isFolder={file.is_folder} />
                <span className="studio-file-name">{file.name}</span>
            </div>
            {file.is_folder && expanded && children.map(child => (
                <FileTreeItem key={child.id} file={child} depth={depth + 1} />
            ))}
        </div>
    )
}

// ── Tab Bar ──
function TabBar() {
    const { openTabIds, activeFileId, files, unsavedFileIds, selectFile, closeTab } = useStudioStore()

    return (
        <div className="studio-tab-bar">
            {openTabIds.map(tabId => {
                const file = files.find(f => f.id === tabId)
                if (!file) return null
                const isActive = activeFileId === tabId
                const isUnsaved = unsavedFileIds.has(tabId)
                return (
                    <div
                        key={tabId}
                        className={`studio-tab ${isActive ? 'active' : ''}`}
                        onClick={() => selectFile(file)}
                    >
                        <FileIcon name={file.name} isFolder={false} />
                        <span>{file.name}</span>
                        {isUnsaved && <span className="studio-tab-dot">●</span>}
                        <button
                            className="studio-tab-close"
                            onClick={(e) => { e.stopPropagation(); closeTab(tabId) }}
                        >×</button>
                    </div>
                )
            })}
        </div>
    )
}

// ── Bottom Panel ──
function BottomPanel() {
    const {
        bottomTab, setBottomTab, bottomPanelOpen,
        consoleOutput, commits, diagnostics, diagnosticsSummary,
    } = useStudioStore()
    const [termInput, setTermInput] = useState('')
    const [commitMsg, setCommitMsg] = useState('')
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [consoleOutput])

    if (!bottomPanelOpen) return null

    const tabs: { id: typeof bottomTab; icon: string; label: string }[] = [
        { id: 'console', icon: '⌨️', label: 'Console' },
        { id: 'terminal', icon: '💻', label: 'Terminal' },
        { id: 'git', icon: '🔀', label: 'Git' },
        { id: 'problems', icon: '⚠️', label: `Problems${diagnosticsSummary.errors + diagnosticsSummary.warnings > 0 ? ` (${diagnosticsSummary.errors + diagnosticsSummary.warnings})` : ''}` },
        { id: 'deploy', icon: '🚀', label: 'Deploy' },
        { id: 'trusthub', icon: '🔗', label: 'TrustHub' },
    ]

    return (
        <div className="studio-bottom-panel">
            <div className="studio-bottom-tabs">
                {tabs.map(t => (
                    <button
                        key={t.id}
                        className={`studio-bottom-tab ${bottomTab === t.id ? 'active' : ''}`}
                        onClick={() => setBottomTab(t.id)}
                    >
                        <span>{t.icon}</span> {t.label}
                    </button>
                ))}
            </div>
            <div className="studio-bottom-content" ref={scrollRef}>
                {bottomTab === 'console' && (
                    <div className="studio-console">
                        {consoleOutput.map((line, i) => (
                            <div key={i} className={`studio-console-line ${line.type}`}>
                                {line.content}
                            </div>
                        ))}
                    </div>
                )}

                {bottomTab === 'terminal' && (
                    <div className="studio-terminal">
                        {consoleOutput.filter(l => l.type === 'input' || l.type === 'output').map((line, i) => (
                            <div key={i} className={`studio-console-line ${line.type}`}>{line.content}</div>
                        ))}
                        <div className="studio-terminal-input">
                            <span className="studio-terminal-prompt">$</span>
                            <input
                                value={termInput}
                                onChange={e => setTermInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && termInput.trim()) {
                                        useStudioStore.getState().sendTerminalCommand(termInput)
                                        setTermInput('')
                                    }
                                }}
                                placeholder="Enter command..."
                                className="studio-terminal-field"
                            />
                        </div>
                    </div>
                )}

                {bottomTab === 'git' && (
                    <div className="studio-git">
                        <div className="studio-git-form">
                            <input
                                value={commitMsg}
                                onChange={e => setCommitMsg(e.target.value)}
                                placeholder="Commit message..."
                                className="studio-input"
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && commitMsg.trim()) {
                                        useStudioStore.getState().commit(commitMsg)
                                        setCommitMsg('')
                                    }
                                }}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={() => { useStudioStore.getState().commit(commitMsg); setCommitMsg('') }}
                                disabled={!commitMsg.trim()}
                                style={{ fontSize: 11 }}
                            >
                                📝 Commit
                            </button>
                        </div>
                        <div className="studio-commit-list">
                            {commits.length === 0 && <div className="studio-empty">No commits yet</div>}
                            {commits.map(c => (
                                <div key={c.id} className="studio-commit-item">
                                    <span className="studio-commit-hash">{c.hash.slice(0, 8)}</span>
                                    <span className="studio-commit-msg">{c.message}</span>
                                    <span className="studio-commit-date">{new Date(c.created_at).toLocaleDateString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {bottomTab === 'problems' && (
                    <div className="studio-problems">
                        {diagnostics.length === 0 && <div className="studio-empty">No problems detected ✅</div>}
                        {diagnostics.map((d, i) => (
                            <div key={i} className={`studio-diagnostic ${d.severity}`}>
                                <span className="studio-diag-severity">
                                    {d.severity === 'error' ? '❌' : d.severity === 'warning' ? '⚠️' : 'ℹ️'}
                                </span>
                                <span className="studio-diag-line">L{d.line}</span>
                                <span className="studio-diag-message">{d.message}</span>
                            </div>
                        ))}
                    </div>
                )}

                {bottomTab === 'deploy' && (
                    <DeployPanel />
                )}

                {bottomTab === 'trusthub' && (
                    <TrustHubPanel />
                )}
            </div>
        </div>
    )
}

// ── Command Palette ──
function CommandPalette() {
    const { showCommandPalette, toggleCommandPalette, files, selectFile } = useStudioStore()
    const [query, setQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (showCommandPalette && inputRef.current) inputRef.current.focus()
    }, [showCommandPalette])

    if (!showCommandPalette) return null

    const commands = [
        { id: 'save', label: '💾 Save File', shortcut: 'Ctrl+S', action: () => useStudioStore.getState().saveFile() },
        { id: 'console', label: '⌨️ Toggle Console', shortcut: 'Ctrl+B', action: () => useStudioStore.getState().toggleBottomPanel() },
        { id: 'lint', label: '🔍 Run Lint Check', shortcut: '', action: () => useStudioStore.getState().runLint() },
        { id: 'ai', label: '🧠 Toggle AI Assistant', shortcut: 'Ctrl+I', action: () => useStudioStore.getState().toggleAiPanel() },
    ]

    // Add files as quick-open targets
    const fileCommands = files
        .filter(f => !f.is_folder)
        .map(f => ({
            id: `file-${f.id}`,
            label: `📄 ${f.name}`,
            shortcut: f.path,
            action: () => selectFile(f),
        }))

    const allCommands = [...commands, ...fileCommands]
    const filtered = query
        ? allCommands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
        : allCommands

    return (
        <div className="studio-command-overlay" onClick={toggleCommandPalette}>
            <div className="studio-command-palette" onClick={e => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Type a command or file name..."
                    className="studio-command-input"
                    onKeyDown={e => {
                        if (e.key === 'Escape') toggleCommandPalette()
                        if (e.key === 'Enter' && filtered.length > 0) {
                            filtered[0].action()
                            toggleCommandPalette()
                            setQuery('')
                        }
                    }}
                />
                <div className="studio-command-results">
                    {filtered.map(cmd => (
                        <button
                            key={cmd.id}
                            className="studio-command-item"
                            onClick={() => { cmd.action(); toggleCommandPalette(); setQuery('') }}
                        >
                            <span>{cmd.label}</span>
                            {cmd.shortcut && <span className="studio-command-shortcut">{cmd.shortcut}</span>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── New File Dialog ──
function NewFileDialog() {
    const { showNewFile, createFile } = useStudioStore()
    const [name, setName] = useState('')

    if (!showNewFile) return null

    return (
        <div className="studio-new-file">
            <input
                autoFocus
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="filename.ts"
                className="studio-input"
                onKeyDown={e => {
                    if (e.key === 'Enter' && name.trim()) { createFile(name); setName('') }
                    if (e.key === 'Escape') useStudioStore.setState({ showNewFile: false })
                }}
            />
            <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                <button className="btn btn-primary" style={{ flex: 1, fontSize: 10 }} onClick={() => { createFile(name); setName('') }}>
                    📄 File
                </button>
                <button className="btn" style={{ flex: 1, fontSize: 10 }} onClick={() => { createFile(name, true); setName('') }}>
                    📁 Folder
                </button>
            </div>
        </div>
    )
}

// ── Deploy Panel ──
function DeployPanel() {
    const { projectId } = useStudioStore()
    const [deploying, setDeploying] = useState(false)
    const [deployInfo, setDeployInfo] = useState<{ status: string; url: string; logs: string } | null>(null)

    const handleDeploy = async () => {
        if (!projectId) return
        setDeploying(true)
        try {
            const { api } = await import('../api/apiClient')
            const result = await api.post<any>(`/api/studio/projects/${projectId}/deploy`)
            setDeployInfo({ status: result.status, url: result.url, logs: 'Build starting...' })
            // Poll for status
            const poll = setInterval(async () => {
                try {
                    const status = await api.get<any>(`/api/studio/projects/${projectId}/deploy`)
                    if (status.deployments?.[0]) {
                        const d = status.deployments[0]
                        setDeployInfo({ status: d.status, url: d.url, logs: d.build_logs || '' })
                        if (d.status === 'live' || d.status === 'failed') clearInterval(poll)
                    }
                } catch { clearInterval(poll) }
            }, 2000)
            setTimeout(() => clearInterval(poll), 30000)
        } catch {
            setDeployInfo({ status: 'failed', url: '', logs: 'Deploy failed. Pro subscription required.' })
        }
        setDeploying(false)
    }

    return (
        <div className="studio-deploy">
            <button className="btn btn-primary" style={{ width: '100%', fontSize: 11 }}
                onClick={handleDeploy} disabled={deploying || !projectId}>
                {deploying ? '⏳ Deploying...' : '🚀 Deploy to TrustGen'}
            </button>
            {deployInfo && (
                <div style={{ marginTop: 8 }}>
                    <div className="studio-deploy-status">
                        <span className={`studio-deploy-badge ${deployInfo.status}`}>
                            {deployInfo.status === 'live' ? '🟢' : deployInfo.status === 'building' ? '🟡' : '🔴'} {deployInfo.status}
                        </span>
                        {deployInfo.url && (
                            <a href={deployInfo.url} target="_blank" rel="noopener noreferrer"
                                className="studio-deploy-url">{deployInfo.url}</a>
                        )}
                    </div>
                    {deployInfo.logs && (
                        <pre className="studio-deploy-logs">{deployInfo.logs}</pre>
                    )}
                </div>
            )}
            {!deployInfo && <div className="studio-empty" style={{ marginTop: 6 }}>
                Deploy to a .trustgen.app domain. Pro subscription required.
            </div>}
        </div>
    )
}

// ── TrustHub Panel ──
function TrustHubPanel() {
    const { projectId, files } = useStudioStore()
    const [stamps, setStamps] = useState<any[]>([])
    const [stamping, setStamping] = useState(false)

    useEffect(() => {
        if (!projectId) return
        import('../api/apiClient').then(({ api }) => {
            api.get(`/api/studio/projects/${projectId}/stamps`).then(setStamps).catch(() => { })
        })
    }, [projectId])

    const handleStamp = async () => {
        if (!projectId) return
        setStamping(true)
        try {
            const { api } = await import('../api/apiClient')
            const result = await api.post<any>(`/api/studio/projects/${projectId}/stamp`, {
                files: files.filter(f => !f.is_folder).map(f => ({ name: f.name, content: f.content })),
            })
            setStamps(prev => [result, ...prev])
            useStudioStore.getState().addConsoleOutput('output', `🔗 Code stamp: ${result.hash?.slice(0, 12)}`)
        } catch {
            useStudioStore.getState().addConsoleOutput('error', '❌ Stamp failed')
        }
        setStamping(false)
    }

    return (
        <div className="studio-trusthub">
            <button className="btn" style={{ width: '100%', fontSize: 11 }}
                onClick={handleStamp} disabled={stamping || !projectId}>
                {stamping ? '⏳ Stamping...' : '🔗 Stamp Code Provenance'}
            </button>
            <div className="studio-stamp-list" style={{ marginTop: 6 }}>
                {stamps.length === 0 && <div className="studio-empty">No stamps yet. Create a blockchain-verified record.</div>}
                {stamps.map((s: any, i: number) => (
                    <div key={i} className="studio-stamp-item">
                        <span className="studio-commit-hash">{(s.hash || '').slice(0, 12)}</span>
                        <span className="studio-commit-date">{s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ── Secrets Panel ──
function SecretsPanel() {
    const { projectId } = useStudioStore()
    const [secrets, setSecrets] = useState<any[]>([])
    const [newKey, setNewKey] = useState('')
    const [newVal, setNewVal] = useState('')

    useEffect(() => {
        if (!projectId) return
        import('../api/apiClient').then(({ api }) => {
            api.get(`/api/studio/projects/${projectId}/secrets`).then(setSecrets).catch(() => { })
        })
    }, [projectId])

    const addSecret = async () => {
        if (!projectId || !newKey.trim()) return
        try {
            const { api } = await import('../api/apiClient')
            const s = await api.post(`/api/studio/projects/${projectId}/secrets`, { key: newKey, value: newVal })
            setSecrets(prev => [...prev, s])
            setNewKey(''); setNewVal('')
        } catch { }
    }

    const deleteSecret = async (id: string) => {
        try {
            const { api } = await import('../api/apiClient')
            await api.delete(`/api/studio/secrets/${id}`)
            setSecrets(prev => prev.filter(s => s.id !== id))
        } catch { }
    }

    return (
        <>
            <div className="studio-sidebar-header"><span>Secrets</span></div>
            <div style={{ padding: '4px 8px' }}>
                <input className="studio-input" value={newKey} onChange={e => setNewKey(e.target.value)}
                    placeholder="KEY_NAME" style={{ marginBottom: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 10 }} />
                <input className="studio-input" value={newVal} onChange={e => setNewVal(e.target.value)}
                    placeholder="value" type="password" style={{ marginBottom: 4 }} />
                <button className="btn btn-primary" style={{ width: '100%', fontSize: 10 }} onClick={addSecret}
                    disabled={!newKey.trim()}>+ Add Secret</button>
                {secrets.map((s: any) => (
                    <div key={s.id} className="studio-secret-item">
                        <span className="studio-secret-key">🔑 {s.key}</span>
                        <span className="studio-secret-val">••••••</span>
                        <button className="studio-tab-close" onClick={() => deleteSecret(s.id)}>×</button>
                    </div>
                ))}
                {secrets.length === 0 && <div className="studio-empty">No secrets set</div>}
            </div>
        </>
    )
}

// ── Config Panel ──
function ConfigPanel() {
    const { projectId } = useStudioStore()
    const [configs, setConfigs] = useState<any[]>([])
    const [newKey, setNewKey] = useState('')
    const [newVal, setNewVal] = useState('')

    useEffect(() => {
        if (!projectId) return
        import('../api/apiClient').then(({ api }) => {
            api.get(`/api/studio/projects/${projectId}/configs`).then(setConfigs).catch(() => { })
        })
    }, [projectId])

    const addConfig = async () => {
        if (!projectId || !newKey.trim()) return
        try {
            const { api } = await import('../api/apiClient')
            const c = await api.post(`/api/studio/projects/${projectId}/configs`, { key: newKey, value: newVal })
            setConfigs(prev => [...prev, c])
            setNewKey(''); setNewVal('')
        } catch { }
    }

    const deleteConfig = async (id: string) => {
        try {
            const { api } = await import('../api/apiClient')
            await api.delete(`/api/studio/configs/${id}`)
            setConfigs(prev => prev.filter(c => c.id !== id))
        } catch { }
    }

    return (
        <>
            <div className="studio-sidebar-header"><span>Config</span></div>
            <div style={{ padding: '4px 8px' }}>
                <input className="studio-input" value={newKey} onChange={e => setNewKey(e.target.value)}
                    placeholder="config_key" style={{ marginBottom: 4 }} />
                <input className="studio-input" value={newVal} onChange={e => setNewVal(e.target.value)}
                    placeholder="config_value" style={{ marginBottom: 4 }} />
                <button className="btn btn-primary" style={{ width: '100%', fontSize: 10 }} onClick={addConfig}
                    disabled={!newKey.trim()}>+ Add Config</button>
                {configs.map((c: any) => (
                    <div key={c.id} className="studio-secret-item">
                        <span className="studio-secret-key">⚙️ {c.key}</span>
                        <span className="studio-secret-val" style={{ color: '#94a3b8' }}>{c.value}</span>
                        <button className="studio-tab-close" onClick={() => deleteConfig(c.id)}>×</button>
                    </div>
                ))}
                {configs.length === 0 && <div className="studio-empty">No config set</div>}
            </div>
        </>
    )
}

// ══════════════════════════════════════════════
//  PROJECT PICKER (shown when no project loaded)
// ══════════════════════════════════════════════

function ProjectPicker() {
    const { projectList, loadProjects, loadProject, createProject, deleteProject } = useStudioStore()
    const [newName, setNewName] = useState('')
    const [selectedTemplate, setSelectedTemplate] = useState('react')

    useEffect(() => { loadProjects() }, [loadProjects])

    const handleCreate = async () => {
        if (!newName.trim()) return
        const template = PROJECT_TEMPLATES.find(t => t.key === selectedTemplate)
        await createProject(newName, template?.language || 'javascript')
        setNewName('')
    }

    return (
        <div className="studio-project-picker">
            <div className="studio-welcome-icon">⚡</div>
            <h3 style={{ color: '#22d3ee', marginBottom: 4 }}>TrustGen Studio</h3>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>
                Full-featured IDE with Monaco editor, Git, AI assistant, and 3D integration
            </p>

            {/* New Project */}
            <div className="studio-picker-section">
                <div className="studio-picker-label">New Project</div>
                <input
                    className="studio-input"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    placeholder="My Awesome Project"
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    style={{ marginBottom: 8 }}
                />
                <div className="studio-template-grid">
                    {PROJECT_TEMPLATES.map(t => (
                        <button
                            key={t.key}
                            className={`studio-template-card ${selectedTemplate === t.key ? 'active' : ''}`}
                            onClick={() => setSelectedTemplate(t.key)}
                            title={t.description}
                        >
                            <span className="studio-template-icon">{t.icon}</span>
                            <span className="studio-template-name">{t.name}</span>
                        </button>
                    ))}
                </div>
                <button className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} onClick={handleCreate} disabled={!newName.trim()}>
                    🚀 Create Project
                </button>
            </div>

            {/* Existing Projects */}
            {projectList.length > 0 && (
                <div className="studio-picker-section" style={{ marginTop: 16 }}>
                    <div className="studio-picker-label">Your Projects</div>
                    <div className="studio-project-list">
                        {projectList.map(p => (
                            <div key={p.id} className="studio-project-card" onClick={() => loadProject(p.id)}>
                                <span className="studio-project-lang">
                                    {PROJECT_TEMPLATES.find(t => t.language === p.language)?.icon || '📄'}
                                </span>
                                <div className="studio-project-info">
                                    <span className="studio-project-name">{p.name}</span>
                                    <span className="studio-project-desc">{p.language}</span>
                                </div>
                                <button
                                    className="studio-tab-close"
                                    onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${p.name}"?`)) deleteProject(p.id) }}
                                    title="Delete project"
                                >×</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Shortcuts */}
            <div className="studio-welcome-shortcuts" style={{ marginTop: 16 }}>
                <div><kbd>Ctrl+K</kbd> Command Palette</div>
                <div><kbd>Ctrl+S</kbd> Save File</div>
                <div><kbd>Ctrl+B</kbd> Toggle Console</div>
                <div><kbd>Ctrl+I</kbd> AI Assistant</div>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════
//  MAIN STUDIO PANEL
// ══════════════════════════════════════════════

export function StudioPanel() {
    const {
        panelOpen, panelWidth, files, activeFileId, editorContent,
        sidebarTab, setSidebarTab, setEditorContent, saveFile, saving,
        projectId, projectName, loading, searchQuery, setSearchQuery,
        searchFiles, searchResults, selectFile,
    } = useStudioStore()

    const activeFile = files.find(f => f.id === activeFileId)
    const resizeRef = useRef<HTMLDivElement>(null)
    const isDragging = useRef(false)

    // ── Keyboard shortcuts ──
    useEffect(() => {
        if (!panelOpen) return
        const handler = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 's') { e.preventDefault(); saveFile() }
            if (e.ctrlKey && e.key === 'k') { e.preventDefault(); useStudioStore.getState().toggleCommandPalette() }
            if (e.ctrlKey && e.key === 'b') { e.preventDefault(); useStudioStore.getState().toggleBottomPanel() }
            if (e.ctrlKey && e.key === 'i') { e.preventDefault(); useStudioStore.getState().toggleAiPanel() }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [panelOpen, saveFile])

    // ── Resize drag ──
    const handleResizeStart = useCallback((e: React.PointerEvent) => {
        isDragging.current = true
        e.currentTarget.setPointerCapture(e.pointerId)
    }, [])

    const handleResizeMove = useCallback((e: React.PointerEvent) => {
        if (!isDragging.current) return
        const containerWidth = window.innerWidth
        const newWidth = (e.clientX / containerWidth) * 100
        useStudioStore.getState().setPanelWidth(newWidth)
    }, [])

    const handleResizeEnd = useCallback(() => {
        isDragging.current = false
    }, [])

    if (!panelOpen) return null

    // If no project loaded, show project picker
    if (!projectId) {
        return (
            <div className="studio-panel" style={{ width: `${panelWidth}%` }}>
                <CommandPalette />
                <div className="studio-header">
                    <span className="studio-title">Studio IDE</span>
                </div>
                <ProjectPicker />
                <div
                    ref={resizeRef}
                    className="studio-resize-handle"
                    onPointerDown={handleResizeStart}
                    onPointerMove={handleResizeMove}
                    onPointerUp={handleResizeEnd}
                />
            </div>
        )
    }

    const rootFiles = files.filter(f => {
        const parts = f.path.split('/').filter(Boolean)
        return parts.length <= 1
    })

    const sidebarTabs: { id: typeof sidebarTab; icon: string; label: string }[] = [
        { id: 'files', icon: '📂', label: 'Files' },
        { id: 'search', icon: '🔍', label: 'Search' },
        { id: 'secrets', icon: '🔑', label: 'Secrets' },
        { id: 'config', icon: '⚙️', label: 'Config' },
    ]

    return (
        <div className="studio-panel" style={{ width: `${panelWidth}%` }}>
            {/* Command Palette */}
            <CommandPalette />

            {/* Header */}
            <div className="studio-header">
                <span className="studio-title">
                    <button
                        className="studio-back-btn"
                        onClick={() => useStudioStore.setState({ projectId: null, projectName: '', files: [], activeFileId: null, openTabIds: [] })}
                        title="Back to projects"
                    >←</button>
                    {projectName || 'Studio IDE'}
                    {saving && <span className="studio-saving">Saving...</span>}
                </span>
                <div className="studio-header-actions">
                    <button className="studio-header-btn" onClick={() => useStudioStore.getState().toggleCommandPalette()} title="Command Palette (Ctrl+K)">
                        ⌘K
                    </button>
                    <button className="studio-header-btn" onClick={saveFile} title="Save (Ctrl+S)">
                        💾
                    </button>
                    <button className="studio-header-btn studio-hot-apply-btn" onClick={() => useStudioStore.getState().hotApplyToScene()} title="Hot Apply to 3D Scene">
                        🎮
                    </button>
                    <button className="studio-header-btn" onClick={() => useStudioStore.getState().toggleAiPanel()} title="AI Assistant (Ctrl+I)">
                        🧠
                    </button>
                </div>
            </div>

            <div className="studio-body">
                {/* Sidebar */}
                <div className="studio-sidebar">
                    <div className="studio-sidebar-tabs">
                        {sidebarTabs.map(t => (
                            <button
                                key={t.id}
                                className={`studio-sidebar-tab ${sidebarTab === t.id ? 'active' : ''}`}
                                onClick={() => setSidebarTab(t.id)}
                                title={t.label}
                            >{t.icon}</button>
                        ))}
                    </div>
                    <div className="studio-sidebar-content">
                        {sidebarTab === 'files' && (
                            <>
                                <div className="studio-sidebar-header">
                                    <span>Files</span>
                                    <button
                                        className="studio-header-btn"
                                        onClick={() => useStudioStore.setState({ showNewFile: true })}
                                        title="New File"
                                    >+</button>
                                </div>
                                <NewFileDialog />
                                {loading ? (
                                    <div className="studio-empty">Loading...</div>
                                ) : rootFiles.length === 0 ? (
                                    <div className="studio-empty" style={{ padding: 12 }}>
                                        <div style={{ marginBottom: 8 }}>No files yet</div>
                                        <button className="btn btn-primary" style={{ width: '100%', fontSize: 11 }}
                                            onClick={() => useStudioStore.setState({ showNewFile: true })}>
                                            + Create File
                                        </button>
                                    </div>
                                ) : (
                                    <div className="studio-file-tree">
                                        {rootFiles.map(f => <FileTreeItem key={f.id} file={f} />)}
                                    </div>
                                )}
                            </>
                        )}
                        {sidebarTab === 'search' && (
                            <>
                                <div className="studio-sidebar-header">
                                    <span>Search</span>
                                </div>
                                <div style={{ padding: '4px 8px' }}>
                                    <input
                                        className="studio-input"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && searchFiles()}
                                        placeholder="Search in files..."
                                    />
                                    {searchResults.map((r, i) => (
                                        <div key={i} className="studio-search-result" onClick={() => {
                                            const file = files.find(f => f.id === r.fileId)
                                            if (file) selectFile(file)
                                        }}>
                                            <span className="studio-search-file">{r.fileName}:{r.line}</span>
                                            <span className="studio-search-content">{r.content.slice(0, 60)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                        {sidebarTab === 'secrets' && (
                            <SecretsPanel />
                        )}
                        {sidebarTab === 'config' && (
                            <ConfigPanel />
                        )}
                    </div>
                </div>

                {/* Editor Area */}
                <div className="studio-editor-area">
                    <TabBar />
                    <div className="studio-editor-container">
                        {activeFile ? (
                            <Suspense fallback={<div className="studio-editor-loading">Loading editor...</div>}>
                                <MonacoEditor
                                    value={editorContent}
                                    language={activeFile.language}
                                    onChange={setEditorContent}
                                />
                            </Suspense>
                        ) : (
                            <div className="studio-welcome">
                                <div className="studio-welcome-icon">📝</div>
                                <h3>Select a file</h3>
                                <p>Choose a file from the sidebar to begin editing.</p>
                            </div>
                        )}
                    </div>
                    <BottomPanel />
                    <Suspense fallback={null}>
                        <AiAssistantPanel />
                    </Suspense>
                </div>
            </div>

            {/* Resize Handle */}
            <div
                ref={resizeRef}
                className="studio-resize-handle"
                onPointerDown={handleResizeStart}
                onPointerMove={handleResizeMove}
                onPointerUp={handleResizeEnd}
            />
        </div>
    )
}

export default StudioPanel
