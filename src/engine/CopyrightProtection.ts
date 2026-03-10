/* ====== TrustGen — Copyright & DRM Protection Engine ======
 * Protects intellectual property throughout the content pipeline.
 *
 * Key responsibilities:
 * 1. Ebook content from TrustBook/dwtl.io — prevent unauthorized reproduction
 * 2. Generated renders — watermark, fingerprint, and track provenance
 * 3. Imported assets — license verification and attribution tracking
 * 4. Trust Layer hallmarks — immutable proof of ownership
 *
 * Integration points:
 * - TrustBook Bridge: validates content licenses before import
 * - BlockchainRender: attaches copyright metadata to proofs
 * - PlatformUpload: embeds copyright info in upload metadata
 * - SocialExport: watermark on free-tier exports
 */

// ── Types ──

export type LicenseType =
    | 'full-ownership'      // Author owns all rights
    | 'creative-commons'    // CC license variant
    | 'editorial'           // For editorial/documentary use
    | 'personal'            // Personal, non-commercial
    | 'commercial'          // Full commercial rights
    | 'derivative'          // Can create derivative works
    | 'restricted'          // Cannot modify or redistribute

export type ContentType = 'ebook' | 'scene' | 'render' | 'model' | 'audio' | 'voiceover' | 'image'

export interface CopyrightHolder {
    name: string
    email?: string
    trustLayerId?: string
    organization?: string
    /** dwtl.io author profile URL */
    dwtlProfileUrl?: string
}

export interface ContentLicense {
    /** Unique license ID */
    id: string
    /** Type of license */
    type: LicenseType
    /** Content being licensed */
    contentType: ContentType
    /** Content identifier (e.g., ebook ID, scene ID) */
    contentId: string
    /** Title of the content */
    contentTitle: string
    /** Copyright holder */
    holder: CopyrightHolder
    /** License grant date */
    grantedAt: string
    /** Expiration (null = perpetual) */
    expiresAt: string | null
    /** Specific permissions granted */
    permissions: ContentPermissions
    /** Trust Layer hallmark for this license */
    hallmarkId?: string
    /** dwtl.io license reference */
    dwtlLicenseRef?: string
}

export interface ContentPermissions {
    /** Can reproduce in video form */
    reproduce: boolean
    /** Can create derivative works (animations, voiceovers) */
    derive: boolean
    /** Can distribute the resulting video */
    distribute: boolean
    /** Can use commercially */
    commercial: boolean
    /** Can sublicense */
    sublicense: boolean
    /** Must attribute original author */
    requireAttribution: boolean
    /** Can modify the original text */
    modify: boolean
    /** Geographic restrictions (empty = worldwide) */
    territories: string[]
}

export interface Watermark {
    /** Visible text watermark */
    text: string
    /** Position on screen */
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'
    /** Opacity (0-1) */
    opacity: number
    /** Font size in px */
    fontSize: number
    /** Include timestamp */
    includeTimestamp: boolean
    /** Include hallmark ID */
    includeHallmark: boolean
}

export interface ContentFingerprint {
    /** SHA-256 of the content */
    contentHash: string
    /** Perceptual hash for visual matching */
    perceptualHash: string
    /** Frame-level fingerprints for video */
    frameFingerprints: string[]
    /** Audio fingerprint */
    audioFingerprint?: string
    /** Metadata embedded in the file */
    embeddedMetadata: Record<string, string>
}

export interface CopyrightReport {
    /** All licenses associated with this project */
    licenses: ContentLicense[]
    /** Attribution credits to display */
    credits: CreditEntry[]
    /** Any warnings (missing licenses, expired, etc.) */
    warnings: CopyrightWarning[]
    /** Overall compliance status */
    compliant: boolean
    /** Generated copyright notice */
    copyrightNotice: string
}

export interface CreditEntry {
    role: string // "Author", "Voice Actor", etc.
    name: string
    source: string
    license: string
}

export interface CopyrightWarning {
    severity: 'info' | 'warning' | 'critical'
    message: string
    assetId: string
    suggestion: string
}

// ── License Presets ──

export const LICENSE_PRESETS: Record<LicenseType, ContentPermissions> = {
    'full-ownership': {
        reproduce: true, derive: true, distribute: true, commercial: true,
        sublicense: true, requireAttribution: false, modify: true, territories: [],
    },
    'creative-commons': {
        reproduce: true, derive: true, distribute: true, commercial: false,
        sublicense: false, requireAttribution: true, modify: true, territories: [],
    },
    'editorial': {
        reproduce: true, derive: true, distribute: true, commercial: false,
        sublicense: false, requireAttribution: true, modify: false, territories: [],
    },
    'personal': {
        reproduce: true, derive: true, distribute: false, commercial: false,
        sublicense: false, requireAttribution: false, modify: true, territories: [],
    },
    'commercial': {
        reproduce: true, derive: true, distribute: true, commercial: true,
        sublicense: false, requireAttribution: true, modify: true, territories: [],
    },
    'derivative': {
        reproduce: true, derive: true, distribute: true, commercial: true,
        sublicense: false, requireAttribution: true, modify: true, territories: [],
    },
    'restricted': {
        reproduce: false, derive: false, distribute: false, commercial: false,
        sublicense: false, requireAttribution: true, modify: false, territories: [],
    },
}

// ── Core Functions ──

/**
 * Verify content license before importing from TrustBook/dwtl.io.
 */
export async function verifyContentLicense(params: {
    contentId: string
    contentType: ContentType
    sourceApp: 'trustbook' | 'dwtl' | 'external'
    userId: string
}): Promise<{ licensed: boolean; license?: ContentLicense; error?: string }> {
    try {
        const res = await fetch('/api/copyright/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        })
        if (!res.ok) {
            return { licensed: false, error: `License check failed (${res.status})` }
        }
        const data = await res.json()
        return { licensed: data.licensed, license: data.license }
    } catch (err: any) {
        return { licensed: false, error: err.message }
    }
}

/**
 * Register a new content license on the Trust Layer.
 */
export async function registerLicense(license: Omit<ContentLicense, 'id' | 'grantedAt'>): Promise<ContentLicense> {
    const res = await fetch('/api/copyright/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(license),
    })
    if (!res.ok) throw new Error('Failed to register license')
    return await res.json()
}

/**
 * Generate a watermark configuration for a video render.
 */
export function generateWatermark(params: {
    creatorName: string
    plan: 'free' | 'starter' | 'pro' | 'enterprise'
    hallmarkId?: string
}): Watermark | null {
    // Pro and Enterprise users get no watermark
    if (params.plan === 'pro' || params.plan === 'enterprise') return null

    return {
        text: params.plan === 'free'
            ? `Made with TrustGen • ${params.creatorName}`
            : `${params.creatorName}`,
        position: 'bottom-right',
        opacity: params.plan === 'free' ? 0.4 : 0.15,
        fontSize: params.plan === 'free' ? 14 : 11,
        includeTimestamp: params.plan === 'free',
        includeHallmark: !!params.hallmarkId,
    }
}

/**
 * Generate a content fingerprint for a rendered video.
 * Used for tracking and DMCA enforcement.
 */
export async function fingerprintContent(blob: Blob): Promise<ContentFingerprint> {
    // SHA-256 content hash
    const buffer = await blob.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
    const contentHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')

    // Simple perceptual hash (first 1KB averaged)
    const sample = new Uint8Array(buffer.slice(0, 1024))
    let sum = 0
    for (const byte of sample) sum += byte
    const avg = sum / sample.length
    const perceptualHash = Array.from(sample.slice(0, 64))
        .map(b => b > avg ? '1' : '0')
        .join('')

    return {
        contentHash,
        perceptualHash,
        frameFingerprints: [],
        embeddedMetadata: {
            'generator': 'TrustGen',
            'generator-version': '1.0.0',
            'trust-layer': 'true',
        },
    }
}

/**
 * Generate a complete copyright report for a project.
 * Checks all assets, licenses, and compliance.
 */
export async function generateCopyrightReport(params: {
    projectTitle: string
    creatorName: string
    assets: { id: string; name: string; type: ContentType; source: string }[]
    ebookLicense?: ContentLicense
}): Promise<CopyrightReport> {
    const licenses: ContentLicense[] = []
    const credits: CreditEntry[] = []
    const warnings: CopyrightWarning[] = []

    // Add ebook license if importing from TrustBook
    if (params.ebookLicense) {
        licenses.push(params.ebookLicense)
        credits.push({
            role: 'Source Material',
            name: params.ebookLicense.holder.name,
            source: params.ebookLicense.contentTitle,
            license: params.ebookLicense.type,
        })

        // Check permissions
        if (!params.ebookLicense.permissions.derive) {
            warnings.push({
                severity: 'critical',
                message: `License for "${params.ebookLicense.contentTitle}" does not permit derivative works`,
                assetId: params.ebookLicense.contentId,
                suggestion: 'Contact the author to request derivative rights or choose different source material.',
            })
        }
        if (params.ebookLicense.permissions.requireAttribution) {
            credits.push({
                role: 'Original Author',
                name: params.ebookLicense.holder.name,
                source: `Based on "${params.ebookLicense.contentTitle}"`,
                license: params.ebookLicense.type,
            })
        }
    }

    // Check each asset
    for (const asset of params.assets) {
        if (asset.source === 'generated') {
            // AI-generated content — creator owns it
            credits.push({
                role: `${asset.type} (AI Generated)`,
                name: params.creatorName,
                source: asset.name,
                license: 'full-ownership',
            })
        } else if (asset.source === 'imported') {
            warnings.push({
                severity: 'warning',
                message: `Imported asset "${asset.name}" has no verified license`,
                assetId: asset.id,
                suggestion: 'Upload license documentation or confirm the asset is royalty-free.',
            })
        }
    }

    // Always credit TrustGen
    credits.push({
        role: 'Production Tool',
        name: 'TrustGen by Trust Layer',
        source: 'trustgen.trustlayer.app',
        license: 'tool-license',
    })

    // Add AI voice-over credit
    credits.push({
        role: 'Voice Synthesis',
        name: 'AI Voice-Over',
        source: 'ElevenLabs / OpenAI TTS',
        license: 'api-usage',
    })

    // Build copyright notice
    const year = new Date().getFullYear()
    const copyrightNotice = [
        `© ${year} ${params.creatorName}. All rights reserved.`,
        params.ebookLicense
            ? `Based on "${params.ebookLicense.contentTitle}" by ${params.ebookLicense.holder.name}.`
            : '',
        `Produced with TrustGen • Trust Layer Ecosystem`,
        `Verified at trustlayer.app`,
    ].filter(Boolean).join('\n')

    return {
        licenses,
        credits,
        warnings,
        compliant: warnings.filter(w => w.severity === 'critical').length === 0,
        copyrightNotice,
    }
}

/**
 * Generate credits text for end of video.
 */
export function formatCreditsText(credits: CreditEntry[]): string {
    return credits
        .map(c => `${c.role}: ${c.name}${c.source ? ` (${c.source})` : ''}`)
        .join('\n')
}

// ── DMCA / Takedown ──

export interface DMCARequest {
    contentHash: string
    hallmarkId: string
    claimantName: string
    claimantEmail: string
    reason: string
    originalContentUrl: string
}

/**
 * Submit a DMCA takedown request.
 */
export async function submitDMCA(request: DMCARequest): Promise<{ ticketId: string; status: string }> {
    const res = await fetch('/api/copyright/dmca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
    })
    if (!res.ok) throw new Error('DMCA submission failed')
    return await res.json()
}

/**
 * Check if content has been flagged for copyright violation.
 */
export async function checkContentStatus(contentHash: string): Promise<{
    flagged: boolean; reason?: string; ticketId?: string
}> {
    try {
        const res = await fetch(`/api/copyright/status/${contentHash}`)
        if (!res.ok) return { flagged: false }
        return await res.json()
    } catch {
        return { flagged: false }
    }
}

// ── dwtl.io Integration ──

/**
 * Verify content ownership through dwtl.io (TrustBook's domain).
 */
export async function verifyDWTLOwnership(params: {
    ebookId: string
    authorId: string
}): Promise<{ verified: boolean; license?: ContentLicense }> {
    try {
        const res = await fetch('/api/copyright/dwtl-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        })
        if (!res.ok) return { verified: false }
        return await res.json()
    } catch {
        return { verified: false }
    }
}
