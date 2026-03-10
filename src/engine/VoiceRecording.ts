/* ====== TrustGen — Voice Recording ======
 * Built-in microphone recording for narration directly in the editor.
 * Uses MediaRecorder API for browser-native audio capture.
 *
 * Features:
 * - One-click record/stop
 * - Real-time waveform visualization
 * - Trim start/end
 * - Multiple takes with best-take selection
 * - Auto-connect to lip sync engine
 * - Export as WAV or send to audio mixer
 */

// ── Types ──

export interface RecordingConfig {
    /** Sample rate in Hz */
    sampleRate: number
    /** Number of channels (1=mono, 2=stereo) */
    channels: number
    /** MIME type for recording */
    mimeType: string
    /** Max recording duration in seconds (0 = unlimited) */
    maxDuration: number
    /** Enable noise suppression */
    noiseSuppression: boolean
    /** Enable echo cancellation */
    echoCancellation: boolean
    /** Enable auto gain control */
    autoGainControl: boolean
}

export interface Recording {
    /** Unique ID */
    id: string
    /** Audio blob */
    blob: Blob
    /** Blob URL for playback */
    url: string
    /** Duration in seconds */
    duration: number
    /** Waveform data (normalized -1 to 1) */
    waveform: Float32Array
    /** Timestamp of recording */
    timestamp: number
    /** Take number */
    take: number
    /** Optional label */
    label: string
}

export interface RecorderState {
    isRecording: boolean
    isPaused: boolean
    duration: number
    audioLevel: number
    takes: Recording[]
}

// ── Default Config ──

export const DEFAULT_RECORDING_CONFIG: RecordingConfig = {
    sampleRate: 44100,
    channels: 1,
    mimeType: 'audio/webm;codecs=opus',
    maxDuration: 300, // 5 min max
    noiseSuppression: true,
    echoCancellation: true,
    autoGainControl: true,
}

// ── Recorder Class ──

export class VoiceRecorder {
    private mediaRecorder: MediaRecorder | null = null
    private audioContext: AudioContext | null = null
    private analyser: AnalyserNode | null = null
    private stream: MediaStream | null = null
    private chunks: Blob[] = []
    private startTime = 0
    private timerInterval: ReturnType<typeof setInterval> | null = null

    public state: RecorderState = {
        isRecording: false,
        isPaused: false,
        duration: 0,
        audioLevel: 0,
        takes: [],
    }

    private config: RecordingConfig
    private onStateChange?: (state: RecorderState) => void

    constructor(config: Partial<RecordingConfig> = {}, onStateChange?: (state: RecorderState) => void) {
        this.config = { ...DEFAULT_RECORDING_CONFIG, ...config }
        this.onStateChange = onStateChange
    }

    private notify() {
        this.onStateChange?.({ ...this.state })
    }

    /**
     * Request microphone access and prepare for recording.
     */
    async initialize(): Promise<boolean> {
        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: this.config.sampleRate,
                    channelCount: this.config.channels,
                    noiseSuppression: this.config.noiseSuppression,
                    echoCancellation: this.config.echoCancellation,
                    autoGainControl: this.config.autoGainControl,
                },
            })

            // Set up audio analysis for level metering
            this.audioContext = new AudioContext({ sampleRate: this.config.sampleRate })
            const source = this.audioContext.createMediaStreamSource(this.stream)
            this.analyser = this.audioContext.createAnalyser()
            this.analyser.fftSize = 256
            this.analyser.smoothingTimeConstant = 0.5
            source.connect(this.analyser)

            return true
        } catch (err) {
            console.error('Microphone access denied:', err)
            return false
        }
    }

    /**
     * Start recording.
     */
    start(): void {
        if (!this.stream || this.state.isRecording) return

        // Determine best mime type
        let mimeType = this.config.mimeType
        if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
        }

        this.mediaRecorder = new MediaRecorder(this.stream, { mimeType })
        this.chunks = []

        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.chunks.push(e.data)
        }

        this.mediaRecorder.onstop = () => {
            this.finalizeRecording()
        }

        this.mediaRecorder.start(100) // 100ms timeslice for live data
        this.startTime = Date.now()
        this.state.isRecording = true
        this.state.isPaused = false

        // Duration timer
        this.timerInterval = setInterval(() => {
            this.state.duration = (Date.now() - this.startTime) / 1000
            this.updateAudioLevel()
            this.notify()

            // Auto-stop at max duration
            if (this.config.maxDuration > 0 && this.state.duration >= this.config.maxDuration) {
                this.stop()
            }
        }, 50)

        this.notify()
    }

    /**
     * Stop recording and finalize.
     */
    stop(): void {
        if (!this.mediaRecorder || !this.state.isRecording) return

        if (this.timerInterval) {
            clearInterval(this.timerInterval)
            this.timerInterval = null
        }

        this.mediaRecorder.stop()
        this.state.isRecording = false
        this.state.isPaused = false
        this.notify()
    }

    /**
     * Pause recording.
     */
    pause(): void {
        if (this.mediaRecorder?.state === 'recording') {
            this.mediaRecorder.pause()
            this.state.isPaused = true
            this.notify()
        }
    }

    /**
     * Resume recording.
     */
    resume(): void {
        if (this.mediaRecorder?.state === 'paused') {
            this.mediaRecorder.resume()
            this.state.isPaused = false
            this.notify()
        }
    }

    private updateAudioLevel(): void {
        if (!this.analyser) return
        const data = new Uint8Array(this.analyser.frequencyBinCount)
        this.analyser.getByteTimeDomainData(data)

        let sum = 0
        for (let i = 0; i < data.length; i++) {
            const v = (data[i] - 128) / 128
            sum += v * v
        }
        this.state.audioLevel = Math.sqrt(sum / data.length)
    }

    private async finalizeRecording(): Promise<void> {
        const blob = new Blob(this.chunks, { type: this.chunks[0]?.type || 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const duration = this.state.duration

        // Generate simple waveform (downsampled)
        const waveform = await this.generateWaveform(blob)

        const recording: Recording = {
            id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            blob,
            url,
            duration,
            waveform,
            timestamp: Date.now(),
            take: this.state.takes.length + 1,
            label: `Take ${this.state.takes.length + 1}`,
        }

        this.state.takes.push(recording)
        this.state.duration = 0
        this.notify()
    }

    private async generateWaveform(blob: Blob): Promise<Float32Array> {
        try {
            const ctx = new AudioContext()
            const arrayBuffer = await blob.arrayBuffer()
            const audioBuffer = await ctx.decodeAudioData(arrayBuffer)
            const rawData = audioBuffer.getChannelData(0)

            // Downsample to ~200 points
            const samples = 200
            const blockSize = Math.floor(rawData.length / samples)
            const waveform = new Float32Array(samples)

            for (let i = 0; i < samples; i++) {
                let sum = 0
                const start = i * blockSize
                for (let j = 0; j < blockSize; j++) {
                    sum += Math.abs(rawData[start + j] || 0)
                }
                waveform[i] = sum / blockSize
            }

            ctx.close()
            return waveform
        } catch {
            return new Float32Array(200)
        }
    }

    /**
     * Delete a specific take.
     */
    deleteTake(id: string): void {
        const idx = this.state.takes.findIndex(t => t.id === id)
        if (idx >= 0) {
            URL.revokeObjectURL(this.state.takes[idx].url)
            this.state.takes.splice(idx, 1)
            this.notify()
        }
    }

    /**
     * Get the best take (longest by default, or specified by ID).
     */
    getBestTake(): Recording | null {
        if (this.state.takes.length === 0) return null
        return this.state.takes.reduce((best, t) => t.duration > best.duration ? t : best)
    }

    /**
     * Clean up resources.
     */
    destroy(): void {
        this.stop()
        for (const take of this.state.takes) {
            URL.revokeObjectURL(take.url)
        }
        this.stream?.getTracks().forEach(t => t.stop())
        this.audioContext?.close()
    }
}
