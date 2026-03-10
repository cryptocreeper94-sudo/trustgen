/* ====== TrustGen — Help Center Engine ======
 * Searchable documentation and contextual help system.
 * Lives in the hamburger menu as a slide-out panel.
 *
 * Features:
 * - Categorized help articles
 * - Full-text search
 * - Contextual help (shows relevant tips based on current panel)
 * - Keyboard shortcuts reference
 * - Video tutorial links
 * - Getting started wizard
 */

// ── Types ──

export type HelpCategory =
    | 'getting-started' | 'scene' | 'animation' | 'rigging'
    | 'ai' | 'cinematic' | 'audio' | 'export' | 'keyboard'
    | 'troubleshooting' | 'account'

export interface HelpArticle {
    id: string
    title: string
    category: HelpCategory
    icon: string
    content: string
    /** Tags for search */
    tags: string[]
    /** Related article IDs */
    related: string[]
}

// ── Help Content ──

export const HELP_ARTICLES: HelpArticle[] = [
    // ── Getting Started ──
    {
        id: 'gs-overview', title: 'Welcome to TrustGen', category: 'getting-started', icon: '🎬',
        content: `TrustGen is a full-featured 3D animation studio in your browser. Here's how to get started:

1. **Choose a Template** — Start with a Project Template (Documentary, Explainer, etc.) or open a blank scene.
2. **Add Objects** — Use Text-to-3D to generate props, or import models (GLB/GLTF/FBX).
3. **Set Up Characters** — Use the Character Creator or import rigged models.
4. **Animate** — Apply procedural animations, set keyframes, or use blend trees.
5. **Set Up Shots** — Use the Sequencer for multi-shot timelines with camera movements.
6. **Add Audio** — Record narration, generate AI voice-overs, or import music.
7. **Render & Share** — Export to video and upload to YouTube, TikTok, or TrustBook.`,
        tags: ['start', 'begin', 'how to', 'tutorial', 'first time', 'new'],
        related: ['gs-templates', 'gs-story-mode'],
    },
    {
        id: 'gs-templates', title: 'Project Templates', category: 'getting-started', icon: '📋',
        content: `Templates give you a pre-configured starting point:

• **Documentary** — Studio environments, narration, chapter titles
• **Explainer** — Clean gradient backgrounds, bright text animations
• **Product Demo** — Orbit camera, studio lighting, feature callouts
• **Music Video** — Beat-synced cuts, neon environments
• **Interview** — Two-shot setup, lower-third graphics
• **Tutorial** — Step-by-step with presenter
• **Short Film** — Dramatic lighting, cinematic camera
• **Commercial** — Fast cuts, call-to-action
• **Visual Podcast** — Waveform visualization
• **Social Clip** — 9:16 vertical for TikTok/Reels

Each template sets up the environment, camera, audio, and text presets.`,
        tags: ['template', 'preset', 'documentary', 'explainer', 'music video', 'project'],
        related: ['gs-overview', 'gs-story-mode'],
    },
    {
        id: 'gs-story-mode', title: 'Story Mode (Ebook → Documentary)', category: 'getting-started', icon: '📖',
        content: `Story Mode is TrustGen's one-click ebook-to-documentary pipeline:

1. Paste your text (ebook chapter, article, script)
2. Choose a style (Documentary, Explainer, Dramatic, Educational, Cinematic)
3. Hit "Generate" — Story Mode auto-generates:
   • Scene breakdown (by paragraph/chapter)
   • Environment selection per scene
   • Camera angles and movements
   • Character placement
   • Narration duration estimates
4. Review the timeline and tweak as needed
5. Generate AI voice-over for narration
6. Render and export

**TrustBook Integration**: Connect your TrustBook account to import ebooks directly!`,
        tags: ['story', 'ebook', 'documentary', 'auto', 'one click', 'trustbook', 'import'],
        related: ['gs-templates', 'ai-text3d', 'ai-voice'],
    },
    // ── Scene ──
    {
        id: 'scene-objects', title: 'Adding & Editing Objects', category: 'scene', icon: '🧊',
        content: `**Import Models**: Drag GLB/GLTF/FBX files onto the viewport or use the Import panel.

**Text-to-3D**: Type a description (e.g., "wooden desk with a lamp") and get instant 3D geometry.
• AI Mode: Uses OpenAI for complex descriptions
• Local Mode: Instant keyword-based generation (works offline)

**Primitives**: Add cubes, spheres, cylinders from the Objects menu.

**Transform**: Select an object, then:
• W = Move tool, E = Rotate tool, R = Scale tool
• Edit precise values in the Properties panel
• Hold Shift for snapping`,
        tags: ['object', 'import', 'model', 'glb', 'gltf', 'fbx', 'add', 'move', 'rotate', 'scale'],
        related: ['ai-text3d', 'scene-env'],
    },
    {
        id: 'scene-env', title: 'Environments', category: 'scene', icon: '🏞️',
        content: `9 pre-built environments, no models needed:

**Indoor**: Photo Studio, Modern Office, Living Room
**Stage**: Interview Set, Presentation Stage
**Outdoor**: City Park, Beach
**Abstract**: Void (grid floor), Gradient Stage (neon pillars)

Each environment includes floor, walls/sky, furniture, and lighting.
Select from the Environment panel or let the Scene Director choose automatically.`,
        tags: ['environment', 'background', 'studio', 'office', 'park', 'beach', 'void'],
        related: ['scene-objects', 'scene-lighting'],
    },
    {
        id: 'scene-lighting', title: 'Lighting & Materials', category: 'scene', icon: '💡',
        content: `**Materials (PBR)**:
• Color — base color of the surface
• Metalness — 0 = plastic/wood, 1 = pure metal
• Roughness — 0 = mirror/glass, 1 = rough stone
• Emissive — makes objects glow

**Lights**: Ambient, Directional, Point, Spot
• Use the Lighting panel to adjust type, color, intensity
• Shadows are enabled by default on directional/spot lights`,
        tags: ['light', 'material', 'color', 'shadow', 'pbr', 'metal', 'glow', 'emissive'],
        related: ['scene-objects'],
    },
    // ── Animation ──
    {
        id: 'anim-procedural', title: 'Procedural Animations', category: 'animation', icon: '💃',
        content: `7 built-in animation presets — no keyframing needed:

• **Walk** — forward walk cycle
• **Run** — fast run cycle
• **Idle** — breathing/stance
• **Wave** — greeting gesture
• **Jump** — vertical leap
• **Dance** — rhythmic movement
• **Float** — hover/levitate

Apply from the Animation panel. Adjust speed and loop settings.`,
        tags: ['animation', 'walk', 'run', 'idle', 'dance', 'procedural', 'preset'],
        related: ['anim-keyframe', 'anim-blend'],
    },
    {
        id: 'anim-keyframe', title: 'Keyframe Animation', category: 'animation', icon: '⏱️',
        content: `Manual keyframing for precise control:

1. Move the timeline scrubber to a time position
2. Adjust the object's position/rotation/scale
3. Click the keyframe button (or press K)
4. Move to another time position and repeat
5. The engine interpolates between keyframes

**Easing**: Linear, Ease-In, Ease-Out, Ease-In-Out
**Playback**: Space = play/pause, arrow keys = step frame`,
        tags: ['keyframe', 'timeline', 'manual', 'frame', 'interpolation', 'easing'],
        related: ['anim-procedural', 'anim-blend'],
    },
    {
        id: 'anim-blend', title: 'Animation Blend Trees', category: 'animation', icon: '🌳',
        content: `Blend trees let you smoothly mix animations:

• **1D Blend**: Mix between 2 animations based on a single parameter (e.g., walk speed)
• **2D Blend**: Mix 4+ animations on a 2D grid (e.g., direction + speed)
• **Additive**: Layer animations on top of each other (e.g., walk + wave)

Presets: Walk→Run, Idle→Dance, Combat Stance`,
        tags: ['blend', 'tree', 'mix', 'transition', 'layer', 'additive'],
        related: ['anim-procedural', 'anim-keyframe'],
    },
    // ── AI ──
    {
        id: 'ai-text3d', title: 'Text-to-3D Generation', category: 'ai', icon: '🧠',
        content: `Generate 3D objects from text descriptions (max 1000 characters).

**AI Mode**: Powered by OpenAI — handles complex descriptions like "a medieval castle with a drawbridge and two towers"
**Local Mode**: Instant, works offline — uses keyword matching for common objects

**Supported objects**: table, chair, sword, tree, house, car, lamp, book, shield, barrel, pillar, chest, crown, human, robot, and more.

**33 material keywords**: wood, metal, stone, glass, gold, silver, ice, lava, neon, jade, marble, crystal, etc.`,
        tags: ['text', '3d', 'generate', 'ai', 'create', 'object', 'prompt'],
        related: ['ai-voice', 'scene-objects'],
    },
    {
        id: 'ai-voice', title: 'AI Voice-Over', category: 'ai', icon: '🎙️',
        content: `Generate narration and character dialogue:

**9 Voice Presets**: Narrator, Male Deep, Male Warm, Female Clear, Female Warm, Child, Elder, Robot, Whisper

**8 Emotions**: Neutral, Excited, Serious, Warm, Dramatic, Sad, Angry, Cheerful

**Providers**: ElevenLabs (primary, natural-sounding) → OpenAI TTS (fallback)

**Auto-assign**: The system automatically assigns different voices to different characters in multi-character scripts.`,
        tags: ['voice', 'speech', 'narration', 'tts', 'elevenlabs', 'character', 'dialogue'],
        related: ['ai-text3d', 'gs-story-mode'],
    },
    // ── Export ──
    {
        id: 'export-social', title: 'Social Media Export', category: 'export', icon: '📱',
        content: `One-click export presets for every major platform:

| Platform | Resolution | Aspect | Max Duration |
|---|---|---|---|
| YouTube | 1920×1080 | 16:9 | Unlimited |
| YouTube Shorts | 1080×1920 | 9:16 | 60s |
| TikTok | 1080×1920 | 9:16 | 3min |
| Instagram Reel | 1080×1920 | 9:16 | 90s |
| Instagram Post | 1080×1080 | 1:1 | 60s |
| X (Twitter) | 1280×720 | 16:9 | 2:20 |
| LinkedIn | 1920×1080 | 16:9 | 10min |

**Direct upload**: YouTube & TikTok (requires API keys)
**Share links**: All other platforms`,
        tags: ['export', 'social', 'youtube', 'tiktok', 'instagram', 'twitter', 'upload', 'share'],
        related: ['export-blockchain'],
    },
    {
        id: 'export-blockchain', title: 'Blockchain-Verified Renders', category: 'export', icon: '🔒',
        content: `Every video you export gets a Trust Layer proof document:

• **Content hash** (SHA-256) — proves the video hasn't been altered
• **Creator identity** — proves you made it
• **Timestamp** — proves when it was created
• **Asset tree** — proves which assets were used
• **On-chain hallmark** — registered on Trust Layer blockchain

The proof document downloads alongside your video as a JSON file.
Anyone can verify at trustlayer.app/verify/[hallmark-id]`,
        tags: ['blockchain', 'hallmark', 'proof', 'verify', 'hash', 'trust layer', 'security'],
        related: ['export-social'],
    },
    // ── Keyboard ──
    {
        id: 'kb-shortcuts', title: 'Keyboard Shortcuts', category: 'keyboard', icon: '⌨️',
        content: `**Viewport**:
• W = Move tool, E = Rotate tool, R = Scale tool
• F = Focus selected, G = Toggle grid
• Delete = Delete selected

**Playback**:
• Space = Play/Pause
• ← → = Step frame
• Home = Go to start

**General**:
• Ctrl+S = Save scene
• Ctrl+Z = Undo
• Ctrl+Shift+Z = Redo
• K = Set keyframe
• H = Toggle help panel`,
        tags: ['keyboard', 'shortcut', 'hotkey', 'key', 'control', 'command'],
        related: ['gs-overview'],
    },
]

// ── Search ──

/**
 * Full-text search across all help articles.
 */
export function searchHelp(query: string): HelpArticle[] {
    if (!query.trim()) return HELP_ARTICLES

    const lower = query.toLowerCase()
    const terms = lower.split(/\s+/)

    return HELP_ARTICLES
        .map(article => {
            let score = 0
            for (const term of terms) {
                if (article.title.toLowerCase().includes(term)) score += 10
                if (article.tags.some(t => t.includes(term))) score += 5
                if (article.content.toLowerCase().includes(term)) score += 1
            }
            return { article, score }
        })
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(r => r.article)
}

/**
 * Get articles by category.
 */
export function getByCategory(category: HelpCategory): HelpArticle[] {
    return HELP_ARTICLES.filter(a => a.category === category)
}

/**
 * Get contextual help based on the current panel/view.
 */
export function getContextualHelp(panelId: string): HelpArticle[] {
    const contextMap: Record<string, string[]> = {
        'scene': ['scene-objects', 'scene-env', 'scene-lighting'],
        'animation': ['anim-procedural', 'anim-keyframe', 'anim-blend'],
        'rigging': ['anim-procedural'],
        'ai': ['ai-text3d', 'ai-voice'],
        'export': ['export-social', 'export-blockchain'],
        'sequencer': ['gs-story-mode'],
        'audio': ['ai-voice'],
    }
    const ids = contextMap[panelId] || ['gs-overview']
    return HELP_ARTICLES.filter(a => ids.includes(a.id))
}

/**
 * All help categories with labels.
 */
export const HELP_CATEGORIES: { id: HelpCategory; label: string; icon: string }[] = [
    { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
    { id: 'scene', label: 'Scene & Objects', icon: '🧊' },
    { id: 'animation', label: 'Animation', icon: '💃' },
    { id: 'ai', label: 'AI Tools', icon: '🧠' },
    { id: 'export', label: 'Export & Sharing', icon: '📤' },
    { id: 'keyboard', label: 'Keyboard Shortcuts', icon: '⌨️' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: '🔧' },
    { id: 'account', label: 'Account & Billing', icon: '👤' },
]
