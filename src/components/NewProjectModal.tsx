/* ====== TrustGen — New Project Modal ======
 * Entry flow for Story Mode + project templates.
 * This is the first thing a user sees when they click "New Project".
 * Makes Story Mode and templates immediately discoverable.
 */
import { useState } from 'react'
import { PROJECT_TEMPLATES, type ProjectTemplate } from '../engine/ProjectTemplates'
import { IMAGE_ASSETS } from '../engine/ImageAssets'
import { InfoBubble } from './Tooltip'
import { useStoryStore } from '../stores/storyStore'

interface NewProjectModalProps {
    open: boolean
    onClose: () => void
    onSelectTemplate: (template: ProjectTemplate) => void
    onStartStoryMode: (text: string, style: string) => void
    onStartBlank: () => void
}

type ModalView = 'choose' | 'templates' | 'story-mode'

export function NewProjectModal({ open, onClose, onSelectTemplate, onStartStoryMode, onStartBlank }: NewProjectModalProps) {
    const [view, setView] = useState<ModalView>('choose')
    const { text: storyText, style: storyStyle, setText: setStoryText, setStyle, setTitle, generateDocumentary } = useStoryStore()
    const setStoryStyle = (s: string) => setStyle(s as any)

    if (!open) return null

    const STYLES = ['documentary', 'explainer', 'dramatic', 'educational', 'cinematic']

    return (
        <div className="newproject-overlay" onClick={onClose}>
            <div className="newproject-modal" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="newproject-header">
                    <h2>New Project</h2>
                    <button className="newproject-close" onClick={onClose}>✕</button>
                </div>

                {/* ── Choose Mode ── */}
                {view === 'choose' && (
                    <div className="newproject-choose">
                        <div className="newproject-option" onClick={onStartBlank}>
                            <div className="newproject-option-icon">🎨</div>
                            <h3>Blank Canvas</h3>
                            <p>Start from scratch in the 3D editor</p>
                        </div>
                        <div className="newproject-option" onClick={() => setView('templates')}>
                            <div className="newproject-option-img">
                                <img
                                    src="/images/cards/template-documentary.png"
                                    alt="Templates"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                            </div>
                            <h3>From Template</h3>
                            <p>10 production-ready presets</p>
                        </div>
                        <div className="newproject-option highlight" onClick={() => setView('story-mode')}>
                            <div className="newproject-option-img">
                                <img
                                    src="/images/cards/card-story-mode.png"
                                    alt="Story Mode"
                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                />
                            </div>
                            <h3>Story Mode ✨</h3>
                            <p>Paste text → auto-generate a documentary</p>
                            <span className="newproject-badge">Recommended</span>
                        </div>
                    </div>
                )}

                {/* ── Template Selection ── */}
                {view === 'templates' && (
                    <div className="newproject-templates">
                        <button className="newproject-back" onClick={() => setView('choose')}>← Back</button>
                        <div className="newproject-template-grid">
                            {PROJECT_TEMPLATES.map(t => {
                                const asset = IMAGE_ASSETS.templates[t.id as keyof typeof IMAGE_ASSETS.templates]
                                return (
                                    <button
                                        key={t.id}
                                        className="newproject-template-card"
                                        onClick={() => onSelectTemplate(t)}
                                    >
                                        <div className="newproject-template-img">
                                            {asset && (
                                                <img
                                                    src={asset.src}
                                                    alt={t.name}
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                                />
                                            )}
                                        </div>
                                        <div className="newproject-template-info">
                                            <h4>{t.name}</h4>
                                            <span className="newproject-template-cat">{t.category}</span>
                                            <span className="newproject-template-res">{t.resolution.width}×{t.resolution.height}</span>
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* ── Story Mode ── */}
                {view === 'story-mode' && (
                    <div className="newproject-story">
                        <button className="newproject-back" onClick={() => setView('choose')}>← Back</button>
                        <div className="newproject-story-header">
                            <h3>📖 Story Mode</h3>
                            <InfoBubble text="Paste ebook chapters, articles, or any text. Story Mode auto-analyzes content, creates scenes, selects environments, sets up cameras, and estimates narration duration. Connect TrustBook to import directly from your published ebooks." />
                        </div>
                        <textarea
                            value={storyText}
                            onChange={e => setStoryText(e.target.value)}
                            placeholder="Paste your story, ebook chapter, article, or script here...&#10;&#10;The more text you provide, the more scenes will be generated.&#10;Each paragraph roughly equals one scene."
                            rows={10}
                            className="newproject-story-textarea"
                            autoFocus
                        />
                        <div className="newproject-story-stats">
                            <span>{storyText.split(/\s+/).filter(Boolean).length} words</span>
                            <span>~{Math.ceil(storyText.split(/\s+/).filter(Boolean).length / 150)} min narration</span>
                            <span>~{Math.ceil(storyText.split(/\n\s*\n/).filter(p => p.trim()).length)} scenes</span>
                        </div>
                        <div className="newproject-story-style">
                            <label>Style</label>
                            <div className="newproject-style-grid">
                                {STYLES.map(s => (
                                    <button
                                        key={s}
                                        className={`newproject-style-btn ${storyStyle === s ? 'active' : ''}`}
                                        onClick={() => setStoryStyle(s)}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="newproject-story-actions">
                            <button
                                className="newproject-story-import"
                                title="Import from your TrustBook library"
                            >
                                📚 Import from TrustBook
                            </button>
                            <button
                                className="newproject-story-generate"
                                disabled={storyText.split(/\s+/).filter(Boolean).length < 10}
                                onClick={() => {
                                    setTitle('Documentary')
                                    generateDocumentary()
                                    onStartStoryMode(storyText, storyStyle)
                                }}
                            >
                                🎬 Generate Documentary
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
