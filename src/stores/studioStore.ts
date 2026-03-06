/* ====== TrustGen — Studio Store ====== */
import { create } from 'zustand'
import { api } from '../api/apiClient'

// ── Project Templates ──
export const PROJECT_TEMPLATES: { key: string; name: string; icon: string; language: string; description: string }[] = [
    { key: 'react', name: 'React App', icon: '⚛️', language: 'typescript', description: 'React + TypeScript starter' },
    { key: 'node', name: 'Node.js API', icon: '🟢', language: 'javascript', description: 'Express REST API' },
    { key: 'python', name: 'Python Flask', icon: '🐍', language: 'python', description: 'Flask web server' },
    { key: 'vue', name: 'Vue.js App', icon: '💚', language: 'javascript', description: 'Vue 3 + Composition API' },
    { key: 'nextjs', name: 'Next.js App', icon: '▲', language: 'typescript', description: 'Full-stack Next.js' },
    { key: 'go', name: 'Go API', icon: '🐹', language: 'go', description: 'Go HTTP server' },
    { key: 'rust', name: 'Rust API', icon: '🦀', language: 'rust', description: 'Actix-web server' },
    { key: 'django', name: 'Django API', icon: '🎸', language: 'python', description: 'Django REST framework' },
    { key: 'trustgen', name: 'TrustGen 3D Scene', icon: '🎨', language: 'typescript', description: 'R3F scene + shaders' },
]

// ── Types ──
export interface StudioFile {
    id: string
    project_id: string
    path: string
    name: string
    content: string
    language: string
    is_folder: boolean
}

export interface StudioProject {
    id: string
    name: string
    description: string
    language: string
    is_public: boolean
    files?: StudioFile[]
}

export interface StudioCommit {
    id: string
    hash: string
    parent_hash: string | null
    message: string
    branch: string
    created_at: string
}

export interface StudioDiagnostic {
    line: number
    severity: 'error' | 'warning' | 'info'
    message: string
    source: string
}

export type SidebarTab = 'files' | 'search' | 'secrets' | 'config'
export type BottomTab = 'console' | 'git' | 'terminal' | 'deploy' | 'problems' | 'trusthub'

interface StudioState {
    // ── Panel ──
    panelOpen: boolean
    panelWidth: number        // percentage (0-70)
    aiPanelOpen: boolean

    // ── Project ──
    projectId: string | null
    projectName: string
    projectList: StudioProject[]
    files: StudioFile[]
    loading: boolean
    saving: boolean

    // ── Editor ──
    activeFileId: string | null
    openTabIds: string[]
    unsavedFileIds: Set<string>
    editorContent: string
    originalContent: Map<string, string>  // fileId → saved content

    // ── UI ──
    sidebarTab: SidebarTab
    bottomTab: BottomTab
    bottomPanelOpen: boolean
    showCommandPalette: boolean
    showSettings: boolean
    showNewFile: boolean
    searchQuery: string
    searchResults: { fileId: string; fileName: string; line: number; content: string }[]

    // ── Console ──
    consoleOutput: { type: 'input' | 'output' | 'error'; content: string }[]
    terminalInput: string

    // ── Git ──
    commits: StudioCommit[]
    commitMessage: string

    // ── Diagnostics ──
    diagnostics: StudioDiagnostic[]
    diagnosticsSummary: { errors: number; warnings: number; info: number }

    // ── Actions ──
    togglePanel: () => void
    setPanelWidth: (w: number) => void
    toggleAiPanel: () => void
    loadProjects: () => Promise<void>
    loadProject: (id: string) => Promise<void>
    createProject: (name: string, language?: string) => Promise<StudioProject>
    deleteProject: (id: string) => Promise<void>
    selectFile: (file: StudioFile) => void
    closeTab: (fileId: string) => void
    setEditorContent: (content: string) => void
    saveFile: () => Promise<void>
    createFile: (name: string, isFolder?: boolean) => Promise<void>
    deleteFile: (fileId: string) => Promise<void>
    setSidebarTab: (tab: SidebarTab) => void
    setBottomTab: (tab: BottomTab) => void
    toggleBottomPanel: () => void
    toggleCommandPalette: () => void
    setSearchQuery: (q: string) => void
    searchFiles: () => void
    sendTerminalCommand: (cmd: string) => Promise<void>
    commit: (message: string) => Promise<void>
    loadCommits: () => Promise<void>
    runLint: () => Promise<void>
    hotApplyToScene: () => void
    addConsoleOutput: (type: 'input' | 'output' | 'error', content: string) => void
}

export const useStudioStore = create<StudioState>((set, get) => ({
    // ── Panel defaults ──
    panelOpen: false,
    panelWidth: 45,
    aiPanelOpen: false,

    // ── Project ──
    projectId: null,
    projectName: '',
    projectList: [],
    files: [],
    loading: false,
    saving: false,

    // ── Editor ──
    activeFileId: null,
    openTabIds: [],
    unsavedFileIds: new Set(),
    editorContent: '',
    originalContent: new Map(),

    // ── UI ──
    sidebarTab: 'files',
    bottomTab: 'console',
    bottomPanelOpen: false,
    showCommandPalette: false,
    showSettings: false,
    showNewFile: false,
    searchQuery: '',
    searchResults: [],

    // ── Console ──
    consoleOutput: [{ type: 'output', content: '🚀 TrustGen Studio ready.' }],
    terminalInput: '',

    // ── Git ──
    commits: [],
    commitMessage: '',

    // ── Diagnostics ──
    diagnostics: [],
    diagnosticsSummary: { errors: 0, warnings: 0, info: 0 },

    // ══════════════════════════════════
    //  ACTIONS
    // ══════════════════════════════════

    togglePanel: () => set(s => ({ panelOpen: !s.panelOpen })),
    setPanelWidth: (w) => set({ panelWidth: Math.max(20, Math.min(70, w)) }),
    toggleAiPanel: () => set(s => ({ aiPanelOpen: !s.aiPanelOpen })),

    loadProjects: async () => {
        try {
            const projects = await api.get<StudioProject[]>('/api/studio/projects')
            set({ projectList: projects })
        } catch { }
    },

    loadProject: async (id) => {
        set({ loading: true })
        try {
            const data = await api.get<any>(`/api/studio/projects/${id}`)
            set({
                projectId: id,
                projectName: data.name,
                files: data.files || [],
                loading: false,
            })
            // Auto-open first non-folder file
            const firstFile = (data.files || []).find((f: StudioFile) => !f.is_folder)
            if (firstFile) get().selectFile(firstFile)
        } catch {
            set({ loading: false })
        }
    },

    createProject: async (name, language = 'javascript') => {
        const project = await api.post<StudioProject>('/api/studio/projects', { name, language })
        await get().loadProject(project.id)
        get().loadProjects()
        return project
    },

    deleteProject: async (id) => {
        try {
            await api.delete(`/api/studio/projects/${id}`)
            set(s => ({
                projectList: s.projectList.filter(p => p.id !== id),
                ...(s.projectId === id ? { projectId: null, projectName: '', files: [], activeFileId: null, openTabIds: [] } : {}),
            }))
        } catch {
            get().addConsoleOutput('error', '❌ Failed to delete project')
        }
    },

    selectFile: (file) => {
        if (file.is_folder) return
        const { openTabIds, originalContent } = get()
        const tabIds = openTabIds.includes(file.id) ? openTabIds : [...openTabIds, file.id]
        const origMap = new Map(originalContent)
        if (!origMap.has(file.id)) origMap.set(file.id, file.content)
        set({
            activeFileId: file.id,
            openTabIds: tabIds,
            editorContent: file.content,
            originalContent: origMap,
        })
    },

    closeTab: (fileId) => {
        const { openTabIds, activeFileId, files, unsavedFileIds, originalContent } = get()
        const newTabs = openTabIds.filter(id => id !== fileId)
        const newUnsaved = new Set(unsavedFileIds)
        newUnsaved.delete(fileId)
        const newOrig = new Map(originalContent)
        newOrig.delete(fileId)

        let newActiveId = activeFileId
        let newContent = ''
        if (activeFileId === fileId) {
            const idx = openTabIds.indexOf(fileId)
            newActiveId = newTabs[Math.min(idx, newTabs.length - 1)] || null
            const newActiveFile = files.find(f => f.id === newActiveId)
            newContent = newActiveFile?.content || ''
        }

        set({
            openTabIds: newTabs,
            activeFileId: newActiveId,
            editorContent: activeFileId === fileId ? newContent : get().editorContent,
            unsavedFileIds: newUnsaved,
            originalContent: newOrig,
        })
    },

    setEditorContent: (content) => {
        const { activeFileId, originalContent, unsavedFileIds } = get()
        if (!activeFileId) return
        const orig = originalContent.get(activeFileId) || ''
        const newUnsaved = new Set(unsavedFileIds)
        if (content !== orig) {
            newUnsaved.add(activeFileId)
        } else {
            newUnsaved.delete(activeFileId)
        }
        set({ editorContent: content, unsavedFileIds: newUnsaved })
    },

    saveFile: async () => {
        const { activeFileId, editorContent, files, unsavedFileIds, originalContent } = get()
        if (!activeFileId) return
        set({ saving: true })
        try {
            await api.patch(`/api/studio/files/${activeFileId}`, { content: editorContent })
            const newFiles = files.map(f => f.id === activeFileId ? { ...f, content: editorContent } : f)
            const newUnsaved = new Set(unsavedFileIds)
            newUnsaved.delete(activeFileId)
            const newOrig = new Map(originalContent)
            newOrig.set(activeFileId, editorContent)
            set({ files: newFiles, unsavedFileIds: newUnsaved, originalContent: newOrig, saving: false })
            get().addConsoleOutput('output', `✅ Saved ${files.find(f => f.id === activeFileId)?.name}`)
            // Auto-lint after save
            get().runLint()
        } catch {
            set({ saving: false })
            get().addConsoleOutput('error', '❌ Failed to save file')
        }
    },

    createFile: async (name, isFolder = false) => {
        const { projectId } = get()
        if (!projectId) return
        try {
            const file = await api.post<StudioFile>(`/api/studio/projects/${projectId}/files`, {
                name, path: '/' + name, is_folder: isFolder,
            })
            set(s => ({ files: [...s.files, file], showNewFile: false }))
            if (!isFolder) get().selectFile(file)
        } catch {
            get().addConsoleOutput('error', `❌ Failed to create ${name}`)
        }
    },

    deleteFile: async (fileId) => {
        try {
            await api.delete(`/api/studio/files/${fileId}`)
            set(s => ({ files: s.files.filter(f => f.id !== fileId) }))
            get().closeTab(fileId)
        } catch {
            get().addConsoleOutput('error', '❌ Failed to delete file')
        }
    },

    setSidebarTab: (tab) => set({ sidebarTab: tab }),
    setBottomTab: (tab) => set({ bottomTab: tab, bottomPanelOpen: true }),
    toggleBottomPanel: () => set(s => ({ bottomPanelOpen: !s.bottomPanelOpen })),
    toggleCommandPalette: () => set(s => ({ showCommandPalette: !s.showCommandPalette })),
    setSearchQuery: (q) => set({ searchQuery: q }),

    searchFiles: () => {
        const { files, searchQuery } = get()
        if (!searchQuery.trim()) { set({ searchResults: [] }); return }
        const results: { fileId: string; fileName: string; line: number; content: string }[] = []
        const query = searchQuery.toLowerCase()
        for (const file of files) {
            if (file.is_folder || !file.content) continue
            const lines = file.content.split('\n')
            lines.forEach((line, i) => {
                if (line.toLowerCase().includes(query)) {
                    results.push({ fileId: file.id, fileName: file.name, line: i + 1, content: line.trim() })
                }
            })
        }
        set({ searchResults: results })
    },

    sendTerminalCommand: async (cmd) => {
        const { projectId } = get()
        get().addConsoleOutput('input', `$ ${cmd}`)
        if (!projectId) { get().addConsoleOutput('error', 'No project loaded'); return }
        try {
            const result = await api.post<{ output: string }>(`/api/studio/projects/${projectId}/terminal`, { command: cmd })
            get().addConsoleOutput('output', result.output)
        } catch {
            get().addConsoleOutput('error', 'Failed to execute command')
        }
    },

    commit: async (message) => {
        const { projectId } = get()
        if (!projectId) return
        try {
            await api.post(`/api/studio/projects/${projectId}/commits`, { message })
            get().addConsoleOutput('output', `📝 Committed: ${message}`)
            get().loadCommits()
        } catch {
            get().addConsoleOutput('error', '❌ Commit failed')
        }
    },

    loadCommits: async () => {
        const { projectId } = get()
        if (!projectId) return
        try {
            const commits = await api.get<StudioCommit[]>(`/api/studio/projects/${projectId}/commits`)
            set({ commits })
        } catch { }
    },

    runLint: async () => {
        const { editorContent, files, activeFileId } = get()
        if (!editorContent || !activeFileId) return
        const filename = files.find(f => f.id === activeFileId)?.name || ''
        try {
            const result = await api.post<{ diagnostics: StudioDiagnostic[]; summary: any }>('/api/studio/lint', {
                code: editorContent, filename,
            })
            set({ diagnostics: result.diagnostics, diagnosticsSummary: result.summary })
        } catch { }
    },

    hotApplyToScene: () => {
        const { editorContent, files, activeFileId } = get()
        if (!activeFileId || !editorContent) {
            get().addConsoleOutput('error', '❌ No file open to apply')
            return
        }
        const file = files.find(f => f.id === activeFileId)
        const ext = file?.name?.split('.').pop() || ''
        const isSceneCode = ['tsx', 'jsx', 'ts', 'js', 'glsl', 'frag', 'vert'].includes(ext)
        if (!isSceneCode) {
            get().addConsoleOutput('error', '❌ Only code/shader files can be applied to 3D scene')
            return
        }
        // Dispatch custom event for the 3D viewport to pick up
        window.dispatchEvent(new CustomEvent('trustgen:hot-apply', {
            detail: { code: editorContent, filename: file?.name, language: file?.language }
        }))
        get().addConsoleOutput('output', `🎮 Hot-applied ${file?.name} to 3D scene`)
    },

    addConsoleOutput: (type, content) => {
        set(s => ({
            consoleOutput: [...s.consoleOutput.slice(-200), { type, content }],
        }))
    },
}))
