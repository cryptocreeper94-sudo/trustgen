/* ====== TrustGen — Zustand Engine Store ====== */
import { create } from 'zustand'
import { v4 as uuid } from 'uuid'
import type {
    EngineState, SceneNode,
    MaterialDef,
    LightDef, Transform
} from './types'

const defaultTransform = (): Transform => ({
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
})

const defaultMaterial = (): MaterialDef => ({
    color: '#888888', metalness: 0.0, roughness: 0.5,
    emissive: '#000000', emissiveIntensity: 0, opacity: 1,
    transparent: false, wireframe: false, preset: 'default',
})

const defaultLight = (): LightDef => ({
    kind: 'point', color: '#ffffff', intensity: 1, castShadow: true,
})

// History for undo/redo
type HistoryEntry = { nodes: Record<string, SceneNode>; rootNodeIds: string[] }
const MAX_HISTORY = 50
let historyStack: HistoryEntry[] = []
let historyIndex = -1

function pushHistory(state: { nodes: Record<string, SceneNode>; rootNodeIds: string[] }) {
    const entry: HistoryEntry = {
        nodes: JSON.parse(JSON.stringify(state.nodes)),
        rootNodeIds: [...state.rootNodeIds],
    }
    historyStack = historyStack.slice(0, historyIndex + 1)
    historyStack.push(entry)
    if (historyStack.length > MAX_HISTORY) historyStack.shift()
    historyIndex = historyStack.length - 1
}

export const useEngineStore = create<EngineState>((set, get) => ({
    // ── Scene Graph ──
    nodes: {},
    rootNodeIds: [],

    // ── Editor ──
    editor: {
        selectedNodeId: null,
        selectedNodeIds: [],
        hoveredNodeId: null,
        tool: 'select' as const,
        gizmoSpace: 'world' as const,
        snapping: false,
        snapValue: 0.5,
        showGrid: true,
        showStats: false,
        sidebarTab: 'scene' as const,
        sidebarOpen: false, // Cockpit Treatment: maximize viewport by default
        clipboard: null,
    },

    // ── Timeline ──
    timeline: {
        playing: false,
        looping: true,
        currentTime: 0,
        duration: 10,
        speed: 1,
        tracks: [],
    },

    // ── Environment ──
    environment: {
        type: 'gradient',
        color1: '#0a0a1a',
        color2: '#1a1a2e',
        hdriPreset: 'studio',
        showGrid: true,
        gridSize: 20,
        groundShadow: true,
        fog: false,
        fogColor: '#0a0a1a',
        fogNear: 10,
        fogFar: 50,
    },

    // ── Camera ──
    camera: {
        fov: 50,
        position: { x: 5, y: 4, z: 8 },
        target: { x: 0, y: 0, z: 0 },
        autoRotate: false,
        autoRotateSpeed: 1,
    },

    // ── Post Processing ──
    postProcessing: {
        bloom: { enabled: true, intensity: 0.5, threshold: 0.8 },
        ssao: { enabled: false, intensity: 0.5, radius: 0.5 },
        dof: { enabled: false, focusDistance: 5, bokehScale: 3 },
        vignette: { enabled: true, darkness: 0.4, offset: 0.5 },
        colorGrading: { enabled: false, brightness: 0, contrast: 0, saturation: 0, hueShift: 0 },
        filmGrain: { enabled: false, intensity: 0.3 },
        chromaticAberration: { enabled: false, offset: 0.002 },
        toneMapping: 'ACES',
    },

    // ── Export ──
    exportSettings: {
        format: 'png',
        width: 1920,
        height: 1080,
        quality: 0.95,
        transparent: false,
    },

    // ── Undo / Redo ──
    canUndo: false,
    canRedo: false,

    undo: () => {
        if (historyIndex <= 0) return
        historyIndex--
        const entry = historyStack[historyIndex]
        set({
            nodes: JSON.parse(JSON.stringify(entry.nodes)),
            rootNodeIds: [...entry.rootNodeIds],
            canUndo: historyIndex > 0,
            canRedo: true,
        })
    },

    redo: () => {
        if (historyIndex >= historyStack.length - 1) return
        historyIndex++
        const entry = historyStack[historyIndex]
        set({
            nodes: JSON.parse(JSON.stringify(entry.nodes)),
            rootNodeIds: [...entry.rootNodeIds],
            canUndo: true,
            canRedo: historyIndex < historyStack.length - 1,
        })
    },

    // ── Scene Actions ──
    addNode: (partial) => {
        const state = get()
        pushHistory({ nodes: state.nodes, rootNodeIds: state.rootNodeIds })

        const id = uuid()
        const node: SceneNode = {
            id,
            name: partial.name || `${partial.kind}_${Object.keys(state.nodes).length + 1}`,
            kind: partial.kind,
            transform: partial.transform || defaultTransform(),
            visible: partial.visible ?? true,
            locked: false,
            expanded: true,
            parentId: partial.parentId || null,
            childIds: [],
            ...(partial.kind === 'mesh' && {
                primitive: partial.primitive || 'box',
                material: partial.material || defaultMaterial(),
            }),
            ...(partial.kind === 'light' && {
                light: partial.light || defaultLight(),
            }),
            ...(partial.kind === 'model' && {
                modelUrl: partial.modelUrl,
                material: partial.material || defaultMaterial(),
            }),
            ...(partial.kind === 'particles' && {
                particles: partial.particles || {
                    preset: 'sparkles', count: 200, speed: 1, size: 0.05,
                    colorStart: '#ff6b6b', colorEnd: '#ffd93d', spread: 3, lifetime: 3,
                },
            }),
        }

        const newNodes = { ...state.nodes, [id]: node }
        const newRootIds = node.parentId ? state.rootNodeIds : [...state.rootNodeIds, id]

        if (node.parentId && newNodes[node.parentId]) {
            newNodes[node.parentId] = {
                ...newNodes[node.parentId],
                childIds: [...newNodes[node.parentId].childIds, id],
            }
        }

        set({
            nodes: newNodes,
            rootNodeIds: newRootIds,
            canUndo: true,
            canRedo: false,
            editor: { ...state.editor, selectedNodeId: id },
        })
        return id
    },

    removeNode: (id) => {
        const state = get()
        pushHistory({ nodes: state.nodes, rootNodeIds: state.rootNodeIds })

        const removeRecursive = (nodeId: string, nodes: Record<string, SceneNode>) => {
            const node = nodes[nodeId]
            if (!node) return nodes
            for (const childId of node.childIds) {
                nodes = removeRecursive(childId, nodes)
            }
            const { [nodeId]: _, ...rest } = nodes
            return rest
        }

        let newNodes = { ...state.nodes }
        const node = newNodes[id]
        if (!node) return

        // Remove from parent
        if (node.parentId && newNodes[node.parentId]) {
            newNodes[node.parentId] = {
                ...newNodes[node.parentId],
                childIds: newNodes[node.parentId].childIds.filter(c => c !== id),
            }
        }

        newNodes = removeRecursive(id, newNodes)

        set({
            nodes: newNodes,
            rootNodeIds: state.rootNodeIds.filter(r => r !== id),
            editor: {
                ...state.editor,
                selectedNodeId: state.editor.selectedNodeId === id ? null : state.editor.selectedNodeId,
            },
            canUndo: true,
            canRedo: false,
        })
    },

    updateNode: (id, patch) => {
        const state = get()
        const node = state.nodes[id]
        if (!node) return
        set({
            nodes: {
                ...state.nodes,
                [id]: { ...node, ...patch },
            },
        })
    },

    selectNode: (id) => {
        set(s => ({ editor: { ...s.editor, selectedNodeId: id, selectedNodeIds: id ? [id] : [] } }))
    },

    selectMultiple: (ids) => {
        set(s => ({ editor: { ...s.editor, selectedNodeIds: ids, selectedNodeId: ids[ids.length - 1] || null } }))
    },

    toggleSelect: (id) => {
        set(s => {
            const ids = s.editor.selectedNodeIds.includes(id)
                ? s.editor.selectedNodeIds.filter(i => i !== id)
                : [...s.editor.selectedNodeIds, id]
            return { editor: { ...s.editor, selectedNodeIds: ids, selectedNodeId: ids[ids.length - 1] || null } }
        })
    },

    duplicateNode: (id) => {
        const state = get()
        const node = state.nodes[id]
        if (!node) return id
        pushHistory({ nodes: state.nodes, rootNodeIds: state.rootNodeIds })

        const newId = uuid()
        const cloned: SceneNode = {
            ...JSON.parse(JSON.stringify(node)),
            id: newId,
            name: `${node.name}_copy`,
            childIds: [],
            _ref: undefined,
        }
        cloned.transform.position.x += 1

        const newNodes = { ...state.nodes, [newId]: cloned }
        const newRootIds = cloned.parentId ? state.rootNodeIds : [...state.rootNodeIds, newId]

        if (cloned.parentId && newNodes[cloned.parentId]) {
            newNodes[cloned.parentId] = {
                ...newNodes[cloned.parentId],
                childIds: [...newNodes[cloned.parentId].childIds, newId],
            }
        }

        set({
            nodes: newNodes,
            rootNodeIds: newRootIds,
            editor: { ...state.editor, selectedNodeId: newId },
            canUndo: true,
            canRedo: false,
        })
        return newId
    },

    reparentNode: (id, newParentId) => {
        const state = get()
        const node = state.nodes[id]
        if (!node) return
        pushHistory({ nodes: state.nodes, rootNodeIds: state.rootNodeIds })

        const newNodes = { ...state.nodes }

        // Remove from old parent
        if (node.parentId && newNodes[node.parentId]) {
            newNodes[node.parentId] = {
                ...newNodes[node.parentId],
                childIds: newNodes[node.parentId].childIds.filter(c => c !== id),
            }
        }

        // Add to new parent
        if (newParentId && newNodes[newParentId]) {
            newNodes[newParentId] = {
                ...newNodes[newParentId],
                childIds: [...newNodes[newParentId].childIds, id],
            }
        }

        newNodes[id] = { ...node, parentId: newParentId }

        let newRootIds = state.rootNodeIds
        if (!node.parentId && newParentId) {
            newRootIds = newRootIds.filter(r => r !== id)
        } else if (node.parentId && !newParentId) {
            newRootIds = [...newRootIds, id]
        }

        set({ nodes: newNodes, rootNodeIds: newRootIds, canUndo: true, canRedo: false })
    },

    copyNodes: () => {
        const state = get()
        const ids = state.editor.selectedNodeIds.length > 0
            ? state.editor.selectedNodeIds
            : state.editor.selectedNodeId ? [state.editor.selectedNodeId] : []
        if (ids.length === 0) return
        const copies = ids
            .map(id => state.nodes[id])
            .filter(Boolean)
            .map(n => ({ ...JSON.parse(JSON.stringify(n)), _ref: undefined }))
        set(s => ({ editor: { ...s.editor, clipboard: copies } }))
    },

    pasteNodes: () => {
        const state = get()
        const clipboard = state.editor.clipboard
        if (!clipboard || clipboard.length === 0) return
        pushHistory({ nodes: state.nodes, rootNodeIds: state.rootNodeIds })

        let newNodes = { ...state.nodes }
        let newRootIds = [...state.rootNodeIds]
        const pastedIds: string[] = []

        for (const orig of clipboard) {
            const newId = uuid()
            const cloned: SceneNode = {
                ...JSON.parse(JSON.stringify(orig)),
                id: newId,
                name: `${orig.name}_paste`,
                parentId: null,
                childIds: [],
                _ref: undefined,
            }
            cloned.transform.position.x += 1
            newNodes[newId] = cloned
            newRootIds.push(newId)
            pastedIds.push(newId)
        }

        set({
            nodes: newNodes,
            rootNodeIds: newRootIds,
            editor: { ...state.editor, selectedNodeIds: pastedIds, selectedNodeId: pastedIds[0] || null },
            canUndo: true,
            canRedo: false,
        })
    },

    // ── Editor Actions ──
    setTool: (tool) => set(s => ({ editor: { ...s.editor, tool } })),
    setGizmoSpace: (space) => set(s => ({ editor: { ...s.editor, gizmoSpace: space } })),
    setSidebarTab: (tab) => set(s => ({ editor: { ...s.editor, sidebarTab: tab } })),
    toggleSidebar: () => set(s => ({ editor: { ...s.editor, sidebarOpen: !s.editor.sidebarOpen } })),
    setSnapping: (on) => set(s => ({ editor: { ...s.editor, snapping: on } })),
    toggleStats: () => set(s => ({ editor: { ...s.editor, showStats: !s.editor.showStats } })),

    // ── Timeline Actions ──
    setPlaying: (playing) => set(s => ({ timeline: { ...s.timeline, playing } })),
    setCurrentTime: (time) => set(s => ({ timeline: { ...s.timeline, currentTime: time } })),
    setDuration: (dur) => set(s => ({ timeline: { ...s.timeline, duration: dur } })),
    setTimelineSpeed: (speed) => set(s => ({ timeline: { ...s.timeline, speed } })),
    toggleLoop: () => set(s => ({ timeline: { ...s.timeline, looping: !s.timeline.looping } })),

    addKeyframe: (nodeId, property, value) => {
        const state = get()
        const tracks = [...state.timeline.tracks]
        let track = tracks.find(t => t.nodeId === nodeId && t.property === property)

        if (!track) {
            track = { id: uuid(), nodeId, property, keyframes: [] }
            tracks.push(track)
        }

        const kfIndex = track.keyframes.findIndex(k => Math.abs(k.time - state.timeline.currentTime) < 0.01)
        if (kfIndex >= 0) {
            track.keyframes[kfIndex] = { time: state.timeline.currentTime, value, easing: 'easeInOut' }
        } else {
            track.keyframes.push({ time: state.timeline.currentTime, value, easing: 'easeInOut' })
            track.keyframes.sort((a, b) => a.time - b.time)
        }

        set({ timeline: { ...state.timeline, tracks } })
    },

    removeKeyframe: (trackId, time) => {
        set(s => ({
            timeline: {
                ...s.timeline,
                tracks: s.timeline.tracks.map(t =>
                    t.id === trackId
                        ? { ...t, keyframes: t.keyframes.filter(k => Math.abs(k.time - time) > 0.01) }
                        : t
                ).filter(t => t.keyframes.length > 0),
            },
        }))
    },

    // ── Environment Actions ──
    updateEnvironment: (patch) => set(s => ({ environment: { ...s.environment, ...patch } })),

    // ── Camera Actions ──
    updateCamera: (patch) => set(s => ({ camera: { ...s.camera, ...patch } })),

    // ── Post Processing Actions ──
    updatePostProcessing: (patch) => set(s => ({
        postProcessing: { ...s.postProcessing, ...patch },
    })),

    updateEffect: (key, patch) => set(s => ({
        postProcessing: {
            ...s.postProcessing,
            [key]: typeof patch === 'string' ? patch : Object.assign({}, (s.postProcessing as any)[key], patch),
        },
    })),

    // ── Export Actions ──
    updateExport: (patch) => set(s => ({ exportSettings: { ...s.exportSettings, ...patch } })),
}))

// ── Auto-save to localStorage every 30s ──
let autoSaveTimer: ReturnType<typeof setInterval> | null = null

export function startAutoSave() {
    if (autoSaveTimer) return
    autoSaveTimer = setInterval(() => {
        try {
            const state = useEngineStore.getState()
            const serializable = {
                nodes: Object.fromEntries(
                    Object.entries(state.nodes).map(([k, v]) => [k, { ...v, _ref: undefined }])
                ),
                rootNodeIds: state.rootNodeIds,
                environment: state.environment,
                camera: state.camera,
                postProcessing: state.postProcessing,
                timeline: state.timeline,
            }
            localStorage.setItem('trustgen-autosave', JSON.stringify(serializable))
        } catch { /* ignore quota errors */ }
    }, 30_000)
}

export function loadAutoSave(): boolean {
    try {
        const raw = localStorage.getItem('trustgen-autosave')
        if (!raw) return false
        const data = JSON.parse(raw)
        if (data.nodes && data.rootNodeIds) {
            useEngineStore.setState({
                nodes: data.nodes,
                rootNodeIds: data.rootNodeIds,
                ...(data.environment && { environment: data.environment }),
                ...(data.camera && { camera: data.camera }),
                ...(data.postProcessing && { postProcessing: data.postProcessing }),
                ...(data.timeline && { timeline: { ...data.timeline, playing: false } }),
            })
            return true
        }
    } catch { /* ignore parse errors */ }
    return false
}
