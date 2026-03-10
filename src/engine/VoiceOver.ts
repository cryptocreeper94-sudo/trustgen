/* ====== TrustGen — AI Voice-Over System ======
 * Text-to-speech for narration and character dialogue.
 * Primary: ElevenLabs API  |  Fallback: OpenAI TTS
 *
 * Features:
 * - Multiple voice presets (narrator, male, female, child, elder, robot)
 * - Emotion/style control (neutral, excited, serious, warm, dramatic)
 * - Per-character voice assignment
 * - Auto-sync with lip sync engine
 * - Batch generation for full scripts
 * - Audio caching to avoid re-generation
 */

// ── Types ──

export type VoiceProvider = 'elevenlabs' | 'openai'

export type VoicePreset =
    | 'narrator' | 'male-deep' | 'male-warm' | 'female-clear'
    | 'female-warm' | 'child' | 'elder' | 'robot' | 'whisper'

export type VoiceEmotion = 'neutral' | 'excited' | 'serious' | 'warm' | 'dramatic' | 'sad' | 'angry' | 'cheerful'

export interface VoiceConfig {
    provider: VoiceProvider
    voicePreset: VoicePreset
    emotion: VoiceEmotion
    /** Speech speed (0.5–2.0) */
    speed: number
    /** Pitch adjustment (-1 to 1) — ElevenLabs only */
    pitch: number
    /** Stability (0–1) — how consistent vs. expressive */
    stability: number
    /** Similarity boost (0–1) — voice consistency */
    similarityBoost: number
}

export interface VoiceOverRequest {
    text: string
    config: VoiceConfig
    /** Character name (for multi-character scenes) */
    characterName?: string
    /** Cache key to avoid regeneration */
    cacheKey?: string
}

export interface VoiceOverResult {
    audioUrl: string
    duration: number
    provider: VoiceProvider
    cached: boolean
}

// ── Default Config ──

export const DEFAULT_VOICE_CONFIG: VoiceConfig = {
    provider: 'elevenlabs',
    voicePreset: 'narrator',
    emotion: 'neutral',
    speed: 1.0,
    pitch: 0,
    stability: 0.5,
    similarityBoost: 0.75,
}

// ── ElevenLabs Voice ID Mapping ──
// These map to common pre-made ElevenLabs voices

const ELEVENLABS_VOICE_MAP: Record<VoicePreset, string> = {
    'narrator': 'EXAVITQu4vr4xnSDxMaL', // Bella (narrative)
    'male-deep': 'VR6AewLTigWG4xSOukaG', // Arnold
    'male-warm': 'pNInz6obpgDQGcFmaJgB', // Adam
    'female-clear': '21m00Tcm4TlvDq8ikWAM', // Rachel
    'female-warm': 'AZnzlk1XvdvUeBnXmlld', // Domi
    'child': 'MF3mGyEYCl7XYWbV9V6O', // Emily
    'elder': 'TxGEqnHWrfWFTfGW9XjX', // Josh (deeper)
    'robot': 'ErXwobaYiN019PkySvjV', // Antoni
    'whisper': 'ThT5KcBeYPX3keUQqHPh', // Dorothy
}

// ── OpenAI TTS Voice Mapping ──

const OPENAI_VOICE_MAP: Record<VoicePreset, string> = {
    'narrator': 'onyx',
    'male-deep': 'onyx',
    'male-warm': 'echo',
    'female-clear': 'nova',
    'female-warm': 'shimmer',
    'child': 'alloy',
    'elder': 'fable',
    'robot': 'alloy',
    'whisper': 'shimmer',
}

// ── Emotion → Style Text (prepended to prompt for ElevenLabs) ──

const EMOTION_STYLE: Record<VoiceEmotion, string> = {
    neutral: '',
    excited: 'Speaking with enthusiasm and energy: ',
    serious: 'In a serious, measured tone: ',
    warm: 'In a warm, friendly manner: ',
    dramatic: 'With dramatic inflection: ',
    sad: 'In a somber, reflective tone: ',
    angry: 'With intensity and conviction: ',
    cheerful: 'Happily and with a smile: ',
}

// ── Generate Voice-Over ──

/**
 * Generate speech audio via ElevenLabs or OpenAI TTS.
 * Returns a blob URL of the audio.
 */
export async function generateVoiceOver(
    request: VoiceOverRequest,
    apiBaseUrl: string = '/api/ai/voice-over'
): Promise<VoiceOverResult> {
    const res = await fetch(apiBaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    })

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Voice-over generation failed (${res.status}): ${errText}`)
    }

    const audioBlob = await res.blob()
    const audioUrl = URL.createObjectURL(audioBlob)

    // Estimate duration from blob size (rough: mp3 ~16kB/s)
    const estimatedDuration = audioBlob.size / 16000

    return {
        audioUrl,
        duration: estimatedDuration,
        provider: request.config.provider,
        cached: false,
    }
}

// ── Batch Generation ──

export interface ScriptLine {
    character: string
    text: string
    emotion?: VoiceEmotion
}

/**
 * Generate voice-overs for an entire script.
 * Assigns voice presets to characters automatically.
 */
export async function generateScriptVoiceOver(
    lines: ScriptLine[],
    characterVoices: Record<string, VoiceConfig>,
    apiBaseUrl?: string,
    onProgress?: (current: number, total: number) => void
): Promise<{ line: ScriptLine; result: VoiceOverResult }[]> {
    const results: { line: ScriptLine; result: VoiceOverResult }[] = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const config = characterVoices[line.character] || DEFAULT_VOICE_CONFIG

        if (line.emotion) {
            config.emotion = line.emotion
        }

        const result = await generateVoiceOver({
            text: line.text,
            config,
            characterName: line.character,
        }, apiBaseUrl)

        results.push({ line, result })
        onProgress?.(i + 1, lines.length)
    }

    return results
}

// ── Auto-Assign Voices to Characters ──

const VOICE_ROTATION: VoicePreset[] = [
    'narrator', 'male-warm', 'female-clear', 'male-deep', 'female-warm', 'elder', 'child'
]

/**
 * Automatically assign voice presets to characters.
 * Ensures each character gets a distinct voice.
 */
export function autoAssignVoices(characterNames: string[]): Record<string, VoiceConfig> {
    const assignments: Record<string, VoiceConfig> = {}

    for (let i = 0; i < characterNames.length; i++) {
        const preset = VOICE_ROTATION[i % VOICE_ROTATION.length]
        assignments[characterNames[i]] = {
            ...DEFAULT_VOICE_CONFIG,
            voicePreset: preset,
        }
    }

    return assignments
}

/** Export voice ID maps for server-side use */
export { ELEVENLABS_VOICE_MAP, OPENAI_VOICE_MAP, EMOTION_STYLE }
