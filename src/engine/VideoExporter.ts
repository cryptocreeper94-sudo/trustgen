/* ====== TrustGen — Video Exporter ======
 * Captures the Three.js <canvas> element as a WebM video
 * using the browser-native MediaRecorder API.
 *
 * Usage:
 *   const exporter = new VideoExporter()
 *   exporter.start(canvas, totalDuration, onProgress)
 *   // ... playback runs for totalDuration ...
 *   // auto-stops and triggers download
 */

export type ExportStatus = 'idle' | 'recording' | 'processing' | 'done' | 'error'

export interface ExportProgress {
    status: ExportStatus
    percent: number
    label: string
}

export class VideoExporter {
    private recorder: MediaRecorder | null = null
    private chunks: Blob[] = []
    private startTime = 0
    private duration = 0
    private progressCallback: ((p: ExportProgress) => void) | null = null
    private progressInterval: ReturnType<typeof setInterval> | null = null

    /**
     * Start recording the canvas.
     * @param canvas - The HTMLCanvasElement to capture
     * @param totalDuration - Expected duration in seconds
     * @param onProgress - Progress callback
     * @param fps - Frames per second (default 30)
     * @returns Promise that resolves when recording is complete
     */
    start(
        canvas: HTMLCanvasElement,
        totalDuration: number,
        onProgress?: (p: ExportProgress) => void,
        fps = 30
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                this.duration = totalDuration
                this.progressCallback = onProgress || null
                this.chunks = []

                // Create media stream from canvas
                const stream = canvas.captureStream(fps)

                // Pick the best available codec
                const mimeType = this.getBestMimeType()
                if (!mimeType) {
                    reject(new Error('No supported video codec found in this browser'))
                    return
                }

                this.recorder = new MediaRecorder(stream, {
                    mimeType,
                    videoBitsPerSecond: 8_000_000, // 8 Mbps for good quality
                })

                this.recorder.ondataavailable = (e) => {
                    if (e.data.size > 0) {
                        this.chunks.push(e.data)
                    }
                }

                this.recorder.onstop = () => {
                    this.clearProgressInterval()
                    this.report({ status: 'processing', percent: 95, label: 'Processing video...' })

                    const blob = new Blob(this.chunks, { type: mimeType })
                    const url = URL.createObjectURL(blob)

                    this.report({ status: 'done', percent: 100, label: 'Export complete!' })
                    resolve(url)
                }

                this.recorder.onerror = (e: any) => {
                    this.clearProgressInterval()
                    this.report({ status: 'error', percent: 0, label: `Recording error: ${e.error?.message || 'Unknown'}` })
                    reject(e.error || new Error('Recording failed'))
                }

                // Start recording
                this.recorder.start(100) // collect data every 100ms
                this.startTime = performance.now()
                this.report({ status: 'recording', percent: 0, label: 'Recording started...' })

                // Progress updates
                this.progressInterval = setInterval(() => {
                    const elapsed = (performance.now() - this.startTime) / 1000
                    const pct = Math.min(90, (elapsed / this.duration) * 90)
                    this.report({
                        status: 'recording',
                        percent: Math.round(pct),
                        label: `Recording... ${Math.floor(elapsed)}s / ${Math.ceil(this.duration)}s`,
                    })
                }, 250)

                // Auto-stop after duration + small buffer
                setTimeout(() => {
                    this.stop()
                }, (totalDuration + 0.5) * 1000)

            } catch (err: any) {
                this.report({ status: 'error', percent: 0, label: err.message })
                reject(err)
            }
        })
    }

    /** Stop recording early */
    stop() {
        if (this.recorder && this.recorder.state === 'recording') {
            this.recorder.stop()
        }
    }

    /** Trigger a file download from a blob URL */
    static download(blobUrl: string, filename?: string) {
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = filename || `trustgen-documentary-${Date.now()}.webm`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    private getBestMimeType(): string | null {
        const candidates = [
            'video/webm;codecs=vp9',
            'video/webm;codecs=vp8',
            'video/webm',
            'video/mp4',
        ]
        for (const mime of candidates) {
            if (MediaRecorder.isTypeSupported(mime)) return mime
        }
        return null
    }

    private report(p: ExportProgress) {
        this.progressCallback?.(p)
    }

    private clearProgressInterval() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval)
            this.progressInterval = null
        }
    }
}
