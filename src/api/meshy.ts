/* ====== TrustGen — Meshy.ai API Client ====== */
/* Text-to-3D and Image-to-3D integration */

const BASE_URL = 'https://api.meshy.ai'

// ── API Key Management (localStorage) ──
export function getApiKey(): string {
    return localStorage.getItem('trustgen-meshy-api-key') || ''
}

export function setApiKey(key: string) {
    localStorage.setItem('trustgen-meshy-api-key', key)
}

function authHeaders(): Record<string, string> {
    const key = getApiKey()
    if (!key) throw new Error('Meshy API key not set')
    return {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
    }
}

// ── Types ──
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'SUCCEEDED' | 'FAILED' | 'EXPIRED'

export interface MeshyTask {
    id: string
    status: TaskStatus
    progress: number
    model_urls?: {
        glb?: string
        fbx?: string
        obj?: string
        usdz?: string
    }
    thumbnail_url?: string
    prompt?: string
    created_at?: number
    finished_at?: number
    task_error?: { message?: string }
}

export interface TextTo3DParams {
    prompt: string
    mode: 'preview' | 'refine'
    negative_prompt?: string
    art_style?: 'realistic' | 'sculpture'
    ai_model?: string
    topology?: 'quad' | 'triangle'
    target_polycount?: number
    should_remesh?: boolean
    preview_task_id?: string // required for refine mode
}

export interface ImageTo3DParams {
    image_url: string // public URL or data:image/... base64
    ai_model?: string
    topology?: 'quad' | 'triangle'
    target_polycount?: number
    should_remesh?: boolean
}

export interface TextToTextureParams {
    model_url: string       // GLB URL of the model to texture
    object_prompt: string   // what the object is
    style_prompt: string    // desired texture style
    negative_prompt?: string
    art_style?: 'realistic' | 'fake-3d-cartoon' | 'japanese-anime' | 'cartoon-line-art' | 'realistic-hand-drawn' | 'oriental-comic-ink'
    resolution?: '1024' | '2048' | '4096'
}

// ── Text-to-3D ──
export async function createTextTo3D(params: TextTo3DParams): Promise<string> {
    const res = await fetch(`${BASE_URL}/openapi/v2/text-to-3d`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(params),
    })
    if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`Text-to-3D failed (${res.status}): ${errBody}`)
    }
    const data = await res.json()
    return data.result // task ID
}

// ── Image-to-3D ──
export async function createImageTo3D(params: ImageTo3DParams): Promise<string> {
    const res = await fetch(`${BASE_URL}/openapi/v1/image-to-3d`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(params),
    })
    if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`Image-to-3D failed (${res.status}): ${errBody}`)
    }
    const data = await res.json()
    return data.result // task ID
}

// ── Text-to-Texture ──
export async function createTextToTexture(params: TextToTextureParams): Promise<string> {
    const res = await fetch(`${BASE_URL}/openapi/v1/text-to-texture`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(params),
    })
    if (!res.ok) {
        const errBody = await res.text()
        throw new Error(`Text-to-Texture failed (${res.status}): ${errBody}`)
    }
    const data = await res.json()
    return data.result
}

export async function getTextToTextureTask(taskId: string): Promise<MeshyTask> {
    const res = await fetch(`${BASE_URL}/openapi/v1/text-to-texture/${taskId}`, {
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch task: ${res.status}`)
    return res.json()
}

// ── Poll task status ──
export async function getTextTo3DTask(taskId: string): Promise<MeshyTask> {
    const res = await fetch(`${BASE_URL}/openapi/v2/text-to-3d/${taskId}`, {
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch task: ${res.status}`)
    return res.json()
}

export async function getImageTo3DTask(taskId: string): Promise<MeshyTask> {
    const res = await fetch(`${BASE_URL}/openapi/v1/image-to-3d/${taskId}`, {
        headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch task: ${res.status}`)
    return res.json()
}

// ── Helper: Poll until done ──
export function pollTask(
    taskId: string,
    type: 'text-to-3d' | 'image-to-3d' | 'text-to-texture',
    onProgress: (task: MeshyTask) => void,
    intervalMs = 3000,
): { cancel: () => void; promise: Promise<MeshyTask> } {
    let cancelled = false

    const promise = new Promise<MeshyTask>((resolve, reject) => {
        const poll = async () => {
            if (cancelled) return reject(new Error('Cancelled'))
            try {
                let task: MeshyTask
                if (type === 'text-to-3d') task = await getTextTo3DTask(taskId)
                else if (type === 'text-to-texture') task = await getTextToTextureTask(taskId)
                else task = await getImageTo3DTask(taskId)

                onProgress(task)

                if (task.status === 'SUCCEEDED') {
                    resolve(task)
                } else if (task.status === 'FAILED' || task.status === 'EXPIRED') {
                    reject(new Error(task.task_error?.message || `Task ${task.status}`))
                } else {
                    setTimeout(poll, intervalMs)
                }
            } catch (err) {
                if (!cancelled) reject(err)
            }
        }
        poll()
    })

    return { cancel: () => { cancelled = true }, promise }
}

// ── Convert file to base64 data URI ──
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
    })
}
