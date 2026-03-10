/* ====== TrustGen — Publish Tab ======
 * Unified publishing panel: social export, platform upload, blockchain proof
 * Replaces the export-heavy section of the old Export tab.
 */
import React, { useState } from 'react'
import { InfoBubble } from './Tooltip'
import { SOCIAL_PRESETS, type SocialPlatform } from '../engine/SocialExport'
import { PLATFORMS, type UploadPlatform } from '../engine/PlatformUpload'
import { IMAGE_ASSETS } from '../engine/ImageAssets'

type PublishSection = 'format' | 'upload' | 'proof'

export function PublishTab() {
    const [activeSection, setActiveSection] = useState<PublishSection>('format')
    const [selectedPreset, setSelectedPreset] = useState<SocialPlatform>('youtube')
    const [selectedPlatforms, setSelectedPlatforms] = useState<UploadPlatform[]>([])
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')

    const togglePlatform = (p: UploadPlatform) => {
        setSelectedPlatforms(prev =>
            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
        )
    }

    const preset = SOCIAL_PRESETS.find(p => p.id === selectedPreset)

    return (
        <div className="publish-tab">
            {/* Section tabs */}
            <div className="publish-sections">
                {([
                    { id: 'format' as const, label: '📐 Format', tip: 'Choose resolution, aspect ratio, and platform preset' },
                    { id: 'upload' as const, label: '📤 Upload', tip: 'Upload directly to YouTube/TikTok or share via link' },
                    { id: 'proof' as const, label: '🔒 Proof', tip: 'Blockchain-verify your render with Trust Layer hallmark' },
                ]).map(sec => (
                    <button
                        key={sec.id}
                        className={`publish-section-btn ${activeSection === sec.id ? 'active' : ''}`}
                        onClick={() => setActiveSection(sec.id)}
                        title={sec.tip}
                    >
                        {sec.label}
                    </button>
                ))}
            </div>

            {/* ── Format Section ── */}
            {activeSection === 'format' && (
                <div className="publish-content">
                    <div className="publish-row">
                        <label>
                            Platform Preset
                            <InfoBubble text="Select a platform to auto-set resolution, aspect ratio, FPS, and file size limits. Custom lets you set everything manually." />
                        </label>
                    </div>
                    <div className="publish-presets">
                        {SOCIAL_PRESETS.map(p => (
                            <button
                                key={p.id}
                                className={`publish-preset ${selectedPreset === p.id ? 'active' : ''}`}
                                onClick={() => setSelectedPreset(p.id)}
                            >
                                <span className="publish-preset-icon">{p.icon}</span>
                                <span className="publish-preset-name">{p.name}</span>
                                <span className="publish-preset-res">{p.width}×{p.height}</span>
                            </button>
                        ))}
                    </div>
                    {preset && (
                        <div className="publish-preset-info">
                            <div className="publish-info-row">
                                <span>Resolution</span><span>{preset.width} × {preset.height}</span>
                            </div>
                            <div className="publish-info-row">
                                <span>Aspect Ratio</span><span>{preset.aspectRatio}</span>
                            </div>
                            <div className="publish-info-row">
                                <span>FPS</span><span>{preset.fps}</span>
                            </div>
                            <div className="publish-info-row">
                                <span>Max Duration</span><span>{preset.maxDuration > 0 ? `${preset.maxDuration}s` : 'Unlimited'}</span>
                            </div>
                            <div className="publish-info-row">
                                <span>Max File Size</span><span>{preset.maxFileSizeMB > 0 ? `${preset.maxFileSizeMB} MB` : 'Unlimited'}</span>
                            </div>
                            <div className="publish-preset-note">{preset.notes}</div>
                        </div>
                    )}
                    <button className="publish-render-btn">
                        🎬 Render Video
                    </button>
                </div>
            )}

            {/* ── Upload Section ── */}
            {activeSection === 'upload' && (
                <div className="publish-content">
                    <div className="publish-row">
                        <label>Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            placeholder="Video title..."
                            className="publish-input"
                        />
                    </div>
                    <div className="publish-row">
                        <label>Description</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Video description..."
                            rows={3}
                            className="publish-textarea"
                        />
                    </div>
                    <div className="publish-row">
                        <label>
                            Platforms
                            <InfoBubble text="YouTube and TikTok support direct upload (OAuth required). Other platforms open a share link. Ecosystem apps upload internally." />
                        </label>
                    </div>
                    <div className="publish-platforms">
                        {PLATFORMS.map(p => (
                            <button
                                key={p.id}
                                className={`publish-platform ${selectedPlatforms.includes(p.id) ? 'selected' : ''}`}
                                onClick={() => togglePlatform(p.id)}
                            >
                                <span className="publish-platform-icon">{p.icon}</span>
                                <div>
                                    <div className="publish-platform-name">{p.name}</div>
                                    <div className="publish-platform-cap">
                                        {p.capability === 'direct-upload' ? '⬆️ Direct' :
                                            p.capability === 'ecosystem' ? '🏠 Ecosystem' : '🔗 Share'}
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                    <button
                        className="publish-upload-btn"
                        disabled={selectedPlatforms.length === 0 || !title.trim()}
                    >
                        📤 Publish to {selectedPlatforms.length} Platform{selectedPlatforms.length !== 1 ? 's' : ''}
                    </button>
                </div>
            )}

            {/* ── Proof Section ── */}
            {activeSection === 'proof' && (
                <div className="publish-content">
                    <div className="publish-proof-header">
                        <div className="publish-proof-icon">🔒</div>
                        <div>
                            <h4>Blockchain-Verified Render</h4>
                            <p>Every export gets an immutable proof of authorship</p>
                        </div>
                    </div>
                    <div className="publish-proof-features">
                        <div className="publish-proof-feature">
                            <span>✅</span> SHA-256 content hash
                            <InfoBubble text="A unique fingerprint of your video. If even one pixel changes, the hash changes. Proves the video hasn't been altered." />
                        </div>
                        <div className="publish-proof-feature">
                            <span>✅</span> Creator identity verification
                            <InfoBubble text="Your Trust Layer ID is embedded in the proof, linking the video to your verified identity." />
                        </div>
                        <div className="publish-proof-feature">
                            <span>✅</span> Asset tree (Merkle hash)
                            <InfoBubble text="Every model, texture, audio file, and generated asset used in the video is hashed into a tree. Proves exactly what went into the production." />
                        </div>
                        <div className="publish-proof-feature">
                            <span>✅</span> On-chain Trust Layer hallmark
                            <InfoBubble text="The proof is registered on the Trust Layer blockchain. Anyone can verify at trustlayer.app/verify." />
                        </div>
                        <div className="publish-proof-feature">
                            <span>✅</span> Downloadable proof document (JSON)
                        </div>
                    </div>
                    <div className="publish-proof-toggle">
                        <label className="publish-toggle">
                            <input type="checkbox" defaultChecked />
                            <span>Auto-generate proof with every render</span>
                        </label>
                    </div>
                    <button className="publish-proof-btn">
                        🔗 View Last Proof
                    </button>
                </div>
            )}
        </div>
    )
}
