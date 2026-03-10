/* ====== TrustGen — Image Asset Registry ======
 * Maps every card, template, environment, and feature to a
 * photorealistic image. No more emojis as primary visuals.
 *
 * Images are stored in /public/images/cards/ and served statically.
 * Each entry has both an image path and an emoji fallback.
 *
 * Design system: Every bento card MUST display a photorealistic image.
 * Per Trust Layer Ultra-Premium Protocol.
 */

// ── Image Paths ──

const BASE = '/images/cards'

/**
 * Master image registry — maps every visual element to its photorealistic image.
 */
export const IMAGE_ASSETS = {
    // ── Project Templates ──
    templates: {
        'documentary': { src: `${BASE}/template-documentary.png`, emoji: '🎥', alt: 'Documentary film set with studio lights and presenter' },
        'explainer': { src: `${BASE}/template-explainer.png`, emoji: '📊', alt: 'Modern explainer with floating holographic charts' },
        'product-demo': { src: `${BASE}/template-product-demo.png`, emoji: '📦', alt: 'Product floating with dramatic studio lighting' },
        'music-video': { src: `${BASE}/template-music-video.png`, emoji: '🎵', alt: 'Neon-lit music performance stage' },
        'interview': { src: `${BASE}/template-interview.png`, emoji: '🎙️', alt: 'Professional talk show interview set' },
        'short-film': { src: `${BASE}/template-short-film.png`, emoji: '🎬', alt: 'Cinematic film production with camera and fog' },
        'tutorial': { src: `${BASE}/template-tutorial.png`, emoji: '📚', alt: 'Modern tutorial workspace with presenter' },
        'commercial': { src: `${BASE}/template-commercial.png`, emoji: '📺', alt: 'High-energy commercial production set' },
        'podcast-visual': { src: `${BASE}/template-podcast.png`, emoji: '🎧', alt: 'Podcast studio with waveform visualization' },
        'social-clip': { src: `${BASE}/template-social-clip.png`, emoji: '📱', alt: 'Vertical video production for social media' },
    },

    // ── Feature Cards ──
    features: {
        'text-to-3d': { src: `${BASE}/card-text-to-3d.png`, emoji: '🧊', alt: '3D objects materializing from glowing text' },
        'voice-over': { src: `${BASE}/card-voice-over.png`, emoji: '🎙️', alt: 'Professional recording booth with microphone' },
        'story-mode': { src: `${BASE}/card-story-mode.png`, emoji: '📖', alt: 'Book pages transforming into animated scenes' },
        'character-creator': { src: `${BASE}/card-character-creator.png`, emoji: '👤', alt: '3D character design workspace' },
        'blockchain-render': { src: `${BASE}/card-blockchain-render.png`, emoji: '🔒', alt: 'Holographic blockchain verification seal' },
        'social-export': { src: `${BASE}/card-social-export.png`, emoji: '📤', alt: 'Video shared across multiple device screens' },
        'auto-cut': { src: `${BASE}/card-auto-cut.png`, emoji: '✂️', alt: 'AI-powered editing timeline' },
        'lip-sync': { src: `${BASE}/card-lip-sync.png`, emoji: '👄', alt: 'Character mouth animation mapping' },
        'physics': { src: `${BASE}/card-physics.png`, emoji: '⚡', alt: 'Physics simulation with particles and forces' },
        'animation': { src: `${BASE}/card-animation.png`, emoji: '💃', alt: 'Character animation with motion trails' },
        'sequencer': { src: `${BASE}/card-sequencer.png`, emoji: '🎞️', alt: 'Multi-shot cinematic timeline' },
        'audio': { src: `${BASE}/card-audio.png`, emoji: '🔊', alt: 'Audio mixing board with waveforms' },
    },

    // ── Environment Previews ──
    environments: {
        'studio': { src: `${BASE}/env-studio.png`, emoji: '📸', alt: 'Clean white photo studio with lights' },
        'office': { src: `${BASE}/env-office.png`, emoji: '🏢', alt: 'Modern dark office with desk and monitor' },
        'living-room': { src: `${BASE}/env-living-room.png`, emoji: '🛋️', alt: 'Cozy living room with sofa' },
        'interview': { src: `${BASE}/env-interview.png`, emoji: '🎙️', alt: 'Interview set with two chairs' },
        'podium': { src: `${BASE}/env-podium.png`, emoji: '🎤', alt: 'Keynote presentation stage' },
        'park': { src: `${BASE}/env-park.png`, emoji: '🌳', alt: 'City park with trees and bench' },
        'beach': { src: `${BASE}/env-beach.png`, emoji: '🏖️', alt: 'Sandy beach with ocean horizon' },
        'void': { src: `${BASE}/env-void.png`, emoji: '🌑', alt: 'Dark void with subtle grid' },
        'gradient': { src: `${BASE}/env-gradient.png`, emoji: '🎨', alt: 'Gradient stage with neon pillars' },
    },

    // ── Dashboard Cards ──
    dashboard: {
        'recent-projects': { src: `${BASE}/dash-projects.png`, emoji: '📁', alt: 'Project files and scenes' },
        'quick-actions': { src: `${BASE}/dash-actions.png`, emoji: '⚡', alt: 'Quick action buttons' },
        'storage': { src: `${BASE}/dash-storage.png`, emoji: '💾', alt: 'Cloud storage visualization' },
        'recent-renders': { src: `${BASE}/dash-renders.png`, emoji: '🎬', alt: 'Rendered video thumbnails' },
        'ai-usage': { src: `${BASE}/dash-ai.png`, emoji: '🧠', alt: 'AI usage statistics' },
        'trustbook': { src: `${BASE}/dash-trustbook.png`, emoji: '📚', alt: 'Ebook library shelf' },
        'activity': { src: `${BASE}/dash-activity.png`, emoji: '📊', alt: 'Activity timeline chart' },
        'ecosystem': { src: `${BASE}/dash-ecosystem.png`, emoji: '🌐', alt: 'Trust Layer ecosystem apps' },
        'plan': { src: `${BASE}/dash-plan.png`, emoji: '⭐', alt: 'Subscription plan badge' },
    },

    // ── Ecosystem Apps ──
    ecosystem: {
        'trustvault': { src: `${BASE}/app-trustvault.png`, emoji: '🔐', alt: 'TrustVault developer portal' },
        'trustbook': { src: `${BASE}/app-trustbook.png`, emoji: '📚', alt: 'TrustBook ebook publishing' },
        'chronicles': { src: `${BASE}/app-chronicles.png`, emoji: '📜', alt: 'Chronicles portfolio' },
        'signal-chat': { src: `${BASE}/app-signal-chat.png`, emoji: '💬', alt: 'Signal Chat messaging' },
        'darkwave': { src: `${BASE}/app-darkwave.png`, emoji: '🌊', alt: 'DarkWave IDE' },
        'bomber3d': { src: `${BASE}/app-bomber3d.png`, emoji: '⛳', alt: 'Bomber 3D golf game' },
    },

    // ── Quick Actions ──
    quickActions: {
        'new-scene': { src: `${BASE}/action-new-scene.png`, emoji: '➕', alt: 'Create new scene' },
        'from-template': { src: `${BASE}/action-template.png`, emoji: '📋', alt: 'Start from template' },
        'story-mode': { src: `${BASE}/action-story-mode.png`, emoji: '📖', alt: 'Story mode pipeline' },
        'import-model': { src: `${BASE}/action-import.png`, emoji: '📦', alt: 'Import 3D model' },
        'text-to-3d': { src: `${BASE}/action-text3d.png`, emoji: '🧊', alt: 'Text to 3D generation' },
        'record-voice': { src: `${BASE}/action-record.png`, emoji: '🎙️', alt: 'Record narration' },
        'import-ebook': { src: `${BASE}/action-trustbook.png`, emoji: '📚', alt: 'Import from TrustBook' },
        'view-renders': { src: `${BASE}/action-renders.png`, emoji: '🎬', alt: 'View rendered videos' },
    },

    // ── Voices ──
    voices: {
        'narrator': { src: `${BASE}/voice-narrator.png`, emoji: '🎙️', alt: 'Professional narrator' },
        'male-deep': { src: `${BASE}/voice-male-deep.png`, emoji: '🗣️', alt: 'Deep male voice' },
        'male-warm': { src: `${BASE}/voice-male-warm.png`, emoji: '🗣️', alt: 'Warm male voice' },
        'female-clear': { src: `${BASE}/voice-female-clear.png`, emoji: '🗣️', alt: 'Clear female voice' },
        'female-warm': { src: `${BASE}/voice-female-warm.png`, emoji: '🗣️', alt: 'Warm female voice' },
        'child': { src: `${BASE}/voice-child.png`, emoji: '👦', alt: 'Child voice' },
        'elder': { src: `${BASE}/voice-elder.png`, emoji: '👴', alt: 'Elder voice' },
        'robot': { src: `${BASE}/voice-robot.png`, emoji: '🤖', alt: 'Robot voice' },
        'whisper': { src: `${BASE}/voice-whisper.png`, emoji: '🤫', alt: 'Whisper voice' },
    },
} as const

// ── Helper Functions ──

type AssetCategory = keyof typeof IMAGE_ASSETS
// type AssetId<C extends AssetCategory> = keyof typeof IMAGE_ASSETS[C]

/**
 * Get image asset by category and ID.
 * Falls back to emoji if image fails to load.
 */
export function getAsset<C extends AssetCategory>(category: C, id: string): {
    src: string; emoji: string; alt: string
} {
    const cat = IMAGE_ASSETS[category] as Record<string, { src: string; emoji: string; alt: string }>
    return cat[id] || { src: '', emoji: '❓', alt: 'Unknown' }
}

/**
 * Generate an <img> tag with emoji fallback via onerror.
 * Use this in JSX: dangerouslySetInnerHTML={{ __html: getImageHtml(...) }}
 */
export function getImageHtml(category: AssetCategory, id: string, className = ''): string {
    const asset = getAsset(category, id)
    return `<img
        src="${asset.src}"
        alt="${asset.alt}"
        class="${className}"
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex';"
        style="width:100%;height:100%;object-fit:cover;border-radius:12px;"
    /><span style="display:none;font-size:48px;align-items:center;justify-content:center;width:100%;height:100%;">${asset.emoji}</span>`
}

/**
 * Get all assets in a category as an array.
 */
export function getCategoryAssets(category: AssetCategory): { id: string; src: string; emoji: string; alt: string }[] {
    const cat = IMAGE_ASSETS[category] as Record<string, { src: string; emoji: string; alt: string }>
    return Object.entries(cat).map(([id, asset]) => ({ id, ...asset }))
}

/**
 * Preload images for smoother UX.
 */
export function preloadImages(category: AssetCategory): void {
    const assets = getCategoryAssets(category)
    for (const asset of assets) {
        const img = new Image()
        img.src = asset.src
    }
}
