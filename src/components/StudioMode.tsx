/* ====== TrustGen — Studio Mode Toggle ======
 * Switches between Editor mode (3D viewport) and Production mode (timeline).
 * Production mode surfaces the cinematic tools: Sequencer, Script Editor,
 * Audio Mixer, and Video Render Pipeline.
 */
import { InfoBubble } from './Tooltip'

export type StudioModeType = 'editor' | 'production'

interface StudioModeToggleProps {
    mode: StudioModeType
    onToggle: (mode: StudioModeType) => void
}

export function StudioModeToggle({ mode, onToggle }: StudioModeToggleProps) {
    return (
        <div className="studio-mode-toggle">
            <button
                className={`studio-mode-btn ${mode === 'editor' ? 'active' : ''}`}
                onClick={() => onToggle('editor')}
            >
                <span className="studio-mode-icon">🎨</span>
                <span>Editor</span>
            </button>
            <button
                className={`studio-mode-btn ${mode === 'production' ? 'active' : ''}`}
                onClick={() => onToggle('production')}
            >
                <span className="studio-mode-icon">🎬</span>
                <span>Production</span>
            </button>
            <InfoBubble text="Editor mode: 3D viewport with object manipulation, materials, and rigging. Production mode: Timeline-based workflow with sequencer, audio mixer, and script editor for building complete videos." />
        </div>
    )
}

// ── Production Panel Content ──

export function ProductionPanel() {
    return (
        <div className="production-panel">
            <div className="production-section">
                <h4 className="production-section-title">
                    🎞️ Sequencer
                    <InfoBubble text="Multi-shot timeline for arranging scenes in order. Drag shots to reorder, set transition types between shots, and fine-tune duration of each." />
                </h4>
                <div className="production-placeholder">
                    <p>Shot-based timeline with transitions</p>
                    <button className="production-action-btn">Open Sequencer</button>
                </div>
            </div>

            <div className="production-section">
                <h4 className="production-section-title">
                    📝 Script Editor
                    <InfoBubble text="Write screenplays in industry-standard format. Auto-formats character names, dialogue, action lines, and scene headings. Export as PDF. Supports storyboarding with visual thumbnails per scene." />
                </h4>
                <div className="production-placeholder">
                    <p>Screenplay + storyboard editor</p>
                    <button className="production-action-btn">Open Script Editor</button>
                </div>
            </div>

            <div className="production-section">
                <h4 className="production-section-title">
                    🔊 Audio Mixer
                    <InfoBubble text="5-bus audio mixer: Narration, Dialogue, Music, SFX, Ambience. Each bus has volume, pan, mute, and solo. Supports spatial audio positioning. Connect AI voice-over directly to narration bus." />
                </h4>
                <div className="production-placeholder">
                    <p>5-bus mixer with spatial audio</p>
                    <button className="production-action-btn">Open Mixer</button>
                </div>
            </div>

            <div className="production-section">
                <h4 className="production-section-title">
                    🎙️ Voice Recording
                    <InfoBubble text="Record narration directly in the browser using your microphone. Supports pause/resume, multi-take management, waveform visualization, and best-take selection. Noise suppression and echo cancellation built in." />
                </h4>
                <div className="production-placeholder">
                    <button className="production-record-btn">
                        ⏺ Start Recording
                    </button>
                </div>
            </div>

            <div className="production-section">
                <h4 className="production-section-title">
                    📊 Video Render
                    <InfoBubble text="Render your complete timeline to video. Supports up to 4K resolution, 60fps. Uses OffscreenCanvas for background rendering. Progress bar shows frame-by-frame completion." />
                </h4>
                <div className="production-placeholder">
                    <p>4K render pipeline with export</p>
                    <button className="production-action-btn">Render Preview</button>
                    <button className="production-action-btn" style={{ marginTop: 8 }}>Render Final</button>
                </div>
            </div>
        </div>
    )
}
