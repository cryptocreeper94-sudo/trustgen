/* ====== TrustGen — Story Mode Store ======
 * Zustand store that orchestrates the text-to-documentary pipeline.
 *
 * Flow:
 *   1. ANALYZE  — splitTextIntoScenes() + analyzeScene()
 *   2. COMPOSE  — directScene() for each scene
 *   3. VOICE    — generateVoiceOver() for each scene
 *   4. SEQUENCE — create Shot[] from compositions
 *   5. PREVIEW  — user reviews timeline
 *   6. RENDER   — renderSequence() → final video
 */

import { create } from 'zustand'
import {
    generateStoryTimeline,
    summarizeTimeline,
    type StoryConfig,
    type StoryTimeline,
    type StoryStyle,
} from '../engine/StoryMode'
import { directScene, summarizeComposition, type SceneComposition } from '../engine/SceneDirector'
import {
    generateVoiceOver,
    DEFAULT_VOICE_CONFIG,
    type VoiceOverResult,
} from '../engine/VoiceOver'
import {
    createShot,
    generateCameraPreset,
    computeTotalDuration,
    getShotAtTime,
    selectCinematicMove,
    type Shot,
    type TransitionType,
} from '../engine/Sequencer'
import {
    checkConnection,
    quickImport,
    toStoryConfig,
    estimateProduction,
    type TrustBookConnection,
    type ImportResult,
} from '../engine/TrustBookBridge'

// ── Types ──

export type StoryStatus =
    | 'idle'
    | 'analyzing'
    | 'composing'
    | 'voiceover'
    | 'sequencing'
    | 'ready'
    | 'rendering'
    | 'done'
    | 'error'

export interface StoryProgress {
    step: string
    percent: number
    label: string
}

export interface PlaybackState {
    playing: boolean
    currentTime: number
    activeShotIndex: number
    totalDuration: number
}

interface StoryState {
    // ── User Inputs ──
    text: string
    style: StoryStyle
    narratorVoice: string
    title: string

    // ── Pipeline State ──
    status: StoryStatus
    progress: StoryProgress
    error: string | null

    // ── Generated Artifacts ──
    timeline: StoryTimeline | null
    compositions: SceneComposition[]
    voiceOvers: VoiceOverResult[]
    shots: Shot[]
    summary: string | null

    // ── Playback ──
    playback: PlaybackState

    // ── TrustBook ──
    trustBookConnection: TrustBookConnection | null
    importResult: ImportResult | null

    // ── Actions ──
    setText: (text: string) => void
    setStyle: (style: StoryStyle) => void
    setTitle: (title: string) => void
    setNarratorVoice: (voice: string) => void
    generateDocumentary: () => Promise<void>
    importFromTrustBook: (ebookId: string) => Promise<void>
    checkTrustBookConnection: () => Promise<void>
    startPlayback: () => void
    pausePlayback: () => void
    stopPlayback: () => void
    setPlaybackTime: (time: number) => void
    setActiveShotIndex: (idx: number) => void
    reset: () => void
}


export const useStoryStore = create<StoryState>((set, get) => ({
    // ── Defaults ──
    text: '',
    style: 'documentary',
    narratorVoice: 'narrator',
    title: 'Untitled Documentary',

    status: 'idle',
    progress: { step: '', percent: 0, label: '' },
    error: null,

    timeline: null,
    compositions: [],
    voiceOvers: [],
    shots: [],
    summary: null,

    playback: { playing: false, currentTime: 0, activeShotIndex: 0, totalDuration: 0 },

    trustBookConnection: null,
    importResult: null,

    // ── Setters ──
    setText: (text) => set({ text }),
    setStyle: (style) => set({ style }),
    setTitle: (title) => set({ title }),
    setNarratorVoice: (voice) => set({ narratorVoice: voice }),

    // ── Main Pipeline ──
    generateDocumentary: async () => {
        const { text, style, narratorVoice, title } = get()
        if (!text.trim()) {
            set({ error: 'No text provided', status: 'error' })
            return
        }

        try {
            // ── Step 1: ANALYZE ──
            set({
                status: 'analyzing',
                error: null,
                progress: { step: 'analyze', percent: 10, label: 'Analyzing text and splitting into scenes...' },
            })

            const config: StoryConfig = {
                title: title || 'Documentary',
                text,
                style,
                narratorVoice,
                targetDuration: 0, // auto
                showTitleCard: true,
                showCredits: true,
                musicMood: 'ambient',
            }

            const timeline = generateStoryTimeline(config)
            const summary = summarizeTimeline(timeline)

            set({
                timeline,
                summary,
                progress: { step: 'analyze', percent: 25, label: `Found ${timeline.scenes.length} scenes (~${Math.ceil(timeline.totalDuration / 60)} min)` },
            })

            // Brief pause so the UI can render
            await new Promise(r => setTimeout(r, 300))

            // ── Step 2: COMPOSE ──
            set({
                status: 'composing',
                progress: { step: 'compose', percent: 35, label: 'Composing 3D scenes...' },
            })

            const compositions: SceneComposition[] = []
            for (let i = 0; i < timeline.scenes.length; i++) {
                const scene = timeline.scenes[i]
                const comp = directScene(scene.text)
                compositions.push(comp)

                set({
                    progress: {
                        step: 'compose',
                        percent: 35 + ((i + 1) / timeline.scenes.length) * 20,
                        label: `Scene ${i + 1}/${timeline.scenes.length}: ${summarizeComposition(comp)}`,
                    },
                })
            }

            set({ compositions })
            await new Promise(r => setTimeout(r, 200))

            // ── Step 3: VOICE-OVER ──
            set({
                status: 'voiceover',
                progress: { step: 'voiceover', percent: 55, label: 'Generating voice-over narration...' },
            })

            // Attempt real voice generation; fall back to estimated durations
            const voiceOvers: VoiceOverResult[] = []
            for (let i = 0; i < timeline.scenes.length; i++) {
                const scene = timeline.scenes[i]
                try {
                    const result = await generateVoiceOver({
                        text: scene.text,
                        config: { ...DEFAULT_VOICE_CONFIG, voicePreset: narratorVoice as any },
                    })
                    voiceOvers.push(result)
                } catch {
                    // Voice-over API not available — use estimated duration
                    voiceOvers.push({
                        audioUrl: '',
                        duration: scene.duration,
                        provider: 'openai',
                        cached: false,
                    })
                }

                set({
                    progress: {
                        step: 'voiceover',
                        percent: 55 + ((i + 1) / timeline.scenes.length) * 20,
                        label: `Voice ${i + 1}/${timeline.scenes.length} — ${Math.ceil(scene.duration)}s`,
                    },
                })
            }

            set({ voiceOvers })
            await new Promise(r => setTimeout(r, 200))

            // ── Step 4: SEQUENCE ──
            set({
                status: 'sequencing',
                progress: { step: 'sequence', percent: 80, label: 'Building multi-shot timeline...' },
            })

            const shots: Shot[] = []

            // Title card
            if (config.showTitleCard) {
                shots.push(createShot({
                    name: '🎬 Title Card',
                    duration: 4,
                    cameraMove: 'orbit',
                    cameraKeyframes: generateCameraPreset('orbit', 4),
                    transitionIn: 'fade-black',
                    transitionDuration: 1,
                }))
            }

            // Scene shots — use selectCinematicMove for varied camera work
            for (let i = 0; i < compositions.length; i++) {
                const comp = compositions[i]
                const vo = voiceOvers[i]
                const sceneData = timeline.scenes[i]
                const duration = vo?.duration || sceneData.duration

                // Intelligent camera selection based on scene mood + index
                const movement = selectCinematicMove(i, comp.lighting.mood)

                // Varied look-at position based on character positions
                const hasChars = comp.characters.length > 0
                const lookAt = hasChars
                    ? { x: comp.characters[0].position.x || 0, y: 1.2, z: comp.characters[0].position.z || 0 }
                    : { x: 0, y: 0.8, z: 0 }

                // Varied transitions
                const transitions: TransitionType[] = ['cut', 'crossfade', 'fade-black', 'zoom-in', 'crossfade']
                const transitionIn = transitions[i % transitions.length]

                shots.push(createShot({
                    name: `Scene ${i + 1}${sceneData.overlay ? ` — ${sceneData.overlay}` : ''}`,
                    duration,
                    cameraMove: movement,
                    cameraKeyframes: generateCameraPreset(movement, duration, lookAt),
                    transitionIn,
                    transitionDuration: transitionIn === 'fade-black' ? 1.0 : 0.5,
                }))
            }

            // Credits — dramatic crane up
            if (config.showCredits) {
                shots.push(createShot({
                    name: '📜 Credits',
                    duration: 6,
                    cameraMove: 'crane',
                    cameraKeyframes: generateCameraPreset('crane', 6),
                    transitionIn: 'fade-black',
                    transitionDuration: 1.5,
                }))
            }

            const totalDuration = computeTotalDuration(shots)

            set({
                shots,
                status: 'ready',
                progress: {
                    step: 'done',
                    percent: 100,
                    label: `✅ Ready — ${shots.length} shots, ~${Math.ceil(totalDuration / 60)} min`,
                },
            })

        } catch (err: any) {
            set({
                status: 'error',
                error: err.message || 'Pipeline failed',
                progress: { step: 'error', percent: 0, label: `Error: ${err.message}` },
            })
        }
    },

    // ── TrustBook Integration ──
    checkTrustBookConnection: async () => {
        try {
            const conn = await checkConnection()
            set({ trustBookConnection: conn })
        } catch {
            set({ trustBookConnection: { connected: false, ebooks: [] } })
        }
    },

    importFromTrustBook: async (ebookId: string) => {
        try {
            set({
                status: 'analyzing',
                progress: { step: 'import', percent: 5, label: 'Importing from TrustBook...' },
            })

            const result = await quickImport(ebookId)
            const storyConfig = toStoryConfig(result)
            const estimate = estimateProduction(result)

            set({
                importResult: result,
                text: result.totalText,
                title: result.ebook.title,
                style: storyConfig.style,
                narratorVoice: storyConfig.narratorVoice,
                progress: {
                    step: 'import',
                    percent: 15,
                    label: `Imported "${result.ebook.title}" — ${estimate.scenes} scenes, ${estimate.duration}`,
                },
            })

            // Auto-trigger generation
            await get().generateDocumentary()

        } catch (err: any) {
            set({
                status: 'error',
                error: `TrustBook import failed: ${err.message}`,
            })
        }
    },

    // ── Playback Controls ──
    startPlayback: () => {
        const { shots } = get()
        if (!shots.length) return
        const totalDuration = computeTotalDuration(shots)
        set({ playback: { playing: true, currentTime: 0, activeShotIndex: 0, totalDuration } })
    },
    pausePlayback: () => set(s => ({ playback: { ...s.playback, playing: false } })),
    stopPlayback: () => set(s => ({ playback: { ...s.playback, playing: false, currentTime: 0, activeShotIndex: 0 } })),
    setPlaybackTime: (time: number) => {
        const { shots } = get()
        const { shotIndex } = getShotAtTime(shots, time)
        set(s => ({ playback: { ...s.playback, currentTime: time, activeShotIndex: shotIndex } }))
    },
    setActiveShotIndex: (idx: number) => set(s => ({ playback: { ...s.playback, activeShotIndex: idx } })),

    // ── Reset ──
    reset: () => set({
        text: '',
        style: 'documentary',
        narratorVoice: 'narrator',
        title: 'Untitled Documentary',
        status: 'idle',
        progress: { step: '', percent: 0, label: '' },
        error: null,
        timeline: null,
        compositions: [],
        voiceOvers: [],
        shots: [],
        summary: null,
        playback: { playing: false, currentTime: 0, activeShotIndex: 0, totalDuration: 0 },
        importResult: null,
    }),
}))
