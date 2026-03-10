/* ====== TrustGen — Auto-Cut / Smart Edit Engine ======
 * AI-powered edit assistant that analyzes script/audio pacing
 * and automatically suggests cuts, transitions, and shot changes.
 *
 * Features:
 * - Script-based beat detection (sentence endings, paragraph breaks)
 * - Pacing analysis (fast/medium/slow)
 * - Auto transition selection
 * - Shot variety enforcement (no two identical shots in a row)
 * - B-roll insertion points
 * - Music sync points
 */

// ── Types ──

export type PacingStyle = 'fast' | 'medium' | 'slow' | 'dynamic'
export type TransitionType = 'cut' | 'crossfade' | 'wipe' | 'zoom' | 'fade-black' | 'fade-white'

export interface EditPoint {
    /** Time position in seconds */
    time: number
    /** Type of edit action */
    type: 'cut' | 'transition' | 'b-roll-start' | 'b-roll-end' | 'music-hit' | 'title'
    /** Transition to use (for 'transition' type) */
    transition?: TransitionType
    /** Duration of transition in seconds */
    transitionDuration?: number
    /** Suggested shot change */
    suggestedShot?: string
    /** Suggested camera movement */
    suggestedCamera?: string
    /** Confidence score (0–1) */
    confidence: number
    /** Reason for this edit point */
    reason: string
}

export interface EditPlan {
    /** All edit points in order */
    editPoints: EditPoint[]
    /** Overall pacing assessment */
    pacing: PacingStyle
    /** Total duration */
    totalDuration: number
    /** Summary statistics */
    stats: {
        totalCuts: number
        avgShotDuration: number
        transitionCount: number
        bRollInsertions: number
    }
}

export interface AutoCutConfig {
    /** Target pacing */
    pacing: PacingStyle
    /** Minimum shot duration (seconds) */
    minShotDuration: number
    /** Maximum shot duration (seconds) */
    maxShotDuration: number
    /** Allow b-roll insertions */
    enableBRoll: boolean
    /** Vary camera angles */
    varyCameraAngles: boolean
    /** Use transition effects vs. hard cuts */
    transitionFrequency: number // 0 = all cuts, 1 = all transitions
}

// ── Defaults ──

const PACING_DEFAULTS: Record<PacingStyle, { minShot: number; maxShot: number; transFreq: number }> = {
    fast: { minShot: 1.5, maxShot: 4, transFreq: 0.1 },
    medium: { minShot: 3, maxShot: 8, transFreq: 0.3 },
    slow: { minShot: 5, maxShot: 15, transFreq: 0.5 },
    dynamic: { minShot: 2, maxShot: 10, transFreq: 0.25 },
}

export const DEFAULT_AUTOCUT_CONFIG: AutoCutConfig = {
    pacing: 'medium',
    minShotDuration: 3,
    maxShotDuration: 8,
    enableBRoll: true,
    varyCameraAngles: true,
    transitionFrequency: 0.3,
}

// ── Shot Variety Pool ──

const SHOT_TYPES = ['close-up', 'medium', 'wide', 'over-shoulder', 'establishing', 'two-shot']
const CAMERA_MOVES = ['static', 'pan', 'dolly', 'orbit', 'crane']
const TRANSITIONS: TransitionType[] = ['cut', 'crossfade', 'wipe', 'zoom', 'fade-black']

// ── Main Auto-Cut Function ──

/**
 * Analyze text and generate an auto-cut edit plan.
 */
export function generateEditPlan(
    text: string,
    totalDuration: number,
    config: Partial<AutoCutConfig> = {}
): EditPlan {
    const cfg: AutoCutConfig = { ...DEFAULT_AUTOCUT_CONFIG, ...config }
    const pacingCfg = PACING_DEFAULTS[cfg.pacing]
    cfg.minShotDuration = cfg.minShotDuration || pacingCfg.minShot
    cfg.maxShotDuration = cfg.maxShotDuration || pacingCfg.maxShot
    cfg.transitionFrequency = cfg.transitionFrequency || pacingCfg.transFreq

    const editPoints: EditPoint[] = []
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5)
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 10)

    // Calculate time per sentence
    const totalWords = text.split(/\s+/).length
    const wordsPerSecond = totalWords / totalDuration

    let currentTime = 0
    let lastShotIdx = -1
    let lastCameraIdx = -1
    let shotCount = 0

    // Walk through sentences and place edit points
    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i].trim()
        if (!sentence) continue

        const sentenceWords = sentence.split(/\s+/).length
        const sentenceDuration = sentenceWords / wordsPerSecond

        currentTime += sentenceDuration

        // Check if we need a cut
        const timeSinceLastCut = editPoints.length === 0
            ? currentTime
            : currentTime - editPoints[editPoints.length - 1].time

        const needsCut = timeSinceLastCut >= cfg.minShotDuration
        const forceCut = timeSinceLastCut >= cfg.maxShotDuration

        // Detect natural break points
        const isEndOfParagraph = paragraphs.some(p => {
            const lastSentence = p.split(/[.!?]+/).filter(s => s.trim()).pop()?.trim()
            return lastSentence && sentence.includes(lastSentence)
        })
        const hasEmphasis = /\b(important|key|critical|however|but|therefore|finally|first|then|next)\b/i.test(sentence)

        if (forceCut || (needsCut && (isEndOfParagraph || hasEmphasis || Math.random() < 0.4))) {
            // Determine transition type
            const useTransition = Math.random() < cfg.transitionFrequency
            const transition: TransitionType = useTransition
                ? (isEndOfParagraph ? 'crossfade' : TRANSITIONS[Math.floor(Math.random() * TRANSITIONS.length)])
                : 'cut'

            // Pick shot type (ensure variety)
            let shotIdx = Math.floor(Math.random() * SHOT_TYPES.length)
            if (cfg.varyCameraAngles && shotIdx === lastShotIdx) {
                shotIdx = (shotIdx + 1) % SHOT_TYPES.length
            }
            lastShotIdx = shotIdx

            // Pick camera movement
            let cameraIdx = Math.floor(Math.random() * CAMERA_MOVES.length)
            if (cameraIdx === lastCameraIdx) cameraIdx = (cameraIdx + 1) % CAMERA_MOVES.length
            lastCameraIdx = cameraIdx

            // Determine reason
            let reason = 'Pacing cut'
            if (isEndOfParagraph) reason = 'Paragraph break — natural scene transition'
            else if (hasEmphasis) reason = 'Emphasis keyword — visual reinforcement'
            else if (forceCut) reason = 'Max shot duration reached'

            editPoints.push({
                time: currentTime,
                type: useTransition ? 'transition' : 'cut',
                transition,
                transitionDuration: useTransition ? (transition === 'crossfade' ? 0.8 : 0.5) : 0,
                suggestedShot: SHOT_TYPES[shotIdx],
                suggestedCamera: CAMERA_MOVES[cameraIdx],
                confidence: isEndOfParagraph ? 0.95 : hasEmphasis ? 0.85 : 0.7,
                reason,
            })

            shotCount++

            // B-roll insertion at paragraph breaks
            if (cfg.enableBRoll && isEndOfParagraph && Math.random() < 0.4) {
                editPoints.push({
                    time: currentTime + 0.5,
                    type: 'b-roll-start',
                    confidence: 0.6,
                    reason: 'B-roll opportunity — visual break from speaker',
                })
                editPoints.push({
                    time: currentTime + 3,
                    type: 'b-roll-end',
                    confidence: 0.6,
                    reason: 'Return from b-roll',
                })
            }
        }
    }

    // Sort edit points by time
    editPoints.sort((a, b) => a.time - b.time)

    // Stats
    const cuts = editPoints.filter(e => e.type === 'cut' || e.type === 'transition')
    const avgShot = cuts.length > 0 ? totalDuration / cuts.length : totalDuration

    return {
        editPoints,
        pacing: cfg.pacing,
        totalDuration,
        stats: {
            totalCuts: cuts.length,
            avgShotDuration: Math.round(avgShot * 10) / 10,
            transitionCount: editPoints.filter(e => e.type === 'transition').length,
            bRollInsertions: editPoints.filter(e => e.type === 'b-roll-start').length,
        },
    }
}

/**
 * Generate a human-readable edit summary.
 */
export function summarizeEditPlan(plan: EditPlan): string {
    return [
        `✂️ ${plan.stats.totalCuts} cuts`,
        `📊 ${plan.stats.avgShotDuration}s avg shot`,
        `🔀 ${plan.stats.transitionCount} transitions`,
        `🎬 ${plan.stats.bRollInsertions} b-roll insertions`,
        `⚡ ${plan.pacing} pacing`,
    ].join(' • ')
}
