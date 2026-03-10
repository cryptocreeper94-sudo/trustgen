/* ====== TrustGen — Lip Sync Engine ======
 * Maps audio phonemes to mouth blend shapes for character animation.
 * No external service needed — uses Web Audio API for amplitude analysis
 * and rule-based phoneme-to-viseme mapping.
 *
 * Pipeline:
 *   1. Analyze audio waveform (amplitude envelope)
 *   2. Map amplitude to mouth openness
 *   3. Optional: map transcript text to phoneme sequence
 *   4. Map phonemes to visemes (mouth shapes)
 *   5. Drive blend shape weights on the character mesh
 */

// ── Visemes (mouth shapes) ──

export type Viseme =
    | 'rest'       // mouth closed
    | 'aa'         // open (ah, father)
    | 'ee'         // wide smile (ee, see)
    | 'ih'         // small open (it, bit)
    | 'oh'         // rounded (oh, go)
    | 'oo'         // tight round (oo, boot)
    | 'ff'         // lower lip to teeth (f, v)
    | 'th'         // tongue between teeth (th)
    | 'ss'         // teeth close, lips parted (s, z)
    | 'sh'         // lips pushed forward (sh, ch)
    | 'mm'         // lips together (m, b, p)
    | 'nn'         // lips slightly open (n, d, t)
    | 'rr'         // lips slightly rounded (r)
    | 'll'         // tongue up (l)

/**
 * Blend shape weights for each viseme.
 * Maps to common Morph Target names found in character models.
 *
 * Keys: jawOpen, mouthSmile, mouthPucker, mouthFunnel, mouthPress, tongueOut
 */
export const VISEME_WEIGHTS: Record<Viseme, Record<string, number>> = {
    rest: { jawOpen: 0, mouthSmile: 0, mouthPucker: 0, mouthFunnel: 0, mouthPress: 0.3 },
    aa: { jawOpen: 0.8, mouthSmile: 0.1, mouthPucker: 0, mouthFunnel: 0.1, mouthPress: 0 },
    ee: { jawOpen: 0.3, mouthSmile: 0.7, mouthPucker: 0, mouthFunnel: 0, mouthPress: 0 },
    ih: { jawOpen: 0.35, mouthSmile: 0.3, mouthPucker: 0, mouthFunnel: 0, mouthPress: 0 },
    oh: { jawOpen: 0.5, mouthSmile: 0, mouthPucker: 0.4, mouthFunnel: 0.3, mouthPress: 0 },
    oo: { jawOpen: 0.2, mouthSmile: 0, mouthPucker: 0.8, mouthFunnel: 0.5, mouthPress: 0 },
    ff: { jawOpen: 0.1, mouthSmile: 0, mouthPucker: 0, mouthFunnel: 0.2, mouthPress: 0.4 },
    th: { jawOpen: 0.15, mouthSmile: 0, mouthPucker: 0, mouthFunnel: 0, mouthPress: 0, tongueOut: 0.5 },
    ss: { jawOpen: 0.1, mouthSmile: 0.2, mouthPucker: 0, mouthFunnel: 0, mouthPress: 0.2 },
    sh: { jawOpen: 0.15, mouthSmile: 0, mouthPucker: 0.5, mouthFunnel: 0.4, mouthPress: 0 },
    mm: { jawOpen: 0, mouthSmile: 0, mouthPucker: 0, mouthFunnel: 0, mouthPress: 0.8 },
    nn: { jawOpen: 0.1, mouthSmile: 0, mouthPucker: 0, mouthFunnel: 0, mouthPress: 0.3 },
    rr: { jawOpen: 0.15, mouthSmile: 0, mouthPucker: 0.3, mouthFunnel: 0.2, mouthPress: 0 },
    ll: { jawOpen: 0.2, mouthSmile: 0, mouthPucker: 0, mouthFunnel: 0, mouthPress: 0 },
}

// ── Phoneme to Viseme Mapping ──

const PHONEME_TO_VISEME: Record<string, Viseme> = {
    // Vowels
    'a': 'aa', 'ah': 'aa', 'ae': 'aa', 'aw': 'aa',
    'e': 'ee', 'eh': 'ih', 'er': 'rr', 'ey': 'ee',
    'i': 'ih', 'ih': 'ih', 'iy': 'ee',
    'o': 'oh', 'ow': 'oh', 'oy': 'oh',
    'u': 'oo', 'uh': 'ih', 'uw': 'oo',
    // Consonants
    'b': 'mm', 'p': 'mm', 'm': 'mm',
    'f': 'ff', 'v': 'ff',
    'th': 'th', 'dh': 'th',
    's': 'ss', 'z': 'ss',
    'sh': 'sh', 'zh': 'sh', 'ch': 'sh', 'jh': 'sh',
    't': 'nn', 'd': 'nn', 'n': 'nn',
    'k': 'nn', 'g': 'nn', 'ng': 'nn',
    'l': 'll',
    'r': 'rr',
    'w': 'oo',
    'y': 'ee',
    'h': 'aa',
}

// ── Text to Phoneme (simplified rule-based) ──

/**
 * Very simplified English text → phoneme sequence.
 * Not linguistically perfect, but good enough for lip sync animation.
 */
export function textToPhonemes(text: string): { phoneme: string; duration: number }[] {
    const phonemes: { phoneme: string; duration: number }[] = []
    const words = text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/)

    for (const word of words) {
        const chars = word.split('')
        let i = 0
        while (i < chars.length) {
            const c = chars[i]
            const next = chars[i + 1] || ''
            const digraph = c + next

            // Check digraphs first
            if (['th', 'sh', 'ch', 'ng', 'ow', 'oo', 'ee', 'ey', 'aw', 'oy'].includes(digraph)) {
                phonemes.push({ phoneme: digraph, duration: 0.08 })
                i += 2
            } else if ('aeiou'.includes(c)) {
                phonemes.push({ phoneme: c, duration: 0.1 })
                i++
            } else {
                phonemes.push({ phoneme: c, duration: 0.06 })
                i++
            }
        }
        // Brief pause between words
        phonemes.push({ phoneme: 'rest', duration: 0.05 })
    }

    return phonemes
}

/**
 * Convert phoneme sequence to viseme timeline.
 */
export function phonemesToVisemes(
    phonemes: { phoneme: string; duration: number }[],
    startTime: number = 0
): { viseme: Viseme; time: number; duration: number }[] {
    const timeline: { viseme: Viseme; time: number; duration: number }[] = []
    let currentTime = startTime

    for (const p of phonemes) {
        const viseme = PHONEME_TO_VISEME[p.phoneme] || 'rest'
        timeline.push({ viseme, time: currentTime, duration: p.duration })
        currentTime += p.duration
    }

    return timeline
}

// ── Amplitude-Based Lip Sync (from audio analysis) ──

export interface LipSyncState {
    /** Current mouth openness (0–1) */
    mouthOpen: number
    /** Current viseme */
    currentViseme: Viseme
    /** Blend shape weights to apply */
    weights: Record<string, number>
    /** Smoothed amplitude */
    amplitude: number
}

/**
 * Create a lip sync analyzer from a Web Audio context.
 */
export function createLipSyncAnalyzer(audioContext: AudioContext, source: AudioNode): {
    getState: () => LipSyncState
    cleanup: () => void
} {
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 512
    analyser.smoothingTimeConstant = 0.6
    source.connect(analyser)

    const dataArray = new Float32Array(analyser.frequencyBinCount)
    let smoothAmplitude = 0

    const getState = (): LipSyncState => {
        analyser.getFloatTimeDomainData(dataArray)

        // RMS amplitude
        let sum = 0
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i] * dataArray[i]
        }
        const rms = Math.sqrt(sum / dataArray.length)
        const amplitude = Math.min(1, rms * 5) // normalize

        // Smooth
        smoothAmplitude += (amplitude - smoothAmplitude) * 0.3

        // Map amplitude to viseme
        let viseme: Viseme = 'rest'
        if (smoothAmplitude > 0.6) viseme = 'aa'      // loud = wide open
        else if (smoothAmplitude > 0.4) viseme = 'oh'  // medium = rounded
        else if (smoothAmplitude > 0.2) viseme = 'ih'  // soft = small open
        else if (smoothAmplitude > 0.05) viseme = 'mm'  // quiet = lips pressed

        const weights = { ...VISEME_WEIGHTS[viseme] }

        // Scale by amplitude for smoother results
        for (const key of Object.keys(weights)) {
            weights[key] *= Math.max(0.1, smoothAmplitude)
        }

        return {
            mouthOpen: smoothAmplitude,
            currentViseme: viseme,
            weights,
            amplitude: smoothAmplitude,
        }
    }

    const cleanup = () => {
        source.disconnect(analyser)
    }

    return { getState, cleanup }
}

/**
 * Evaluate a viseme timeline at a given time.
 * Returns interpolated blend shape weights.
 */
export function evaluateVisemeTimeline(
    timeline: { viseme: Viseme; time: number; duration: number }[],
    currentTime: number
): Record<string, number> {
    if (timeline.length === 0) return { ...VISEME_WEIGHTS.rest }

    // Find current viseme
    let current = timeline[0]
    let next = timeline[1] || timeline[0]

    for (let i = 0; i < timeline.length - 1; i++) {
        if (currentTime >= timeline[i].time && currentTime < timeline[i].time + timeline[i].duration) {
            current = timeline[i]
            next = timeline[i + 1] || timeline[i]
            break
        }
    }

    const localTime = currentTime - current.time
    const t = Math.min(1, localTime / Math.max(0.01, current.duration))
    const ease = t * t * (3 - 2 * t) // smoothstep

    // Interpolate between current and next viseme
    const currentWeights = VISEME_WEIGHTS[current.viseme]
    const nextWeights = VISEME_WEIGHTS[next.viseme]
    const result: Record<string, number> = {}

    const allKeys = new Set([...Object.keys(currentWeights), ...Object.keys(nextWeights)])
    for (const key of allKeys) {
        const a = currentWeights[key] || 0
        const b = nextWeights[key] || 0
        result[key] = a + (b - a) * ease
    }

    return result
}
