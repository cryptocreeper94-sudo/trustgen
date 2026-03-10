/* ====== TrustGen — Audio System ======
 * Spatial audio, music tracks, and SFX management for cinematic scenes.
 *
 * - Spatial 3D audio (positional sound sources)
 * - Background music with crossfade
 * - Sound effects library with categories
 * - Audio timeline sync with sequencer
 * - Volume envelopes and fade curves
 * - Audio bus mixing (master, music, SFX, dialogue)
 */

// ── Types ──

export type AudioBus = 'master' | 'music' | 'sfx' | 'dialogue' | 'ambient'

export interface AudioClip {
    id: string
    name: string
    /** URL or blob URL to the audio file */
    src: string
    /** Duration in seconds (auto-detected on load) */
    duration: number
    /** Which bus this clip routes to */
    bus: AudioBus
    /** Category for library organization */
    category: AudioCategory
    /** Whether this is a loop */
    loop: boolean
}

export type AudioCategory =
    | 'music'
    | 'ambience'
    | 'foley'
    | 'impact'
    | 'ui'
    | 'voice'
    | 'nature'
    | 'mechanical'

export interface AudioInstance {
    id: string
    clipId: string
    /** Start time on the master timeline */
    startTime: number
    /** Trim: skip this many seconds into the clip */
    trimStart: number
    /** Trim: end playback this many seconds before clip end */
    trimEnd: number
    /** Volume (0–1) */
    volume: number
    /** Pan (-1 left, 0 center, 1 right) */
    pan: number
    /** Fade in duration (seconds) */
    fadeIn: number
    /** Fade out duration (seconds) */
    fadeOut: number
    /** 3D position (for spatial audio, null = 2D) */
    spatialPosition?: { x: number; y: number; z: number }
    /** Attached to a scene node (follows it) */
    attachedNodeId?: string
    /** Muted */
    muted: boolean
}

export interface AudioBusState {
    volume: number
    muted: boolean
    solo: boolean
}

export interface AudioMixerState {
    buses: Record<AudioBus, AudioBusState>
    clips: AudioClip[]
    instances: AudioInstance[]
    masterVolume: number
}

// ── Defaults ──

export function createDefaultMixer(): AudioMixerState {
    return {
        buses: {
            master: { volume: 1, muted: false, solo: false },
            music: { volume: 0.7, muted: false, solo: false },
            sfx: { volume: 0.85, muted: false, solo: false },
            dialogue: { volume: 1, muted: false, solo: false },
            ambient: { volume: 0.5, muted: false, solo: false },
        },
        clips: [],
        instances: [],
        masterVolume: 1,
    }
}

let instanceCounter = 0

export function createAudioInstance(clipId: string, startTime: number = 0): AudioInstance {
    instanceCounter++
    return {
        id: `ai_${Date.now()}_${instanceCounter}`,
        clipId,
        startTime,
        trimStart: 0,
        trimEnd: 0,
        volume: 1,
        pan: 0,
        fadeIn: 0,
        fadeOut: 0,
        muted: false,
    }
}

// ── Volume Envelope ──

/**
 * Compute the effective volume of an audio instance at a given time.
 * Applies fade-in and fade-out curves.
 */
export function computeVolume(
    instance: AudioInstance,
    clip: AudioClip,
    currentTime: number
): number {
    if (instance.muted) return 0

    const localTime = currentTime - instance.startTime
    const effectiveDuration = clip.duration - instance.trimStart - instance.trimEnd

    if (localTime < 0 || localTime > effectiveDuration) return 0

    let vol = instance.volume

    // Fade in
    if (instance.fadeIn > 0 && localTime < instance.fadeIn) {
        vol *= localTime / instance.fadeIn
    }

    // Fade out
    const fadeOutStart = effectiveDuration - instance.fadeOut
    if (instance.fadeOut > 0 && localTime > fadeOutStart) {
        vol *= (effectiveDuration - localTime) / instance.fadeOut
    }

    return Math.max(0, Math.min(1, vol))
}

/**
 * Get all instances that should be playing at a given time.
 */
export function getActiveInstances(
    mixer: AudioMixerState,
    currentTime: number
): { instance: AudioInstance; clip: AudioClip; volume: number }[] {
    const active: { instance: AudioInstance; clip: AudioClip; volume: number }[] = []

    for (const inst of mixer.instances) {
        if (inst.muted) continue
        const clip = mixer.clips.find(c => c.id === inst.clipId)
        if (!clip) continue

        const effectiveDuration = clip.duration - inst.trimStart - inst.trimEnd
        const localTime = currentTime - inst.startTime

        if (localTime >= 0 && localTime <= effectiveDuration) {
            const vol = computeVolume(inst, clip, currentTime)
            const busState = mixer.buses[clip.bus]
            const busVol = busState.muted ? 0 : busState.volume
            const masterVol = mixer.buses.master.muted ? 0 : mixer.masterVolume

            active.push({
                instance: inst,
                clip,
                volume: vol * busVol * masterVol,
            })
        }
    }

    return active
}

// ── Built-in SFX Library (descriptors, user loads actual files) ──

export interface SFXPreset {
    name: string
    icon: string
    category: AudioCategory
    description: string
    suggestedBus: AudioBus
}

export const SFX_PRESETS: SFXPreset[] = [
    { name: 'Whoosh', icon: '💨', category: 'foley', description: 'Fast movement swoosh', suggestedBus: 'sfx' },
    { name: 'Impact Hit', icon: '💥', category: 'impact', description: 'Heavy collision or punch', suggestedBus: 'sfx' },
    { name: 'Click', icon: '🖱️', category: 'ui', description: 'UI button click', suggestedBus: 'sfx' },
    { name: 'Chime', icon: '🔔', category: 'ui', description: 'Notification or success chime', suggestedBus: 'sfx' },
    { name: 'Rain', icon: '🌧️', category: 'nature', description: 'Steady rainfall ambience', suggestedBus: 'ambient' },
    { name: 'Wind', icon: '🌬️', category: 'nature', description: 'Gentle wind ambience', suggestedBus: 'ambient' },
    { name: 'Thunder', icon: '⛈️', category: 'nature', description: 'Distant thunder rumble', suggestedBus: 'sfx' },
    { name: 'Footsteps', icon: '👣', category: 'foley', description: 'Walking footstep loop', suggestedBus: 'sfx' },
    { name: 'Heartbeat', icon: '💓', category: 'foley', description: 'Dramatic heartbeat pulse', suggestedBus: 'sfx' },
    { name: 'Engine Hum', icon: '⚙️', category: 'mechanical', description: 'Low machine hum', suggestedBus: 'ambient' },
    { name: 'Explosion', icon: '🧨', category: 'impact', description: 'Cinematic explosion boom', suggestedBus: 'sfx' },
    { name: 'Drone Pad', icon: '🎹', category: 'music', description: 'Atmospheric synth drone', suggestedBus: 'music' },
]
