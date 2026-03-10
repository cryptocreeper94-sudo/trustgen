/* ====== TrustGen — Multi-Tenant Workspace System ======
 * Proper tenant isolation for multi-user SaaS operation.
 * Each user gets their own workspace with isolated:
 * - Scenes and projects
 * - Assets (models, textures, audio)
 * - AI generation history
 * - Voice-over cache
 * - Render outputs
 * - API key configuration
 * - User preferences
 */

// ── Types ──

export interface Tenant {
    id: string
    userId: string
    name: string
    slug: string
    plan: 'free' | 'starter' | 'pro' | 'enterprise'
    /** Storage quota in MB */
    storageQuota: number
    /** Storage used in MB */
    storageUsed: number
    /** Max scenes per workspace */
    maxScenes: number
    /** Max renders per month */
    maxRenders: number
    /** Renders used this month */
    rendersUsed: number
    /** Created timestamp */
    createdAt: string
    /** API keys (encrypted references, never raw) */
    apiKeys: {
        openai: boolean
        elevenlabs: boolean
        youtube: boolean
        tiktok: boolean
    }
}

export interface Workspace {
    tenant: Tenant
    scenes: SceneMeta[]
    assets: AssetMeta[]
    renders: RenderMeta[]
    recentActivity: Activity[]
}

export interface SceneMeta {
    id: string
    name: string
    thumbnail?: string
    objectCount: number
    lastModified: string
    size: number // bytes
    template?: string
}

export interface AssetMeta {
    id: string
    name: string
    type: 'model' | 'texture' | 'audio' | 'video' | 'generated'
    size: number
    uploadedAt: string
    thumbnail?: string
}

export interface RenderMeta {
    id: string
    name: string
    resolution: string
    duration: number
    format: string
    size: number
    renderedAt: string
    hallmarkId?: string
    downloadUrl: string
}

export interface Activity {
    id: string
    type: 'scene-created' | 'scene-saved' | 'asset-uploaded' | 'render-completed' | 'voice-generated' | 'text-to-3d'
    description: string
    timestamp: string
}

// ── Plan Limits ──

export const PLAN_LIMITS: Record<Tenant['plan'], {
    storageMB: number; maxScenes: number; maxRenders: number;
    aiGenerations: number; voiceMinutes: number; label: string; price: string
}> = {
    free: { storageMB: 500, maxScenes: 3, maxRenders: 5, aiGenerations: 20, voiceMinutes: 5, label: 'Free', price: '$0' },
    starter: { storageMB: 5000, maxScenes: 20, maxRenders: 30, aiGenerations: 200, voiceMinutes: 30, label: 'Starter', price: '$9/mo' },
    pro: { storageMB: 50000, maxScenes: 100, maxRenders: 200, aiGenerations: 1000, voiceMinutes: 180, label: 'Pro', price: '$29/mo' },
    enterprise: { storageMB: 500000, maxScenes: 9999, maxRenders: 9999, aiGenerations: 9999, voiceMinutes: 9999, label: 'Enterprise', price: 'Custom' },
}

// ── API Client ──

/**
 * Fetch the current user's workspace data.
 */
export async function fetchWorkspace(): Promise<Workspace> {
    const res = await fetch('/api/workspace', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    })
    if (!res.ok) throw new Error('Failed to fetch workspace')
    return await res.json()
}

/**
 * Fetch tenant info.
 */
export async function fetchTenant(): Promise<Tenant> {
    const res = await fetch('/api/workspace/tenant', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    })
    if (!res.ok) throw new Error('Failed to fetch tenant')
    return await res.json()
}

/**
 * List all scenes in the workspace.
 */
export async function listScenes(): Promise<SceneMeta[]> {
    const res = await fetch('/api/workspace/scenes', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    })
    if (!res.ok) throw new Error('Failed to list scenes')
    return (await res.json()).scenes
}

/**
 * List all assets in the workspace.
 */
export async function listAssets(): Promise<AssetMeta[]> {
    const res = await fetch('/api/workspace/assets', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    })
    if (!res.ok) throw new Error('Failed to list assets')
    return (await res.json()).assets
}

/**
 * List all renders in the workspace.
 */
export async function listRenders(): Promise<RenderMeta[]> {
    const res = await fetch('/api/workspace/renders', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    })
    if (!res.ok) throw new Error('Failed to list renders')
    return (await res.json()).renders
}

/**
 * Check if a plan limit has been reached.
 */
export function checkLimit(tenant: Tenant, resource: 'scenes' | 'renders' | 'storage'): {
    allowed: boolean; used: number; max: number; percentage: number
} {
    const limits = PLAN_LIMITS[tenant.plan]
    switch (resource) {
        case 'scenes':
            return { allowed: tenant.maxScenes > 0, used: 0, max: limits.maxScenes, percentage: 0 }
        case 'renders':
            return { allowed: tenant.rendersUsed < limits.maxRenders, used: tenant.rendersUsed, max: limits.maxRenders, percentage: (tenant.rendersUsed / limits.maxRenders) * 100 }
        case 'storage':
            return { allowed: tenant.storageUsed < limits.storageMB, used: tenant.storageUsed, max: limits.storageMB, percentage: (tenant.storageUsed / limits.storageMB) * 100 }
    }
}

/**
 * Format storage size for display.
 */
export function formatStorage(mb: number): string {
    if (mb < 1024) return `${Math.round(mb)} MB`
    return `${(mb / 1024).toFixed(1)} GB`
}
