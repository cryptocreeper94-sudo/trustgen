/* ====== TrustGen — TrustBook Bridge ======
 * Import ebook content from TrustBook directly into TrustGen's Story Mode.
 *
 * Flow:
 *   1. User connects TrustBook account (SSO via Trust Layer)
 *   2. Browse user's published ebooks
 *   3. Select a book / chapter
 *   4. Import text into Story Mode pipeline
 *   5. After render, cross-link the video back to the ebook
 *
 * This creates a seamless ebook → animated documentary pipeline
 * entirely within the Trust Layer ecosystem.
 */

// ── Types ──

export interface TrustBookEbook {
    id: string
    title: string
    author: string
    coverUrl: string
    description: string
    publishedDate: string
    chapters: TrustBookChapter[]
    /** Total word count */
    wordCount: number
    /** Genre/category */
    genre: string
    /** Trust Layer hallmark ID */
    hallmarkId?: string
    /** Public URL on TrustBook */
    publicUrl: string
}

export interface TrustBookChapter {
    id: string
    index: number
    title: string
    content: string
    wordCount: number
}

export interface TrustBookConnection {
    connected: boolean
    userId?: string
    displayName?: string
    ebooks: TrustBookEbook[]
    lastSync?: string
}

export interface ImportResult {
    ebook: TrustBookEbook
    selectedChapters: TrustBookChapter[]
    totalText: string
    totalWords: number
    estimatedDuration: number // seconds
}

// ── API Client ──

const TRUSTBOOK_API_BASE = '/api/trustbook'

/**
 * Check connection status with TrustBook.
 */
export async function checkConnection(): Promise<TrustBookConnection> {
    try {
        const res = await fetch(`${TRUSTBOOK_API_BASE}/status`)
        if (!res.ok) return { connected: false, ebooks: [] }
        return await res.json()
    } catch {
        return { connected: false, ebooks: [] }
    }
}

/**
 * Connect to TrustBook using Trust Layer SSO.
 * Opens the SSO flow and returns connection info.
 */
export async function connectTrustBook(): Promise<TrustBookConnection> {
    const res = await fetch(`${TRUSTBOOK_API_BASE}/connect`, { method: 'POST' })
    if (!res.ok) {
        throw new Error('Failed to connect to TrustBook')
    }
    return await res.json()
}

/**
 * Fetch user's ebook catalog from TrustBook.
 */
export async function fetchEbooks(): Promise<TrustBookEbook[]> {
    const res = await fetch(`${TRUSTBOOK_API_BASE}/ebooks`)
    if (!res.ok) throw new Error('Failed to fetch ebooks')
    const data = await res.json()
    return data.ebooks
}

/**
 * Fetch a specific ebook with full chapter content.
 */
export async function fetchEbook(ebookId: string): Promise<TrustBookEbook> {
    const res = await fetch(`${TRUSTBOOK_API_BASE}/ebooks/${ebookId}`)
    if (!res.ok) throw new Error('Failed to fetch ebook')
    return await res.json()
}

/**
 * Import selected chapters into Story Mode.
 * Returns the combined text and metadata.
 */
export function importChapters(
    ebook: TrustBookEbook,
    chapterIds: string[] | 'all'
): ImportResult {
    const selectedChapters = chapterIds === 'all'
        ? ebook.chapters
        : ebook.chapters.filter(ch => chapterIds.includes(ch.id))

    const totalText = selectedChapters
        .map(ch => `## ${ch.title}\n\n${ch.content}`)
        .join('\n\n---\n\n')

    const totalWords = totalText.split(/\s+/).length
    const estimatedDuration = (totalWords / 150) * 60 // 150 wpm narration

    return {
        ebook,
        selectedChapters,
        totalText,
        totalWords,
        estimatedDuration,
    }
}

/**
 * Cross-link a rendered video back to the TrustBook ebook.
 * Creates a "Video Adaptation" reference on the ebook page.
 */
export async function crossLinkVideo(params: {
    ebookId: string
    videoTitle: string
    videoUrl: string
    hallmarkId: string
    duration: number
}): Promise<{ success: boolean; linkUrl: string }> {
    const res = await fetch(`${TRUSTBOOK_API_BASE}/cross-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    })
    if (!res.ok) throw new Error('Failed to create cross-link')
    return await res.json()
}

// ── Quick Import Helpers ──

/**
 * One-click: fetch ebook → import all chapters → return Story Mode ready text.
 */
export async function quickImport(ebookId: string): Promise<ImportResult> {
    const ebook = await fetchEbook(ebookId)
    return importChapters(ebook, 'all')
}

/**
 * Estimate what the imported ebook will produce.
 */
export function estimateProduction(importResult: ImportResult): {
    scenes: number
    duration: string
    voiceOverMinutes: number
    environments: number
} {
    const scenes = Math.ceil(importResult.totalWords / 200) // ~200 words per scene
    const durationMin = Math.ceil(importResult.estimatedDuration / 60)
    return {
        scenes,
        duration: `~${durationMin} min`,
        voiceOverMinutes: durationMin,
        environments: Math.min(9, Math.ceil(scenes / 3)), // rotate through environments
    }
}

// ── Import Format for Story Mode ──

/**
 * Convert TrustBook import into a StoryConfig ready for Story Mode.
 */
export function toStoryConfig(importResult: ImportResult, narratorVoice = 'narrator') {
    return {
        title: importResult.ebook.title,
        text: importResult.totalText,
        style: 'documentary' as const,
        narratorVoice,
        targetDuration: Math.ceil(importResult.estimatedDuration / 60), // minutes
        showTitleCard: true,
        showCredits: true,
        musicMood: 'ambient' as const,
    }
}
