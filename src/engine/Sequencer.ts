/* ====== TrustGen — Multi-Shot Sequencer ======
 * Cinematic sequencer for multi-shot scenes (mini NLE).
 *
 * - Multiple shots with independent cameras and durations
 * - Shot transitions (cut, crossfade, wipe, zoom, fade)
 * - Cinematic camera presets with varied angles and movements
 * - Master timeline plays shots in sequence
 */

// ── Types ──
export type TransitionType = 'cut' | 'crossfade' | 'wipe-left' | 'wipe-right' | 'zoom-in' | 'zoom-out' | 'fade-black'
export type CameraMoveType = 'static' | 'pan' | 'orbit' | 'dolly' | 'crane' | 'follow' | 'shake'

export interface CameraKeyframe {
    time: number
    position: { x: number; y: number; z: number }
    lookAt: { x: number; y: number; z: number }
    fov: number
}

export interface Shot {
    id: string
    name: string
    duration: number
    cameraMove: CameraMoveType
    cameraKeyframes: CameraKeyframe[]
    transitionIn: TransitionType
    transitionDuration: number
    visibleNodeIds: string[] | 'all'
    audioClipId?: string
    color: string
}

export interface SequencerState {
    shots: Shot[]
    activeShotIndex: number
    playheadPosition: number
    playing: boolean
    loop: boolean
    speed: number
    totalDuration: number
}

// ── Colors ──
const SHOT_COLORS = ['#06b6d4', '#14b8a6', '#22d3ee', '#0ea5e9', '#34d399', '#38bdf8', '#a855f7', '#ec4899', '#f97316', '#84cc16']
let shotCounter = 0

export function createShot(overrides?: Partial<Shot>): Shot {
    shotCounter++
    return {
        id: `shot_${Date.now()}_${shotCounter}`,
        name: `Shot ${shotCounter}`,
        duration: 3,
        cameraMove: 'static',
        cameraKeyframes: [{ time: 0, position: { x: 5, y: 3, z: 5 }, lookAt: { x: 0, y: 1, z: 0 }, fov: 50 }],
        transitionIn: 'cut',
        transitionDuration: 0.5,
        visibleNodeIds: 'all',
        color: SHOT_COLORS[shotCounter % SHOT_COLORS.length],
        ...overrides,
    }
}

export function createDefaultSequencer(): SequencerState {
    const first = createShot({ name: 'Opening Shot', duration: 4, cameraMove: 'orbit' })
    return { shots: [first], activeShotIndex: 0, playheadPosition: 0, playing: false, loop: false, speed: 1, totalDuration: first.duration }
}

// ── Operations ──

export function computeTotalDuration(shots: Shot[]): number {
    return shots.reduce((sum, s) => sum + s.duration, 0)
}

export function getShotAtTime(shots: Shot[], time: number): { shotIndex: number; localTime: number } {
    let acc = 0
    for (let i = 0; i < shots.length; i++) {
        if (time < acc + shots[i].duration) return { shotIndex: i, localTime: time - acc }
        acc += shots[i].duration
    }
    return { shotIndex: shots.length - 1, localTime: shots[shots.length - 1]?.duration ?? 0 }
}

export function getShotStartTime(shots: Shot[], idx: number): number {
    let t = 0
    for (let i = 0; i < idx && i < shots.length; i++) t += shots[i].duration
    return t
}

function lerpV3(a: { x: number; y: number; z: number }, b: { x: number; y: number; z: number }, t: number) {
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, z: a.z + (b.z - a.z) * t }
}

export function interpolateCamera(shot: Shot, localTime: number): CameraKeyframe {
    const kfs = shot.cameraKeyframes
    if (!kfs.length) return { time: 0, position: { x: 5, y: 3, z: 5 }, lookAt: { x: 0, y: 1, z: 0 }, fov: 50 }
    if (kfs.length === 1 || localTime <= kfs[0].time) return kfs[0]
    if (localTime >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1]
    for (let i = 0; i < kfs.length - 1; i++) {
        if (localTime >= kfs[i].time && localTime <= kfs[i + 1].time) {
            const t = (localTime - kfs[i].time) / (kfs[i + 1].time - kfs[i].time)
            const s = t * t * (3 - 2 * t) // smoothstep
            return { time: localTime, position: lerpV3(kfs[i].position, kfs[i + 1].position, s), lookAt: lerpV3(kfs[i].lookAt, kfs[i + 1].lookAt, s), fov: kfs[i].fov + (kfs[i + 1].fov - kfs[i].fov) * s }
        }
    }
    return kfs[kfs.length - 1]
}

// ═══════════════════════════════════════════════════
//  CINEMATIC CAMERA PRESETS
//  Varied angles, heights, FOV changes, and movements
// ═══════════════════════════════════════════════════

/** Shot variety counter — ensures each scene gets a unique camera angle */
let varietyIndex = 0

export function generateCameraPreset(type: CameraMoveType, dur: number, center = { x: 0, y: 1, z: 0 }): CameraKeyframe[] {
    varietyIndex++
    const v = varietyIndex % 8 // 8 varieties per type

    switch (type) {
        case 'static': {
            // Static but with varied angles
            const angles = [
                { pos: { x: 4, y: 2.5, z: 4 }, fov: 50 },     // 3/4 view
                { pos: { x: 0, y: 2, z: 5 }, fov: 45 },       // front
                { pos: { x: -3, y: 1.5, z: 4 }, fov: 55 },    // left
                { pos: { x: 5, y: 1, z: 2 }, fov: 40 },       // right low
                { pos: { x: 0, y: 4, z: 3 }, fov: 50 },       // high front
                { pos: { x: -2, y: 0.8, z: 3 }, fov: 60 },    // low left
                { pos: { x: 3, y: 3, z: -2 }, fov: 45 },      // behind high
                { pos: { x: 1, y: 1.5, z: 6 }, fov: 35 },     // telephoto front
            ]
            const a = angles[v]
            return [{ time: 0, position: a.pos, lookAt: center, fov: a.fov }]
        }

        case 'pan': {
            // Horizontal sweep with height variation
            const height = 1.5 + (v % 3) * 1.5
            const dist = 4 + (v % 2) * 2
            return [
                { time: 0, position: { x: -dist, y: height, z: dist * 0.7 }, lookAt: center, fov: 50 },
                { time: dur * 0.5, position: { x: 0, y: height - 0.3, z: dist }, lookAt: center, fov: 48 },
                { time: dur, position: { x: dist, y: height, z: dist * 0.7 }, lookAt: center, fov: 50 },
            ]
        }

        case 'orbit': {
            // Full or partial orbit at varied heights and distances
            const heights = [2, 3.5, 1.5, 5, 2.5, 4, 1, 3]
            const dists = [5, 7, 4, 8, 6, 5, 3.5, 6.5]
            const h = heights[v]
            const d = dists[v]
            const startAngle = (v * Math.PI * 0.3) // offset start angle per scene
            const arcLength = (v % 2 === 0) ? Math.PI * 1.5 : Math.PI * 2 // partial or full orbit
            const kfCount = 6

            return Array.from({ length: kfCount }, (_, i) => {
                const t = i / (kfCount - 1)
                const angle = startAngle + t * arcLength
                const currentH = h + Math.sin(t * Math.PI) * 0.8 // slight height arc
                const fov = 45 + Math.sin(t * Math.PI) * 8 // fov breathe
                return {
                    time: t * dur,
                    position: { x: Math.cos(angle) * d, y: currentH, z: Math.sin(angle) * d },
                    lookAt: { x: center.x, y: center.y + Math.sin(t * Math.PI * 2) * 0.3, z: center.z },
                    fov,
                }
            })
        }

        case 'dolly': {
            // Push in or pull out with varied angles
            const pushIn = v % 2 === 0
            const angle = (v * 0.4)
            const startDist = pushIn ? 8 : 3
            const endDist = pushIn ? 2.5 : 8
            const startH = pushIn ? 2.5 : 1.5
            const endH = pushIn ? 1.5 : 3
            const startFov = pushIn ? 55 : 35
            const endFov = pushIn ? 35 : 55

            return [
                { time: 0, position: { x: Math.cos(angle) * startDist, y: startH, z: Math.sin(angle) * startDist }, lookAt: center, fov: startFov },
                { time: dur * 0.4, position: { x: Math.cos(angle) * (startDist + endDist) / 2, y: (startH + endH) / 2, z: Math.sin(angle) * (startDist + endDist) / 2 }, lookAt: center, fov: (startFov + endFov) / 2 },
                { time: dur, position: { x: Math.cos(angle) * endDist, y: endH, z: Math.sin(angle) * endDist }, lookAt: center, fov: endFov },
            ]
        }

        case 'crane': {
            // Low to high with dramatic reveal
            const angle = v * 0.5
            const d = 3 + (v % 3)
            return [
                { time: 0, position: { x: Math.cos(angle) * d, y: 0.3, z: Math.sin(angle) * d }, lookAt: { ...center, y: 0.5 }, fov: 60 },
                { time: dur * 0.3, position: { x: Math.cos(angle + 0.2) * d, y: 2, z: Math.sin(angle + 0.2) * d }, lookAt: center, fov: 50 },
                { time: dur * 0.7, position: { x: Math.cos(angle + 0.5) * (d + 1), y: 5, z: Math.sin(angle + 0.5) * (d + 1) }, lookAt: center, fov: 42 },
                { time: dur, position: { x: Math.cos(angle + 0.8) * (d + 2), y: 8, z: Math.sin(angle + 0.8) * (d + 2) }, lookAt: center, fov: 35 },
            ]
        }

        case 'follow': {
            // Arc around subject with slight approach
            const startAngle = v * 0.7
            const d = 4
            return [
                { time: 0, position: { x: Math.cos(startAngle) * d, y: 1.5, z: Math.sin(startAngle) * d }, lookAt: center, fov: 50 },
                { time: dur * 0.3, position: { x: Math.cos(startAngle + 0.3) * (d - 0.5), y: 1.8, z: Math.sin(startAngle + 0.3) * (d - 0.5) }, lookAt: { ...center, y: center.y + 0.2 }, fov: 48 },
                { time: dur * 0.7, position: { x: Math.cos(startAngle + 0.8) * (d - 1), y: 2.2, z: Math.sin(startAngle + 0.8) * (d - 1) }, lookAt: center, fov: 45 },
                { time: dur, position: { x: Math.cos(startAngle + 1.2) * d, y: 2, z: Math.sin(startAngle + 1.2) * d }, lookAt: center, fov: 50 },
            ]
        }

        case 'shake': {
            const kfs: CameraKeyframe[] = []
            const n = Math.floor(dur * 8)
            for (let i = 0; i <= n; i++) {
                const t = (i / n) * dur
                const decay = Math.max(0, 1 - i / n) * 0.15
                kfs.push({
                    time: t,
                    position: {
                        x: 5 + (Math.random() - 0.5) * decay,
                        y: 3 + (Math.random() - 0.5) * decay,
                        z: 5 + (Math.random() - 0.5) * decay,
                    },
                    lookAt: center,
                    fov: 50 + (Math.random() - 0.5) * decay * 30,
                })
            }
            return kfs
        }

        default:
            return [{ time: 0, position: { x: 5, y: 3, z: 5 }, lookAt: center, fov: 50 }]
    }
}

/**
 * Select a cinematic camera movement based on scene index.
 * Ensures variety across the documentary with no repeated patterns.
 */
export function selectCinematicMove(sceneIndex: number, mood?: string): CameraMoveType {
    const pattern: CameraMoveType[] = [
        'orbit',   // Scene 1: establishing orbit
        'dolly',   // Scene 2: push in
        'crane',   // Scene 3: dramatic crane
        'pan',     // Scene 4: lateral sweep
        'follow',  // Scene 5: tracking
        'orbit',   // Scene 6: wide orbit  
        'dolly',   // Scene 7: pull out
        'crane',   // Scene 8: low to high
    ]

    if (mood === 'dramatic') return 'crane'
    if (mood === 'intimate') return 'dolly'
    if (mood === 'epic') return 'orbit'

    return pattern[sceneIndex % pattern.length]
}

// ── Shot Presets ──
export interface ShotPreset { name: string; icon: string; description: string; create: () => Shot }

export const SHOT_PRESETS: ShotPreset[] = [
    { name: 'Wide Establishing', icon: '🏔️', description: 'Slow orbit around scene', create: () => createShot({ name: 'Wide Establishing', duration: 6, cameraMove: 'orbit', cameraKeyframes: generateCameraPreset('orbit', 6, { x: 0, y: 0, z: 0 }) }) },
    { name: 'Close-Up', icon: '🔍', description: 'Tight dolly in', create: () => createShot({ name: 'Close-Up', duration: 3, cameraMove: 'dolly', cameraKeyframes: generateCameraPreset('dolly', 3) }) },
    { name: 'Crane Shot', icon: '🏗️', description: 'Low to high reveal', create: () => createShot({ name: 'Crane Shot', duration: 5, cameraMove: 'crane', cameraKeyframes: generateCameraPreset('crane', 5) }) },
    { name: 'Tracking Shot', icon: '🎯', description: 'Follow subject', create: () => createShot({ name: 'Tracking Shot', duration: 4, cameraMove: 'follow', cameraKeyframes: generateCameraPreset('follow', 4) }) },
    { name: 'Impact Shake', icon: '💥', description: 'Camera shake with decay', create: () => createShot({ name: 'Impact Shake', duration: 2, cameraMove: 'shake', cameraKeyframes: generateCameraPreset('shake', 2) }) },
]
