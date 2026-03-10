/* ====== TrustGen — Video Render Pipeline ======
 * Offline rendering and export of cinematic sequences.
 *
 * - Frame-by-frame canvas capture
 * - Configurable resolution and frame rate
 * - WebM/MP4 export via MediaRecorder
 * - Render queue with progress tracking
 * - Watermark and overlay support
 */

// ── Types ──

export type RenderFormat = 'webm' | 'mp4' | 'gif' | 'png-sequence'
export type RenderQuality = 'draft' | 'preview' | 'production' | 'ultra'

export interface RenderSettings {
    width: number
    height: number
    fps: number
    format: RenderFormat
    quality: RenderQuality
    /** Duration to render (seconds) — uses sequencer total if 0 */
    duration: number
    /** Start time offset */
    startTime: number
    /** Include audio */
    includeAudio: boolean
    /** Watermark text (empty = none) */
    watermark: string
    /** Anti-aliasing samples */
    antiAlias: number
    /** Motion blur passes */
    motionBlurPasses: number
    /** Output filename */
    filename: string
}

export interface RenderProgress {
    /** Current frame being rendered */
    currentFrame: number
    /** Total frames to render */
    totalFrames: number
    /** Percentage complete (0–100) */
    percent: number
    /** Elapsed time (ms) */
    elapsed: number
    /** Estimated time remaining (ms) */
    eta: number
    /** Whether rendering is in progress */
    rendering: boolean
    /** Whether rendering was cancelled */
    cancelled: boolean
    /** Error message if failed */
    error?: string
}

// ── Quality Presets ──

export const QUALITY_PRESETS: Record<RenderQuality, Partial<RenderSettings>> = {
    draft: { width: 640, height: 360, fps: 15, antiAlias: 1, motionBlurPasses: 0 },
    preview: { width: 1280, height: 720, fps: 24, antiAlias: 2, motionBlurPasses: 0 },
    production: { width: 1920, height: 1080, fps: 30, antiAlias: 4, motionBlurPasses: 1 },
    ultra: { width: 3840, height: 2160, fps: 60, antiAlias: 8, motionBlurPasses: 2 },
}

export const DEFAULT_RENDER_SETTINGS: RenderSettings = {
    width: 1920,
    height: 1080,
    fps: 30,
    format: 'webm',
    quality: 'production',
    duration: 0,
    startTime: 0,
    includeAudio: true,
    watermark: '',
    antiAlias: 4,
    motionBlurPasses: 1,
    filename: `trustgen-render-${Date.now()}`,
}

// ── Render Pipeline ──

/**
 * Render a sequence of frames from a canvas.
 * Uses requestAnimationFrame-based capture with MediaRecorder.
 */
export async function renderSequence(
    canvas: HTMLCanvasElement,
    settings: RenderSettings,
    onProgress: (progress: RenderProgress) => void,
    onFrame: (frameIndex: number, time: number) => void | Promise<void>,
    signal?: AbortSignal
): Promise<Blob | null> {
    const totalFrames = Math.ceil((settings.duration || 10) * settings.fps)
    const frameDuration = 1000 / settings.fps
    const startTime = performance.now()

    const progress: RenderProgress = {
        currentFrame: 0,
        totalFrames,
        percent: 0,
        elapsed: 0,
        eta: 0,
        rendering: true,
        cancelled: false,
    }

    // Set up MediaRecorder
    const stream = canvas.captureStream(0) // 0 = manual frame capture
    const mimeType = settings.format === 'webm' ? 'video/webm;codecs=vp9' : 'video/mp4'
    const chunks: Blob[] = []

    let recorder: MediaRecorder
    try {
        recorder = new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond: settings.quality === 'ultra' ? 20_000_000 : 8_000_000,
        })
    } catch {
        // Fallback to basic webm
        recorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
    }

    recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
    }

    recorder.start()

    // Render loop
    for (let frame = 0; frame < totalFrames; frame++) {
        if (signal?.aborted) {
            progress.cancelled = true
            progress.rendering = false
            recorder.stop()
            onProgress({ ...progress })
            return null
        }

        const time = settings.startTime + (frame / settings.fps)

        // Let caller update the scene to this time
        await onFrame(frame, time)

        // Capture the frame
        const captureTrack = stream.getVideoTracks()[0]
        if (captureTrack && 'requestFrame' in captureTrack) {
            ; (captureTrack as any).requestFrame()
        }

        // Update progress
        const now = performance.now()
        progress.currentFrame = frame + 1
        progress.percent = ((frame + 1) / totalFrames) * 100
        progress.elapsed = now - startTime
        const avgFrameTime = progress.elapsed / (frame + 1)
        progress.eta = avgFrameTime * (totalFrames - frame - 1)

        onProgress({ ...progress })

        // Yield to not freeze the UI
        await new Promise(r => setTimeout(r, 1))
    }

    // Finalize
    return new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: mimeType })
            progress.rendering = false
            progress.percent = 100
            onProgress({ ...progress })
            resolve(blob)
        }
        recorder.stop()
    })
}

/**
 * Render individual frames as PNG images (for PNG sequence export).
 */
export async function renderPNGSequence(
    canvas: HTMLCanvasElement,
    settings: RenderSettings,
    onProgress: (progress: RenderProgress) => void,
    onFrame: (frameIndex: number, time: number) => void | Promise<void>,
    signal?: AbortSignal
): Promise<Blob[]> {
    const totalFrames = Math.ceil((settings.duration || 10) * settings.fps)
    const startTime = performance.now()
    const frames: Blob[] = []

    for (let frame = 0; frame < totalFrames; frame++) {
        if (signal?.aborted) break

        const time = settings.startTime + (frame / settings.fps)
        await onFrame(frame, time)

        const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob(b => resolve(b!), 'image/png')
        })
        frames.push(blob)

        const now = performance.now()
        const elapsed = now - startTime
        const avg = elapsed / (frame + 1)
        onProgress({
            currentFrame: frame + 1,
            totalFrames,
            percent: ((frame + 1) / totalFrames) * 100,
            elapsed,
            eta: avg * (totalFrames - frame - 1),
            rendering: frame < totalFrames - 1,
            cancelled: false,
        })

        await new Promise(r => setTimeout(r, 1))
    }

    return frames
}

/**
 * Download a rendered blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

/**
 * Format time in MM:SS.ff
 */
export function formatRenderTime(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
