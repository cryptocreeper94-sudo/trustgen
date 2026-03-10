/* ====== TrustGen — Story Mode ======
 * One-click ebook-to-documentary pipeline.
 * Paste text → auto-generates the entire animated documentary:
 *   1. Splits text into scenes (by paragraphs/chapters)
 *   2. Scene Director picks environments, camera, characters
 *   3. Voice-Over generates narration for each scene
 *   4. Lip sync maps audio to character mouth animation
 *   5. Sequencer assembles the multi-shot timeline
 *   6. Render exports the final video
 *
 * The user's job: paste text, pick a style, hit "Generate".
 */

// ── Types ──

export type StoryStyle = 'documentary' | 'explainer' | 'dramatic' | 'educational' | 'cinematic'

export interface StoryConfig {
    /** Title of the production */
    title: string
    /** Full text (ebook chapter, article, script) */
    text: string
    /** Visual style preset */
    style: StoryStyle
    /** Narrator voice preset */
    narratorVoice: string
    /** Target duration in minutes (auto-pacing) */
    targetDuration: number
    /** Include title card */
    showTitleCard: boolean
    /** Include credits */
    showCredits: boolean
    /** Background music mood */
    musicMood: 'ambient' | 'cinematic' | 'upbeat' | 'dramatic' | 'none'
}

export interface StoryScene {
    /** Scene index */
    index: number
    /** Scene text (narration) */
    text: string
    /** Estimated narration duration */
    duration: number
    /** Environment suggestion */
    environment: string
    /** Shot type */
    shotType: string
    /** Camera movement */
    cameraMovement: string
    /** Text overlay (lower-third or chapter title) */
    overlay?: string
    /** Suggested characters */
    characters: string[]
    /** Suggested props */
    props: string[]
}

export interface StoryTimeline {
    title: string
    scenes: StoryScene[]
    totalDuration: number
    style: StoryStyle
    config: StoryConfig
}

// ── Text Processing ──

/**
 * Split raw text into logical scenes.
 * Splits on: paragraph breaks, chapter markers, section headers.
 */
export function splitTextIntoScenes(text: string): string[] {
    // Normalize line breaks
    const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

    // Try chapter splits first
    const chapterSplit = normalized.split(/\n\s*(Chapter\s+\d+[:\.\s]|CHAPTER\s+\d+|Part\s+\d+[:\.\s]|Section\s+\d+)/i)
    if (chapterSplit.length > 2) {
        return chapterSplit
            .map(s => s.trim())
            .filter(s => s.length > 50) // skip tiny fragments
    }

    // Fall back to paragraph grouping
    const paragraphs = normalized
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p.length > 20)

    // Group paragraphs into scenes (2-3 paragraphs per scene)
    const scenes: string[] = []
    let current = ''
    const targetLen = 300 // ~20 seconds of narration per scene

    for (const para of paragraphs) {
        if (current.length + para.length > targetLen && current.length > 0) {
            scenes.push(current.trim())
            current = para
        } else {
            current += (current ? '\n\n' : '') + para
        }
    }
    if (current.trim()) scenes.push(current.trim())

    return scenes
}

/**
 * Estimate narration duration from text length.
 * Average speaking rate: ~150 words per minute.
 */
export function estimateDuration(text: string): number {
    const words = text.split(/\s+/).length
    return (words / 150) * 60 // seconds
}

// ── Scene Analysis ──

const ENVIRONMENT_MOOD_MAP: Record<StoryStyle, string[]> = {
    documentary: ['studio', 'interview', 'void', 'office'],
    explainer: ['gradient', 'void', 'studio'],
    dramatic: ['void', 'living-room', 'park'],
    educational: ['office', 'podium', 'studio'],
    cinematic: ['void', 'beach', 'park', 'living-room'],
}

const STYLE_LIGHTING: Record<StoryStyle, string> = {
    documentary: 'natural',
    explainer: 'bright',
    dramatic: 'dramatic',
    educational: 'warm',
    cinematic: 'ethereal',
}

/**
 * Analyze text and suggest scene properties.
 */
function analyzeScene(text: string, index: number, style: StoryStyle): StoryScene {
    const lower = text.toLowerCase()
    const duration = estimateDuration(text)

    // Pick environment based on style + scene content
    const envPool = ENVIRONMENT_MOOD_MAP[style]
    const environment = envPool[index % envPool.length]

    // Detect shot type from content
    let shotType = 'medium'
    if (index === 0) shotType = 'establishing'
    else if (lower.includes('important') || lower.includes('key') || lower.includes('critical')) shotType = 'close-up'
    else if (lower.includes('together') || lower.includes('group') || lower.includes('they')) shotType = 'wide'
    else if (lower.includes('explain') || lower.includes('show') || lower.includes('demonstrate')) shotType = 'medium'

    // Camera movement
    let cameraMovement = 'static'
    if (shotType === 'establishing') cameraMovement = 'orbit'
    else if (index % 3 === 0) cameraMovement = 'dolly'
    else if (index % 3 === 1) cameraMovement = 'pan'

    // Overlay text
    let overlay: string | undefined
    if (index === 0) overlay = undefined // title card handled separately
    else if (lower.includes('first') || lower.includes('step 1') || lower.includes('chapter')) {
        overlay = text.split(/[.!?]/)[0].substring(0, 60) // first sentence as chapter title
    }

    // Detect character mentions
    const characters: string[] = []
    const charPatterns = /(?:the\s+)?(narrator|speaker|presenter|host|author|expert|scientist|teacher|doctor)/gi
    let match
    while ((match = charPatterns.exec(text)) !== null) {
        if (!characters.includes(match[1].toLowerCase())) {
            characters.push(match[1].toLowerCase())
        }
    }

    // Props
    const props: string[] = []
    const propPatterns = /(?:a |the |an )?(computer|book|desk|screen|whiteboard|chart|graph|globe|map|phone|tablet|camera)/gi
    while ((match = propPatterns.exec(text)) !== null) {
        if (!props.includes(match[1].toLowerCase())) {
            props.push(match[1].toLowerCase())
        }
    }

    return {
        index,
        text,
        duration,
        environment,
        shotType,
        cameraMovement,
        overlay,
        characters,
        props,
    }
}

// ── Main Pipeline ──

/**
 * Generate a complete story timeline from raw text.
 * This is the core "Story Mode" function.
 */
export function generateStoryTimeline(config: StoryConfig): StoryTimeline {
    const rawScenes = splitTextIntoScenes(config.text)

    // Analyze each scene
    const scenes = rawScenes.map((text, i) => analyzeScene(text, i, config.style))

    // Calculate total duration
    let totalDuration = scenes.reduce((sum, s) => sum + s.duration, 0)

    // Add title card duration
    if (config.showTitleCard) totalDuration += 4

    // Add credits duration
    if (config.showCredits) totalDuration += 6

    // Adjust pacing to match target duration if specified
    if (config.targetDuration > 0) {
        const targetSeconds = config.targetDuration * 60
        const ratio = targetSeconds / totalDuration
        for (const scene of scenes) {
            scene.duration *= ratio
        }
        totalDuration = targetSeconds
    }

    return {
        title: config.title,
        scenes,
        totalDuration,
        style: config.style,
        config,
    }
}

/**
 * Generate a summary of the story timeline for UI preview.
 */
export function summarizeTimeline(timeline: StoryTimeline): string {
    const parts = [
        `🎬 "${timeline.title}"`,
        `📽️ ${timeline.scenes.length} scenes`,
        `⏱️ ~${Math.ceil(timeline.totalDuration / 60)} min`,
        `🎨 ${timeline.style} style`,
    ]

    const allChars = [...new Set(timeline.scenes.flatMap(s => s.characters))]
    if (allChars.length > 0) parts.push(`👤 ${allChars.join(', ')}`)

    const allEnvs = [...new Set(timeline.scenes.map(s => s.environment))]
    parts.push(`📍 ${allEnvs.join(', ')}`)

    return parts.join(' • ')
}

// ── Preset Styles ──

export const STORY_STYLE_PRESETS: Record<StoryStyle, { label: string; icon: string; description: string }> = {
    documentary: { label: 'Documentary', icon: '🎥', description: 'Narrated with studio/interview environments, natural lighting' },
    explainer: { label: 'Explainer', icon: '📊', description: 'Clean abstract backgrounds, bright lighting, clear typography' },
    dramatic: { label: 'Dramatic', icon: '🎭', description: 'Cinematic lighting, emotional pacing, varied environments' },
    educational: { label: 'Educational', icon: '📚', description: 'Warm, inviting environments with clear visual aids' },
    cinematic: { label: 'Cinematic', icon: '🎬', description: 'Ethereal lighting, sweeping camera moves, atmospheric' },
}
