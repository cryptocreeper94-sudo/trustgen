/* ====== TrustGen — Meshy.ai API Client ====== */
/* DEPRECATED: All generation is now handled in-house by the procedural engine. */
/* This file is kept as a stub for backward compatibility. */

// No-op stubs — Meshy has been fully replaced by in-house procedural generation
export function getApiKey(): string { return '' }
export function setApiKey(_key: string): void { /* no-op */ }
export function fileToBase64(_file: File): Promise<string> { return Promise.resolve('') }

export interface MeshyTask {
    id: string
    status: 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'
    progress: number
    model_urls?: { glb?: string; obj?: string; fbx?: string }
    thumbnail_url?: string
    texture_urls?: { base_color?: string }
}

export async function createTextTo3D(): Promise<string> { throw new Error('Meshy is deprecated — use in-house procedural generator') }
export async function createImageTo3D(): Promise<string> { throw new Error('Meshy is deprecated — use in-house procedural generator') }
export async function createTextToTexture(): Promise<string> { throw new Error('Meshy is deprecated — use in-house procedural generator') }
export async function getTextToTextureTask(_taskId: string): Promise<MeshyTask> { throw new Error('Meshy is deprecated') }
export async function getTextTo3DTask(_taskId: string): Promise<MeshyTask> { throw new Error('Meshy is deprecated') }
export async function getImageTo3DTask(_taskId: string): Promise<MeshyTask> { throw new Error('Meshy is deprecated') }
export function pollTask(): { cancel: () => void; promise: Promise<MeshyTask> } {
    return { cancel: () => { }, promise: Promise.reject(new Error('Meshy is deprecated')) }
}
