/* ====== TrustGen — Project Templates ======
 * Pre-configured starting points for different production types.
 * Each template sets up: environment, camera, characters, audio, and timeline.
 */

// ── Types ──

export type TemplateId =
    | 'documentary' | 'explainer' | 'product-demo' | 'music-video'
    | 'interview' | 'tutorial' | 'short-film' | 'commercial'
    | 'podcast-visual' | 'social-clip'

export interface ProjectTemplate {
    id: TemplateId
    name: string
    icon: string
    description: string
    category: string
    /** Target aspect ratio */
    aspectRatio: '16:9' | '9:16' | '1:1' | '4:5'
    /** Default resolution */
    resolution: { width: number; height: number }
    /** Suggested duration in seconds */
    duration: number
    /** Pre-configured environment preset */
    environment: string
    /** Pre-configured camera setup */
    camera: { type: string; fov: number }
    /** Number of pre-built scenes */
    sceneCount: number
    /** Default audio config */
    audio: { musicMood: string; hasNarration: boolean; hasSFX: boolean }
    /** Default text overlay config */
    textPresets: string[]
    /** Quick-start workflow steps */
    workflow: string[]
}

// ── Templates ──

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
    {
        id: 'documentary',
        name: 'Documentary',
        icon: '🎥',
        description: 'Narrated documentary with interview segments, b-roll, and chapter titles',
        category: 'Professional',
        aspectRatio: '16:9',
        resolution: { width: 1920, height: 1080 },
        duration: 300, // 5 min
        environment: 'studio',
        camera: { type: 'dolly', fov: 45 },
        sceneCount: 8,
        audio: { musicMood: 'ambient', hasNarration: true, hasSFX: false },
        textPresets: ['cinematic-title', 'lower-third', 'chapter-card', 'credits-roll'],
        workflow: [
            '1. Paste your script or ebook text',
            '2. Story Mode auto-generates scenes',
            '3. AI assigns voices and environments',
            '4. Review and tweak camera angles',
            '5. Generate voice-over narration',
            '6. Add chapter titles and lower thirds',
            '7. Preview and render',
        ],
    },
    {
        id: 'explainer',
        name: 'Explainer Video',
        icon: '📊',
        description: 'Clean, modern explainer with animated text and diagram-style visuals',
        category: 'Marketing',
        aspectRatio: '16:9',
        resolution: { width: 1920, height: 1080 },
        duration: 90,
        environment: 'gradient',
        camera: { type: 'static', fov: 50 },
        sceneCount: 5,
        audio: { musicMood: 'upbeat', hasNarration: true, hasSFX: true },
        textPresets: ['cinematic-title', 'subtitle', 'lower-third'],
        workflow: [
            '1. Write your key points (3-5 sections)',
            '2. Each section becomes a scene',
            '3. AI generates text animations',
            '4. Add voice-over for each section',
            '5. Review transitions and render',
        ],
    },
    {
        id: 'product-demo',
        name: 'Product Demo',
        icon: '📦',
        description: 'Showcase a product with rotating camera and feature callouts',
        category: 'Marketing',
        aspectRatio: '16:9',
        resolution: { width: 1920, height: 1080 },
        duration: 60,
        environment: 'studio',
        camera: { type: 'orbit', fov: 40 },
        sceneCount: 4,
        audio: { musicMood: 'cinematic', hasNarration: true, hasSFX: true },
        textPresets: ['cinematic-title', 'lower-third', 'subtitle'],
        workflow: [
            '1. Generate or import your product model',
            '2. Auto-orbit camera showcases the product',
            '3. Add feature callouts as text overlays',
            '4. Record voice-over explaining features',
            '5. Render with cinematic lighting',
        ],
    },
    {
        id: 'music-video',
        name: 'Music Video',
        icon: '🎵',
        description: 'Visually dynamic with beat-synced cameras and neon environments',
        category: 'Creative',
        aspectRatio: '16:9',
        resolution: { width: 1920, height: 1080 },
        duration: 210,
        environment: 'gradient',
        camera: { type: 'crane', fov: 55 },
        sceneCount: 12,
        audio: { musicMood: 'cinematic', hasNarration: false, hasSFX: true },
        textPresets: ['cinematic-title', 'lyrics'],
        workflow: [
            '1. Drop in your music track',
            '2. AI analyzes beats for scene cuts',
            '3. Auto-generated camera movements',
            '4. Add character performances',
            '5. Layer text/lyrics overlays',
            '6. Render with post-processing effects',
        ],
    },
    {
        id: 'interview',
        name: 'Interview / Podcast',
        icon: '🎙️',
        description: 'Two-person setup with interview staging and lower-third graphics',
        category: 'Professional',
        aspectRatio: '16:9',
        resolution: { width: 1920, height: 1080 },
        duration: 600,
        environment: 'interview',
        camera: { type: 'static', fov: 45 },
        sceneCount: 3,
        audio: { musicMood: 'ambient', hasNarration: false, hasSFX: false },
        textPresets: ['lower-third', 'subtitle'],
        workflow: [
            '1. Set up two characters in interview positions',
            '2. Assign voices to each character',
            '3. Paste interview transcript',
            '4. AI generates dialogue with lip sync',
            '5. Add lower-third name plates',
            '6. Multi-camera edit and render',
        ],
    },
    {
        id: 'tutorial',
        name: 'Tutorial / How-To',
        icon: '📚',
        description: 'Step-by-step instructional video with presenter and screen share feel',
        category: 'Educational',
        aspectRatio: '16:9',
        resolution: { width: 1920, height: 1080 },
        duration: 180,
        environment: 'office',
        camera: { type: 'static', fov: 45 },
        sceneCount: 6,
        audio: { musicMood: 'ambient', hasNarration: true, hasSFX: true },
        textPresets: ['lower-third', 'subtitle', 'chapter-card'],
        workflow: [
            '1. Outline your tutorial steps',
            '2. Each step becomes a scene',
            '3. Add presenter character',
            '4. Generate voice narration per step',
            '5. Add step number overlays',
            '6. Render with clear typography',
        ],
    },
    {
        id: 'short-film',
        name: 'Short Film',
        icon: '🎬',
        description: 'Narrative short with dramatic lighting, multiple characters, and cinematic shots',
        category: 'Creative',
        aspectRatio: '16:9',
        resolution: { width: 1920, height: 1080 },
        duration: 300,
        environment: 'void',
        camera: { type: 'crane', fov: 35 },
        sceneCount: 10,
        audio: { musicMood: 'dramatic', hasNarration: false, hasSFX: true },
        textPresets: ['cinematic-title', 'credits-roll'],
        workflow: [
            '1. Write your screenplay in Script Editor',
            '2. Auto-generate storyboard panels',
            '3. AI composes each scene',
            '4. Assign character voices',
            '5. Set up dramatic camera movements',
            '6. Add title sequence and credits',
            '7. Full render with post-processing',
        ],
    },
    {
        id: 'commercial',
        name: '30-Second Commercial',
        icon: '📺',
        description: 'Fast-paced commercial with quick cuts and call-to-action',
        category: 'Marketing',
        aspectRatio: '16:9',
        resolution: { width: 1920, height: 1080 },
        duration: 30,
        environment: 'gradient',
        camera: { type: 'follow', fov: 50 },
        sceneCount: 5,
        audio: { musicMood: 'upbeat', hasNarration: true, hasSFX: true },
        textPresets: ['cinematic-title', 'call-to-action', 'lower-third'],
        workflow: [
            '1. Write your tagline and key message',
            '2. Quick-cut scene generation',
            '3. Bold text animations',
            '4. Energetic voice-over',
            '5. End with call-to-action',
        ],
    },
    {
        id: 'podcast-visual',
        name: 'Visual Podcast',
        icon: '🎧',
        description: 'Audio-first content with animated waveforms and speaker visualization',
        category: 'Professional',
        aspectRatio: '16:9',
        resolution: { width: 1920, height: 1080 },
        duration: 1800,
        environment: 'void',
        camera: { type: 'static', fov: 45 },
        sceneCount: 1,
        audio: { musicMood: 'none', hasNarration: false, hasSFX: false },
        textPresets: ['lower-third', 'subtitle'],
        workflow: [
            '1. Import your podcast audio',
            '2. Auto-generate waveform visualization',
            '3. Add speaker name cards',
            '4. Optional: add subtitles from transcript',
            '5. Render for YouTube/Spotify Canvas',
        ],
    },
    {
        id: 'social-clip',
        name: 'Social Media Clip',
        icon: '📱',
        description: 'Vertical video optimized for TikTok, Instagram Reels, Shorts',
        category: 'Social',
        aspectRatio: '9:16',
        resolution: { width: 1080, height: 1920 },
        duration: 30,
        environment: 'gradient',
        camera: { type: 'static', fov: 50 },
        sceneCount: 3,
        audio: { musicMood: 'upbeat', hasNarration: true, hasSFX: true },
        textPresets: ['cinematic-title', 'subtitle'],
        workflow: [
            '1. Write your hook (first 3 seconds)',
            '2. Add key message scenes',
            '3. Bold, centered text overlays',
            '4. Quick voice-over',
            '5. Export in 9:16 vertical',
        ],
    },
]

/**
 * Get templates by category.
 */
export function getTemplatesByCategory(): Record<string, ProjectTemplate[]> {
    const grouped: Record<string, ProjectTemplate[]> = {}
    for (const t of PROJECT_TEMPLATES) {
        if (!grouped[t.category]) grouped[t.category] = []
        grouped[t.category].push(t)
    }
    return grouped
}

/**
 * Find a template by ID.
 */
export function getTemplate(id: TemplateId): ProjectTemplate | undefined {
    return PROJECT_TEMPLATES.find(t => t.id === id)
}
