/* ====== TrustGen — Animation Engine ====== */
/* Evaluates keyframe tracks and applies animated values to scene nodes each frame */
import { useFrame } from '@react-three/fiber'
import { useEngineStore } from '../store'
import type { EasingType, AnimationTrack } from '../types'

// ── Easing Functions ──
function ease(t: number, type: EasingType): number {
    switch (type) {
        case 'linear': return t
        case 'easeIn': return t * t * t
        case 'easeOut': return 1 - Math.pow(1 - t, 3)
        case 'easeInOut': return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
        case 'bounce': {
            const n = 7.5625
            const d = 2.75
            let tt = t
            if (tt < 1 / d) return n * tt * tt
            else if (tt < 2 / d) return n * (tt -= 1.5 / d) * tt + 0.75
            else if (tt < 2.5 / d) return n * (tt -= 2.25 / d) * tt + 0.9375
            else return n * (tt -= 2.625 / d) * tt + 0.984375
        }
        case 'elastic': {
            if (t === 0 || t === 1) return t
            return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * (2 * Math.PI / 3))
        }
        default: return t
    }
}

// ── Evaluate a track at a given time ──
function evaluateTrack(track: AnimationTrack, time: number): number | null {
    const kfs = track.keyframes
    if (kfs.length === 0) return null
    if (kfs.length === 1) return kfs[0].value
    if (time <= kfs[0].time) return kfs[0].value
    if (time >= kfs[kfs.length - 1].time) return kfs[kfs.length - 1].value

    // Find surrounding keyframes
    for (let i = 0; i < kfs.length - 1; i++) {
        const a = kfs[i]
        const b = kfs[i + 1]
        if (time >= a.time && time <= b.time) {
            const t = (time - a.time) / (b.time - a.time)
            const easedT = ease(t, b.easing)
            return a.value + (b.value - a.value) * easedT
        }
    }
    return null
}

// ── Apply a value to a node property ──
function applyToNode(nodeId: string, property: string, value: number) {
    const state = useEngineStore.getState()
    const node = state.nodes[nodeId]
    if (!node) return

    const parts = property.split('.')

    if (parts.length === 2) {
        const [group, axis] = parts
        if (group === 'position' || group === 'rotation' || group === 'scale') {
            if (axis === 'x' || axis === 'y' || axis === 'z') {
                state.updateNode(nodeId, {
                    transform: {
                        ...node.transform,
                        [group]: { ...node.transform[group], [axis]: value }
                    }
                })
            }
        }
    } else if (parts[0] === 'scale') {
        // Uniform scale
        state.updateNode(nodeId, {
            transform: {
                ...node.transform,
                scale: { x: value, y: value, z: value }
            }
        })
    } else if (parts[0] === 'opacity' && node.material) {
        state.updateNode(nodeId, {
            material: { ...node.material, opacity: value, transparent: value < 1 }
        })
    }
}

// ── React component that drives the animation loop ──
export function AnimationEngine() {
    useFrame((_, delta) => {
        const state = useEngineStore.getState()
        const { timeline } = state

        if (!timeline.playing) return

        // Advance time
        let newTime = timeline.currentTime + delta * timeline.speed
        if (newTime > timeline.duration) {
            if (timeline.looping) {
                newTime = newTime % timeline.duration
            } else {
                newTime = timeline.duration
                state.setPlaying(false)
            }
        }
        state.setCurrentTime(newTime)

        // Evaluate all tracks
        for (const track of timeline.tracks) {
            const value = evaluateTrack(track, newTime)
            if (value !== null) {
                applyToNode(track.nodeId, track.property, value)
            }
        }
    })

    return null
}
