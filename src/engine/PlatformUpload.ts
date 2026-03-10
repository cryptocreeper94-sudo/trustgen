/* ====== TrustGen — Platform Upload / Share System ======
 * Direct upload to YouTube & TikTok via OAuth.
 * Deep-link / share for platforms without upload APIs.
 *
 * Supported:
 *   Direct Upload: YouTube (Data API v3), TikTok (Content Posting API)
 *   Share Links:   Instagram, X/Twitter, Facebook, LinkedIn, Reddit
 *   Ecosystem:     TrustBook, Chronicles, Signal Chat
 */

// ── Types ──

export type UploadPlatform =
    | 'youtube' | 'tiktok'                                  // Direct upload
    | 'instagram' | 'twitter' | 'facebook' | 'linkedin' | 'reddit' // Share links
    | 'trustbook' | 'chronicles' | 'signal-chat'           // Ecosystem

export type UploadCapability = 'direct-upload' | 'share-link' | 'ecosystem'

export interface PlatformInfo {
    id: UploadPlatform
    name: string
    icon: string
    capability: UploadCapability
    requiresAuth: boolean
    supportedFormats: string[]
    maxFileSize: number  // MB, 0 = unlimited
    maxDuration: number  // seconds, 0 = unlimited
    description: string
}

export interface UploadConfig {
    /** Video title */
    title: string
    /** Description / caption */
    description: string
    /** Tags/hashtags */
    tags: string[]
    /** Privacy setting */
    privacy: 'public' | 'unlisted' | 'private'
    /** Category (platform-specific) */
    category?: string
    /** Thumbnail blob (optional) */
    thumbnailBlob?: Blob
    /** Schedule publish time (ISO string, optional) */
    scheduledAt?: string
}

export interface UploadResult {
    success: boolean
    platform: UploadPlatform
    /** URL of the uploaded content */
    url?: string
    /** Platform-specific video ID */
    videoId?: string
    /** Error message if failed */
    error?: string
    /** Upload progress (0–100) */
    progress?: number
}

// ── Platform Registry ──

export const PLATFORMS: PlatformInfo[] = [
    // Direct Upload
    {
        id: 'youtube', name: 'YouTube', icon: '▶️',
        capability: 'direct-upload', requiresAuth: true,
        supportedFormats: ['mp4', 'webm'], maxFileSize: 0, maxDuration: 0,
        description: 'Upload directly to your YouTube channel'
    },
    {
        id: 'tiktok', name: 'TikTok', icon: '🎵',
        capability: 'direct-upload', requiresAuth: true,
        supportedFormats: ['mp4'], maxFileSize: 287, maxDuration: 180,
        description: 'Post directly to your TikTok profile'
    },
    // Share Links
    {
        id: 'instagram', name: 'Instagram', icon: '📸',
        capability: 'share-link', requiresAuth: false,
        supportedFormats: ['mp4'], maxFileSize: 250, maxDuration: 90,
        description: 'Download and share via Instagram app'
    },
    {
        id: 'twitter', name: 'X (Twitter)', icon: '🐦',
        capability: 'share-link', requiresAuth: false,
        supportedFormats: ['mp4'], maxFileSize: 512, maxDuration: 140,
        description: 'Share with pre-filled tweet text'
    },
    {
        id: 'facebook', name: 'Facebook', icon: '👤',
        capability: 'share-link', requiresAuth: false,
        supportedFormats: ['mp4'], maxFileSize: 0, maxDuration: 240,
        description: 'Share to Facebook with preview'
    },
    {
        id: 'linkedin', name: 'LinkedIn', icon: '💼',
        capability: 'share-link', requiresAuth: false,
        supportedFormats: ['mp4'], maxFileSize: 200, maxDuration: 600,
        description: 'Share professionally on LinkedIn'
    },
    {
        id: 'reddit', name: 'Reddit', icon: '🔴',
        capability: 'share-link', requiresAuth: false,
        supportedFormats: ['mp4'], maxFileSize: 0, maxDuration: 900,
        description: 'Submit to a subreddit'
    },
    // Ecosystem
    {
        id: 'trustbook', name: 'TrustBook', icon: '📚',
        capability: 'ecosystem', requiresAuth: true,
        supportedFormats: ['mp4', 'webm'], maxFileSize: 0, maxDuration: 0,
        description: 'Attach video to your ebook on TrustBook'
    },
    {
        id: 'chronicles', name: 'Chronicles', icon: '📜',
        capability: 'ecosystem', requiresAuth: true,
        supportedFormats: ['mp4', 'webm'], maxFileSize: 0, maxDuration: 0,
        description: 'Feature in your Chronicles portfolio'
    },
    {
        id: 'signal-chat', name: 'Signal Chat', icon: '💬',
        capability: 'ecosystem', requiresAuth: true,
        supportedFormats: ['mp4', 'webm'], maxFileSize: 50, maxDuration: 60,
        description: 'Share in Signal Chat channels'
    },
]

// ── OAuth Management ──

export interface OAuthToken {
    platform: UploadPlatform
    accessToken: string
    refreshToken?: string
    expiresAt: number
    scope: string
}

/**
 * Initiate OAuth flow for a platform.
 * Opens a popup window and returns the auth token.
 */
export async function initiateOAuth(platform: UploadPlatform): Promise<OAuthToken> {
    const res = await fetch(`/api/upload/oauth/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
    })

    if (!res.ok) throw new Error(`OAuth init failed for ${platform}`)
    const { authUrl, state } = await res.json()

    // Open OAuth popup
    const popup = window.open(authUrl, `${platform}-auth`, 'width=600,height=700')

    // Listen for callback
    return new Promise((resolve, reject) => {
        const timer = setInterval(() => {
            if (popup?.closed) {
                clearInterval(timer)
                // Check if we got the token
                fetch(`/api/upload/oauth/status?state=${state}`)
                    .then(r => r.json())
                    .then(data => {
                        if (data.token) resolve(data.token)
                        else reject(new Error('OAuth was cancelled'))
                    })
                    .catch(reject)
            }
        }, 500)

        // Timeout after 5 minutes
        setTimeout(() => {
            clearInterval(timer)
            popup?.close()
            reject(new Error('OAuth timed out'))
        }, 300000)
    })
}

/**
 * Check if we have a valid token for a platform.
 */
export async function checkAuth(platform: UploadPlatform): Promise<boolean> {
    try {
        const res = await fetch(`/api/upload/oauth/check?platform=${platform}`)
        const data = await res.json()
        return data.authenticated === true
    } catch {
        return false
    }
}

// ── Upload Functions ──

/**
 * Upload video directly to YouTube.
 */
export async function uploadToYouTube(
    videoBlob: Blob,
    config: UploadConfig,
    onProgress?: (progress: number) => void
): Promise<UploadResult> {
    return uploadToPlatform('youtube', videoBlob, config, onProgress)
}

/**
 * Upload video directly to TikTok.
 */
export async function uploadToTikTok(
    videoBlob: Blob,
    config: UploadConfig,
    onProgress?: (progress: number) => void
): Promise<UploadResult> {
    return uploadToPlatform('tiktok', videoBlob, config, onProgress)
}

/**
 * Generic platform upload — sends video to server endpoint which handles the API call.
 */
async function uploadToPlatform(
    platform: UploadPlatform,
    videoBlob: Blob,
    config: UploadConfig,
    onProgress?: (progress: number) => void
): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('video', videoBlob, `${config.title.replace(/[^a-z0-9]/gi, '_')}.mp4`)
    formData.append('platform', platform)
    formData.append('title', config.title)
    formData.append('description', config.description)
    formData.append('tags', JSON.stringify(config.tags))
    formData.append('privacy', config.privacy)
    if (config.category) formData.append('category', config.category)
    if (config.thumbnailBlob) formData.append('thumbnail', config.thumbnailBlob, 'thumbnail.jpg')
    if (config.scheduledAt) formData.append('scheduledAt', config.scheduledAt)

    try {
        const xhr = new XMLHttpRequest()

        const result = await new Promise<UploadResult>((resolve, reject) => {
            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = Math.round((e.loaded / e.total) * 100)
                    onProgress?.(progress)
                }
            })

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    const data = JSON.parse(xhr.responseText)
                    resolve({
                        success: true,
                        platform,
                        url: data.url,
                        videoId: data.videoId,
                        progress: 100,
                    })
                } else {
                    resolve({
                        success: false,
                        platform,
                        error: `Upload failed (${xhr.status}): ${xhr.statusText}`,
                    })
                }
            })

            xhr.addEventListener('error', () => {
                reject(new Error('Network error during upload'))
            })

            xhr.open('POST', `/api/upload/${platform}`)
            xhr.send(formData)
        })

        return result
    } catch (err: any) {
        return { success: false, platform, error: err.message }
    }
}

// ── Share Link Generation ──

/**
 * Generate a share link for platforms without direct upload.
 */
export function generateShareLink(
    platform: UploadPlatform,
    config: { title: string; description: string; url?: string; tags?: string[] }
): string {
    const text = encodeURIComponent(config.title + (config.description ? ' — ' + config.description : ''))
    const url = encodeURIComponent(config.url || window.location.href)
    const hashtags = (config.tags || []).map(t => t.replace(/^#/, '')).join(',')

    switch (platform) {
        case 'twitter':
            return `https://twitter.com/intent/tweet?text=${text}&url=${url}${hashtags ? `&hashtags=${hashtags}` : ''}`
        case 'facebook':
            return `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`
        case 'linkedin':
            return `https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${encodeURIComponent(config.title)}&summary=${encodeURIComponent(config.description || '')}`
        case 'reddit':
            return `https://www.reddit.com/submit?url=${url}&title=${encodeURIComponent(config.title)}`
        default:
            return ''
    }
}

/**
 * Open share link in a new window.
 */
export function openShareWindow(platform: UploadPlatform, config: Parameters<typeof generateShareLink>[1]): void {
    const link = generateShareLink(platform, config)
    if (link) {
        window.open(link, `share-${platform}`, 'width=600,height=400')
    }
}

// ── Ecosystem Upload (TrustBook, Chronicles, Signal Chat) ──

/**
 * Upload to an ecosystem platform via internal API.
 */
export async function uploadToEcosystem(
    platform: 'trustbook' | 'chronicles' | 'signal-chat',
    videoBlob: Blob,
    config: UploadConfig & {
        /** For TrustBook: ebook ID to attach to */
        ebookId?: string
        /** For Chronicles: portfolio section */
        section?: string
        /** For Signal Chat: channel ID */
        channelId?: string
    },
    onProgress?: (progress: number) => void
): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('video', videoBlob, `${config.title.replace(/[^a-z0-9]/gi, '_')}.mp4`)
    formData.append('title', config.title)
    formData.append('description', config.description)
    formData.append('tags', JSON.stringify(config.tags))

    if (platform === 'trustbook' && config.ebookId) {
        formData.append('ebookId', config.ebookId)
    }
    if (platform === 'chronicles' && config.section) {
        formData.append('section', config.section)
    }
    if (platform === 'signal-chat' && config.channelId) {
        formData.append('channelId', config.channelId)
    }

    try {
        const res = await fetch(`/api/upload/ecosystem/${platform}`, {
            method: 'POST',
            body: formData,
        })

        if (!res.ok) {
            const err = await res.text()
            return { success: false, platform, error: err }
        }

        const data = await res.json()
        onProgress?.(100)
        return { success: true, platform, url: data.url, videoId: data.id }
    } catch (err: any) {
        return { success: false, platform, error: err.message }
    }
}

// ── Multi-Platform Publish ──

/**
 * Publish to multiple platforms at once.
 * Handles different capabilities per platform.
 */
export async function multiPlatformPublish(
    platforms: UploadPlatform[],
    videoBlob: Blob,
    config: UploadConfig,
    onProgress?: (platform: UploadPlatform, progress: number) => void
): Promise<Record<UploadPlatform, UploadResult>> {
    const results: Record<string, UploadResult> = {}

    for (const platform of platforms) {
        const info = PLATFORMS.find(p => p.id === platform)
        if (!info) {
            results[platform] = { success: false, platform, error: 'Unknown platform' }
            continue
        }

        onProgress?.(platform, 0)

        try {
            switch (info.capability) {
                case 'direct-upload':
                    results[platform] = await uploadToPlatform(
                        platform, videoBlob, config,
                        (p) => onProgress?.(platform, p)
                    )
                    break

                case 'ecosystem':
                    results[platform] = await uploadToEcosystem(
                        platform as any, videoBlob, config,
                        (p) => onProgress?.(platform, p)
                    )
                    break

                case 'share-link':
                    openShareWindow(platform, config)
                    results[platform] = { success: true, platform, url: generateShareLink(platform, config) }
                    break
            }
        } catch (err: any) {
            results[platform] = { success: false, platform, error: err.message }
        }
    }

    return results as Record<UploadPlatform, UploadResult>
}
