/* ====== TrustGen — Multi-Shot Sequencer ======
 * Cinematic sequencer for multi-shot scenes (mini NLE).
 *
 * - Multiple shots with independent cameras and durations
 * - Shot transitions (cut, crossfade, wipe, zoom, fade)
 * - Camera presets (pan, orbit, dolly, crane, follow, shake)
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
            const s = t * t * (3 - 2 * t)
            return { time: localTime, position: lerpV3(kfs[i].position, kfs[i + 1].position, s), lookAt: lerpV3(kfs[i].lookAt, kfs[i + 1].lookAt, s), fov: kfs[i].fov + (kfs[i + 1].fov - kfs[i].fov) * s }
        }
    }
    return kfs[kfs.length - 1]
}

export function generateCameraPreset(type: CameraMoveType, dur: number, center = { x: 0, y: 1, z: 0 }): CameraKeyframe[] {
    switch (type) {
        case 'static': return [{ time: 0, position: { x: 5, y: 3, z: 5 }, lookAt: center, fov: 50 }]
        case 'pan': return [{ time: 0, position: { x: -5, y: 3, z: 5 }, lookAt: center, fov: 50 }, { time: dur, position: { x: 5, y: 3, z: 5 }, lookAt: center, fov: 50 }]
        case 'orbit': return Array.from({ length: 5 }, (_, i) => { const a = (i / 4) * Math.PI * 2; return { time: (i / 4) * dur, position: { x: Math.cos(a) * 6, y: 3, z: Math.sin(a) * 6 }, lookAt: center, fov: 50 } })
        case 'dolly': return [{ time: 0, position: { x: 0, y: 2, z: 10 }, lookAt: center, fov: 50 }, { time: dur, position: { x: 0, y: 2, z: 3 }, lookAt: center, fov: 50 }]
        case 'crane': return [{ time: 0, position: { x: 3, y: 0.5, z: 3 }, lookAt: center, fov: 55 }, { time: dur * 0.5, position: { x: 2, y: 5, z: 2 }, lookAt: center, fov: 45 }, { time: dur, position: { x: 0, y: 8, z: 0 }, lookAt: center, fov: 40 }]
        case 'follow': return [{ time: 0, position: { x: -2, y: 2, z: 4 }, lookAt: center, fov: 50 }, { time: dur, position: { x: 2, y: 2, z: 4 }, lookAt: { ...center, x: center.x + 2 }, fov: 50 }]
        case 'shake': { const kfs: CameraKeyframe[] = []; const n = Math.floor(dur * 8); for (let i = 0; i <= n; i++) { const t = (i / n) * dur, int = Math.max(0, 1 - i / n) * 0.15; kfs.push({ time: t, position: { x: 5 + (Math.random() - 0.5) * int, y: 3 + (Math.random() - 0.5) * int, z: 5 + (Math.random() - 0.5) * int }, lookAt: center, fov: 50 }); } return kfs }
        default: return [{ time: 0, position: { x: 5, y: 3, z: 5 }, lookAt: center, fov: 50 }]
    }
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
