/* ====== TrustGen — AI Mega Panel ======
 * Unified carousel of ALL AI-powered tools:
 * - Text-to-3D (existing + local engine)
 * - Voice-Over (ElevenLabs + OpenAI)
 * - Character Creator
 * - Story Mode (ebook-to-documentary)
 * - Scene Director
 * - Auto-Cut
 * - Lip Sync
 */
import { useState } from 'react'
import { TextTo3DStudio } from './TextTo3DStudio'
import { LumeStudioPanel } from './LumeStudioPanel'
import { InfoBubble } from './Tooltip'
import { useStoryStore } from '../stores/storyStore'

// ── Sub-panel definitions ──

interface AISubPanel {
    id: string
    label: string
    icon: string
    description: string
    /** Image for the card */
    image: string
}

const AI_PANELS: AISubPanel[] = [
    { id: 'text-to-3d', label: 'Text to 3D', icon: '🧊', description: 'Generate 3D objects from text descriptions', image: '/images/cards/card-text-to-3d.png' },
    { id: 'lume-to-3d', label: 'Lume Studio', icon: '⚡', description: 'Write Lume code → Generate 3D scenes', image: '/images/cards/card-text-to-3d.png' },
    { id: 'voice-over', label: 'Voice-Over', icon: '🎙️', description: 'AI narration with ElevenLabs & OpenAI', image: '/images/cards/card-voice-over.png' },
    { id: 'character', label: 'Characters', icon: '👤', description: 'Procedural character creator with presets', image: '/images/cards/card-character-creator.png' },
    { id: 'story-mode', label: 'Story Mode', icon: '📖', description: 'Paste text → animated documentary', image: '/images/cards/card-story-mode.png' },
    { id: 'scene-director', label: 'Scene Director', icon: '🎬', description: 'Auto-compose scenes from descriptions', image: '/images/cards/card-text-to-3d.png' },
    { id: 'auto-cut', label: 'Smart Edit', icon: '✂️', description: 'AI-powered pacing and edit suggestions', image: '/images/cards/card-text-to-3d.png' },
    { id: 'lip-sync', label: 'Lip Sync', icon: '👄', description: 'Auto mouth shapes from audio/text', image: '/images/cards/card-voice-over.png' },
]

// ── Sub-panel Content Components ──

function VoiceOverPanel() {
    const [text, setText] = useState('')
    const [voice, setVoice] = useState('narrator')
    const [emotion, setEmotion] = useState('neutral')

    const VOICES = ['narrator', 'male-deep', 'male-warm', 'female-clear', 'female-warm', 'child', 'elder', 'robot', 'whisper']
    const EMOTIONS = ['neutral', 'excited', 'serious', 'warm', 'dramatic', 'sad', 'angry', 'cheerful']

    return (
        <div className="ai-sub-content">
            <div className="ai-sub-row">
                <label>Script</label>
                <textarea
                    value={text}
                    onChange={e => setText(e.target.value)}
                    placeholder="Enter narration text..."
                    rows={4}
                    className="ai-textarea"
                />
            </div>
            <div className="ai-sub-row">
                <label>Voice <InfoBubble text="9 voice presets. Narrator uses ElevenLabs for natural speech. Robot uses synthesis. All others blend between providers." /></label>
                <select value={voice} onChange={e => setVoice(e.target.value)} className="ai-select">
                    {VOICES.map(v => <option key={v} value={v}>{v.replace(/-/g, ' ')}</option>)}
                </select>
            </div>
            <div className="ai-sub-row">
                <label>Emotion <InfoBubble text="Emotions adjust pitch, speed, and emphasis. Dramatic adds pauses. Excited increases tempo. Sad softens volume." /></label>
                <select value={emotion} onChange={e => setEmotion(e.target.value)} className="ai-select">
                    {EMOTIONS.map(e => <option key={e} value={e}>{e}</option>)}
                </select>
            </div>
            <button className="ai-generate-btn" disabled={!text.trim()}>
                🎙️ Generate Voice-Over
            </button>
        </div>
    )
}

function CharacterPanel() {
    const [preset, setPreset] = useState('business')
    const PRESETS = ['business', 'casual', 'formal', 'athletic', 'creative', 'default']

    return (
        <div className="ai-sub-content">
            <div className="ai-sub-row">
                <label>Preset <InfoBubble text="Start with a preset and customize. Each preset sets body type, clothing, hair, and accessories. You can modify individual properties after." /></label>
                <div className="ai-preset-grid">
                    {PRESETS.map(p => (
                        <button
                            key={p}
                            className={`ai-preset-btn ${preset === p ? 'active' : ''}`}
                            onClick={() => setPreset(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
            <button className="ai-generate-btn">
                👤 Generate Character
            </button>
        </div>
    )
}

function StoryModePanel() {
    const {
        text, style, title, status, progress, error, summary, shots,
        setText, setStyle, setTitle, generateDocumentary, reset,
    } = useStoryStore()

    const STYLES = ['documentary', 'explainer', 'dramatic', 'educational', 'cinematic'] as const
    const wordCount = text.split(/\s+/).filter(Boolean).length
    const isGenerating = status !== 'idle' && status !== 'ready' && status !== 'done' && status !== 'error'

    return (
        <div className="ai-sub-content">
            {status === 'ready' || status === 'done' ? (
                /* ── Results View ── */
                <div className="ai-story-results">
                    <div className="ai-story-summary">{summary}</div>
                    <div className="ai-story-shots">
                        {shots.map((s, i) => (
                            <div key={s.id} className="ai-story-shot">
                                <span className="ai-story-shot-idx">{i + 1}</span>
                                <span className="ai-story-shot-name">{s.name}</span>
                                <span className="ai-story-shot-dur">{Math.ceil(s.duration)}s</span>
                            </div>
                        ))}
                    </div>
                    <div className="ai-story-actions">
                        <button className="ai-generate-btn" onClick={reset}>
                            ↩ New Documentary
                        </button>
                    </div>
                </div>
            ) : (
                /* ── Input View ── */
                <>
                    <div className="ai-sub-row">
                        <label>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="My Documentary"
                            className="ai-input"
                        />
                    </div>
                    <div className="ai-sub-row">
                        <label>Story Text <InfoBubble text="Paste ebook chapters, articles, or scripts. Story Mode auto-splits text into scenes, selects environments, places cameras, and estimates narration duration. Connect TrustBook to import directly." /></label>
                        <textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder="Paste your ebook text, article, or script here..."
                            rows={6}
                            className="ai-textarea"
                            disabled={isGenerating}
                        />
                        <div className="ai-word-count">
                            {wordCount} words • ~{Math.ceil(wordCount / 150)} min narration • ~{Math.ceil(text.split(/\n\s*\n/).filter(p => p.trim()).length)} scenes
                        </div>
                    </div>
                    <div className="ai-sub-row">
                        <label>Style</label>
                        <div className="ai-preset-grid">
                            {STYLES.map(s => (
                                <button
                                    key={s}
                                    className={`ai-preset-btn ${style === s ? 'active' : ''}`}
                                    onClick={() => setStyle(s)}
                                    disabled={isGenerating}
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Progress Bar */}
                    {isGenerating && (
                        <div className="ai-story-progress">
                            <div className="ai-story-progress-bar">
                                <div
                                    className="ai-story-progress-fill"
                                    style={{ width: `${progress.percent}%` }}
                                />
                            </div>
                            <div className="ai-story-progress-label">{progress.label}</div>
                        </div>
                    )}

                    {/* Error */}
                    {error && <div className="ai-story-error">⚠️ {error}</div>}

                    <button
                        className="ai-generate-btn"
                        disabled={wordCount < 10 || isGenerating}
                        onClick={generateDocumentary}
                    >
                        {isGenerating ? '⏳ Generating...' : '📖 Generate Documentary'}
                    </button>
                </>
            )}
        </div>
    )
}

function SceneDirectorPanel() {
    const [description, setDescription] = useState('')

    return (
        <div className="ai-sub-content">
            <div className="ai-sub-row">
                <label>Scene Description <InfoBubble text="Describe a scene in natural language. The AI Director picks the best environment, camera angle, lighting, and places characters/props automatically." /></label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="E.g., 'A business meeting in a modern office, two people facing each other, warm overhead lighting'"
                    rows={4}
                    className="ai-textarea"
                />
            </div>
            <button className="ai-generate-btn" disabled={!description.trim()}>
                🎬 Direct Scene
            </button>
        </div>
    )
}

function AutoCutPanel() {
    const [pacing, setPacing] = useState('medium')
    const PACING = ['fast', 'medium', 'slow', 'dynamic']

    return (
        <div className="ai-sub-content">
            <div className="ai-sub-row">
                <label>Pacing <InfoBubble text="Fast = 1.5-4s shots (social media). Medium = 3-8s (standard). Slow = 5-15s (documentary). Dynamic = AI varies automatically." /></label>
                <div className="ai-preset-grid">
                    {PACING.map(p => (
                        <button
                            key={p}
                            className={`ai-preset-btn ${pacing === p ? 'active' : ''}`}
                            onClick={() => setPacing(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>
            <button className="ai-generate-btn">
                ✂️ Generate Edit Plan
            </button>
        </div>
    )
}

function LipSyncPanel() {
    return (
        <div className="ai-sub-content">
            <div className="ai-sub-row">
                <label>Lip Sync <InfoBubble text="Analyzes audio or text and generates 14 viseme mouth shapes in real time. Works with recorded narration or AI voice-over." /></label>
                <p className="ai-sub-desc">
                    Select a character in the viewport, then attach audio or voice-over to auto-generate mouth movements.
                </p>
            </div>
            <button className="ai-generate-btn">
                👄 Sync from Audio
            </button>
            <button className="ai-generate-btn" style={{ marginTop: 8 }}>
                📝 Sync from Text
            </button>
        </div>
    )
}

// ── Main AI Mega Panel ──

export function AIMegaPanel() {
    const [activePanel, setActivePanel] = useState('text-to-3d')

    const handleGenerate = (type: string, config: any) => {
        const event = new CustomEvent('trustgen:generate', { detail: { type, config } })
        window.dispatchEvent(event)
    }

    const renderSubPanel = () => {
        switch (activePanel) {
            case 'text-to-3d': return <TextTo3DStudio onGenerate={handleGenerate} />
            case 'lume-to-3d': return <LumeStudioPanel />
            case 'voice-over': return <VoiceOverPanel />
            case 'character': return <CharacterPanel />
            case 'story-mode': return <StoryModePanel />
            case 'scene-director': return <SceneDirectorPanel />
            case 'auto-cut': return <AutoCutPanel />
            case 'lip-sync': return <LipSyncPanel />
            default: return <TextTo3DStudio onGenerate={handleGenerate} />
        }
    }

    return (
        <div className="ai-mega-panel">
            {/* Carousel navigation */}
            <div className="ai-mega-carousel">
                {AI_PANELS.map(panel => (
                    <button
                        key={panel.id}
                        className={`ai-mega-card ${activePanel === panel.id ? 'active' : ''}`}
                        onClick={() => setActivePanel(panel.id)}
                        title={panel.description}
                    >
                        <div className="ai-mega-card-img">
                            <img
                                src={panel.image}
                                alt={panel.label}
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none'
                                }}
                            />
                        </div>
                        <span className="ai-mega-card-label">{panel.label}</span>
                    </button>
                ))}
            </div>

            {/* Active sub-panel */}
            <div className="ai-mega-content">
                {renderSubPanel()}
            </div>
        </div>
    )
}
