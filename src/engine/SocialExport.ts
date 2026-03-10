/* ====== TrustGen — Social Export Presets ======
 * One-click export for all major social media platforms.
 * Handles resolution, aspect ratio, letterboxing, and format.
 */

// ── Types ──

export type SocialPlatform =
    | 'youtube' | 'youtube-shorts' | 'tiktok' | 'instagram-reel'
    | 'instagram-post' | 'instagram-story' | 'twitter' | 'linkedin'
    | 'facebook' | 'twitch' | 'custom'

export interface SocialExportPreset {
    id: SocialPlatform
    name: string
    icon: string
    /** Canvas width */
    width: number
    /** Canvas height */
    height: number
    /** Aspect ratio label */
    aspectRatio: string
    /** Max duration in seconds (0 = unlimited) */
    maxDuration: number
    /** Recommended FPS */
    fps: number
    /** Max file size in MB (0 = unlimited) */
    maxFileSizeMB: number
    /** File format */
    format: 'mp4' | 'webm'
    /** Recommended bitrate in Mbps */
    bitrate: number
    /** Additional notes */
    notes: string
}

// ── Presets ──

export const SOCIAL_PRESETS: SocialExportPreset[] = [
    {
        id: 'youtube', name: 'YouTube', icon: '▶️',
        width: 1920, height: 1080, aspectRatio: '16:9',
        maxDuration: 0, fps: 30, maxFileSizeMB: 0,
        format: 'mp4', bitrate: 8,
        notes: 'Standard YouTube upload — 1080p HD'
    },
    {
        id: 'youtube-shorts', name: 'YouTube Shorts', icon: '📱',
        width: 1080, height: 1920, aspectRatio: '9:16',
        maxDuration: 60, fps: 30, maxFileSizeMB: 0,
        format: 'mp4', bitrate: 6,
        notes: 'Vertical short-form video — max 60 seconds'
    },
    {
        id: 'tiktok', name: 'TikTok', icon: '🎵',
        width: 1080, height: 1920, aspectRatio: '9:16',
        maxDuration: 180, fps: 30, maxFileSizeMB: 287,
        format: 'mp4', bitrate: 6,
        notes: 'Vertical video — up to 3 minutes recommended'
    },
    {
        id: 'instagram-reel', name: 'Instagram Reel', icon: '📸',
        width: 1080, height: 1920, aspectRatio: '9:16',
        maxDuration: 90, fps: 30, maxFileSizeMB: 250,
        format: 'mp4', bitrate: 6,
        notes: 'Vertical Reel — max 90 seconds'
    },
    {
        id: 'instagram-post', name: 'Instagram Post', icon: '🖼️',
        width: 1080, height: 1080, aspectRatio: '1:1',
        maxDuration: 60, fps: 30, maxFileSizeMB: 250,
        format: 'mp4', bitrate: 5,
        notes: 'Square video post — max 60 seconds'
    },
    {
        id: 'instagram-story', name: 'Instagram Story', icon: '📱',
        width: 1080, height: 1920, aspectRatio: '9:16',
        maxDuration: 15, fps: 30, maxFileSizeMB: 250,
        format: 'mp4', bitrate: 5,
        notes: 'Vertical story — 15 seconds per segment'
    },
    {
        id: 'twitter', name: 'X (Twitter)', icon: '🐦',
        width: 1280, height: 720, aspectRatio: '16:9',
        maxDuration: 140, fps: 30, maxFileSizeMB: 512,
        format: 'mp4', bitrate: 5,
        notes: '720p recommended — max 2:20'
    },
    {
        id: 'linkedin', name: 'LinkedIn', icon: '💼',
        width: 1920, height: 1080, aspectRatio: '16:9',
        maxDuration: 600, fps: 30, maxFileSizeMB: 200,
        format: 'mp4', bitrate: 6,
        notes: 'Professional video — max 10 minutes'
    },
    {
        id: 'facebook', name: 'Facebook', icon: '👤',
        width: 1280, height: 720, aspectRatio: '16:9',
        maxDuration: 240, fps: 30, maxFileSizeMB: 0,
        format: 'mp4', bitrate: 5,
        notes: '720p feed video — optimal 1-4 minutes'
    },
    {
        id: 'twitch', name: 'Twitch Clip', icon: '🎮',
        width: 1920, height: 1080, aspectRatio: '16:9',
        maxDuration: 60, fps: 60, maxFileSizeMB: 0,
        format: 'mp4', bitrate: 8,
        notes: '1080p60 — gaming/streaming clip'
    },
]

/**
 * Get a preset by platform ID.
 */
export function getPreset(platform: SocialPlatform): SocialExportPreset | undefined {
    return SOCIAL_PRESETS.find(p => p.id === platform)
}

/**
 * Calculate letterbox/pillarbox dimensions when source doesn't match target aspect ratio.
 */
export function calculateFit(
    srcWidth: number, srcHeight: number,
    targetWidth: number, targetHeight: number
): { x: number; y: number; width: number; height: number; scale: number } {
    const srcAspect = srcWidth / srcHeight
    const targetAspect = targetWidth / targetHeight

    let fitWidth: number, fitHeight: number, x: number, y: number

    if (srcAspect > targetAspect) {
        // Source is wider — pillarbox (bars on top/bottom)
        fitWidth = targetWidth
        fitHeight = targetWidth / srcAspect
        x = 0
        y = (targetHeight - fitHeight) / 2
    } else {
        // Source is taller — letterbox (bars on sides)
        fitHeight = targetHeight
        fitWidth = targetHeight * srcAspect
        x = (targetWidth - fitWidth) / 2
        y = 0
    }

    return {
        x: Math.round(x),
        y: Math.round(y),
        width: Math.round(fitWidth),
        height: Math.round(fitHeight),
        scale: fitWidth / srcWidth,
    }
}

/**
 * Estimate file size in MB given resolution, duration, and bitrate.
 */
export function estimateFileSize(preset: SocialExportPreset, durationSeconds: number): number {
    return (preset.bitrate * durationSeconds) / 8 // Mbps → MB
}

/**
 * Validate content fits within platform limits.
 */
export function validateExport(preset: SocialExportPreset, durationSeconds: number): { valid: boolean; warnings: string[] } {
    const warnings: string[] = []

    if (preset.maxDuration > 0 && durationSeconds > preset.maxDuration) {
        warnings.push(`Duration (${Math.ceil(durationSeconds)}s) exceeds ${preset.name} limit (${preset.maxDuration}s)`)
    }

    const estimatedSize = estimateFileSize(preset, durationSeconds)
    if (preset.maxFileSizeMB > 0 && estimatedSize > preset.maxFileSizeMB) {
        warnings.push(`Estimated size (${Math.ceil(estimatedSize)}MB) exceeds ${preset.name} limit (${preset.maxFileSizeMB}MB)`)
    }

    return { valid: warnings.length === 0, warnings }
}
