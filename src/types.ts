/* ====== TrustGen — Engine Type System ====== */
import type { Object3D } from 'three'

// ── Node Types ──
export type NodeKind = 'mesh' | 'light' | 'camera' | 'group' | 'particles' | 'model'
export type PrimitiveKind = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane' | 'ring' | 'dodecahedron'
export type LightKind = 'directional' | 'point' | 'spot' | 'ambient' | 'hemisphere'

export interface Vec3 { x: number; y: number; z: number }

export interface Transform {
    position: Vec3
    rotation: Vec3
    scale: Vec3
}

export interface MaterialDef {
    color: string
    metalness: number
    roughness: number
    emissive: string
    emissiveIntensity: number
    opacity: number
    transparent: boolean
    wireframe: boolean
    preset?: MaterialPreset
    // Texture maps (data URLs or blob URLs)
    mapUrl?: string
    normalMapUrl?: string
    roughnessMapUrl?: string
}

export type MaterialPreset =
    | 'default' | 'chrome' | 'gold' | 'glass' | 'plastic'
    | 'wood' | 'concrete' | 'fabric' | 'rubber' | 'neon'

export interface LightDef {
    kind: LightKind
    color: string
    intensity: number
    castShadow: boolean
    // Spot light extras
    angle?: number
    penumbra?: number
    distance?: number
    decay?: number
}

export interface ParticleDef {
    preset: ParticlePreset
    count: number
    speed: number
    size: number
    colorStart: string
    colorEnd: string
    spread: number
    lifetime: number
}

export type ParticlePreset = 'fire' | 'smoke' | 'sparkles' | 'rain' | 'snow' | 'magic' | 'explosion' | 'fireflies'

export interface SceneNode {
    id: string
    name: string
    kind: NodeKind
    transform: Transform
    visible: boolean
    locked: boolean
    expanded: boolean        // for hierarchy tree
    parentId: string | null
    childIds: string[]
    // Kind-specific data
    primitive?: PrimitiveKind
    material?: MaterialDef
    light?: LightDef
    particles?: ParticleDef
    modelUrl?: string
    // Runtime ref (not serialized)
    _ref?: Object3D
}

// ── Animation ──
export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'bounce' | 'elastic'

export interface Keyframe {
    time: number          // seconds
    value: number
    easing: EasingType
}

export interface AnimationTrack {
    id: string
    nodeId: string
    property: string      // e.g. 'position.x', 'rotation.y', 'scale', 'opacity'
    keyframes: Keyframe[]
}

export interface TimelineState {
    playing: boolean
    looping: boolean
    currentTime: number     // seconds
    duration: number        // seconds
    speed: number
    tracks: AnimationTrack[]
}

// ── Effects ──
export interface PostProcessingState {
    bloom: { enabled: boolean; intensity: number; threshold: number }
    ssao: { enabled: boolean; intensity: number; radius: number }
    dof: { enabled: boolean; focusDistance: number; bokehScale: number }
    vignette: { enabled: boolean; darkness: number; offset: number }
    colorGrading: { enabled: boolean; brightness: number; contrast: number; saturation: number; hueShift: number }
    filmGrain: { enabled: boolean; intensity: number }
    chromaticAberration: { enabled: boolean; offset: number }
    toneMapping: 'ACES' | 'Reinhard' | 'Cineon' | 'Linear'
}

// ── Environment ──
export type EnvironmentPreset = 'studio' | 'sunset' | 'forest' | 'city' | 'warehouse' | 'night' | 'dawn' | 'apartment'

export interface EnvironmentState {
    type: 'color' | 'gradient' | 'hdri' | 'sky'
    color1: string
    color2: string
    hdriPreset: EnvironmentPreset
    showGrid: boolean
    gridSize: number
    groundShadow: boolean
    fog: boolean
    fogColor: string
    fogNear: number
    fogFar: number
}

// ── Camera ──
export interface CameraState {
    fov: number
    position: Vec3
    target: Vec3
    autoRotate: boolean
    autoRotateSpeed: number
}

// ── Editor ──
export type ToolMode = 'select' | 'translate' | 'rotate' | 'scale'
export type GizmoSpace = 'world' | 'local'
export type SidebarTab = 'scene' | 'materials' | 'animation' | 'lighting' | 'effects' | 'ai' | 'export'

export interface EditorState {
    selectedNodeId: string | null
    selectedNodeIds: string[]
    hoveredNodeId: string | null
    tool: ToolMode
    gizmoSpace: GizmoSpace
    snapping: boolean
    snapValue: number
    showGrid: boolean
    showStats: boolean
    sidebarTab: SidebarTab
    sidebarOpen: boolean
    clipboard: SceneNode[] | null
}

// ── Export ──
export type ExportFormat = 'png' | 'glb' | 'webm' | 'gif' | 'sequence' | 'json'

export interface ExportState {
    format: ExportFormat
    width: number
    height: number
    quality: number
    transparent: boolean
}

// ── Model Info ──
export interface ModelInfo {
    name: string
    vertices: number
    triangles: number
    animations: number
    hasRig: boolean
    materials: string[]
}

// ── Root Engine State ──
export interface EngineState {
    // Scene graph
    nodes: Record<string, SceneNode>
    rootNodeIds: string[]

    // Sub-states
    editor: EditorState
    timeline: TimelineState
    environment: EnvironmentState
    camera: CameraState
    postProcessing: PostProcessingState
    exportSettings: ExportState

    // Actions — Scene
    addNode: (node: Partial<SceneNode> & { kind: NodeKind }) => string
    removeNode: (id: string) => void
    updateNode: (id: string, patch: Partial<SceneNode>) => void
    selectNode: (id: string | null) => void
    selectMultiple: (ids: string[]) => void
    toggleSelect: (id: string) => void
    duplicateNode: (id: string) => string
    reparentNode: (id: string, newParentId: string | null) => void
    copyNodes: () => void
    pasteNodes: () => void

    // Actions — Editor
    setTool: (tool: ToolMode) => void
    setGizmoSpace: (space: GizmoSpace) => void
    setSidebarTab: (tab: SidebarTab) => void
    toggleSidebar: () => void
    setSnapping: (on: boolean) => void
    toggleStats: () => void

    // Actions — Timeline
    setPlaying: (playing: boolean) => void
    setCurrentTime: (time: number) => void
    setDuration: (dur: number) => void
    setTimelineSpeed: (speed: number) => void
    toggleLoop: () => void
    addKeyframe: (nodeId: string, property: string, value: number) => void
    removeKeyframe: (trackId: string, time: number) => void

    // Actions — Environment
    updateEnvironment: (patch: Partial<EnvironmentState>) => void

    // Actions — Camera
    updateCamera: (patch: Partial<CameraState>) => void

    // Actions — Post Processing
    updatePostProcessing: (patch: Partial<PostProcessingState>) => void
    updateEffect: <K extends keyof PostProcessingState>(key: K, patch: Partial<PostProcessingState[K]> | PostProcessingState[K]) => void

    // Actions — Export
    updateExport: (patch: Partial<ExportState>) => void

    // Undo / Redo
    undo: () => void
    redo: () => void
    canUndo: boolean
    canRedo: boolean
}

// ── Material Presets ──
export const MATERIAL_PRESETS: Record<MaterialPreset, Omit<MaterialDef, 'preset'>> = {
    default: { color: '#888888', metalness: 0.0, roughness: 0.5, emissive: '#000000', emissiveIntensity: 0, opacity: 1, transparent: false, wireframe: false },
    chrome: { color: '#cccccc', metalness: 1.0, roughness: 0.05, emissive: '#000000', emissiveIntensity: 0, opacity: 1, transparent: false, wireframe: false },
    gold: { color: '#ffd700', metalness: 1.0, roughness: 0.15, emissive: '#000000', emissiveIntensity: 0, opacity: 1, transparent: false, wireframe: false },
    glass: { color: '#88ccff', metalness: 0.0, roughness: 0.05, emissive: '#000000', emissiveIntensity: 0, opacity: 0.35, transparent: true, wireframe: false },
    plastic: { color: '#ff6b6b', metalness: 0.0, roughness: 0.4, emissive: '#000000', emissiveIntensity: 0, opacity: 1, transparent: false, wireframe: false },
    wood: { color: '#8B6914', metalness: 0.0, roughness: 0.8, emissive: '#000000', emissiveIntensity: 0, opacity: 1, transparent: false, wireframe: false },
    concrete: { color: '#999999', metalness: 0.0, roughness: 0.95, emissive: '#000000', emissiveIntensity: 0, opacity: 1, transparent: false, wireframe: false },
    fabric: { color: '#4a6fa1', metalness: 0.0, roughness: 0.9, emissive: '#000000', emissiveIntensity: 0, opacity: 1, transparent: false, wireframe: false },
    rubber: { color: '#2d2d2d', metalness: 0.0, roughness: 0.7, emissive: '#000000', emissiveIntensity: 0, opacity: 1, transparent: false, wireframe: false },
    neon: { color: '#00ff88', metalness: 0.0, roughness: 0.2, emissive: '#00ff88', emissiveIntensity: 2, opacity: 1, transparent: false, wireframe: false },
}

// ── Default Values ──
export const DEFAULT_TRANSFORM: Transform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
}

export const DEFAULT_MATERIAL: MaterialDef = { ...MATERIAL_PRESETS.default, preset: 'default' }
