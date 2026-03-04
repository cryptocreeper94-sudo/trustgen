/* ====== TrustGen — AI Generation Panel ====== */
/* Text-to-3D and Image-to-3D generation via Meshy.ai */
import { useState, useRef, useCallback } from 'react'
import {
    getApiKey, setApiKey, fileToBase64,
    createTextTo3D, createImageTo3D, createTextToTexture, pollTask,
    type MeshyTask
} from '../api/meshy'
import { useEngineStore } from '../store'
import { showToast } from './Toast'

// ── Settings Section ──
function ApiKeySection() {
    const [key, setKey] = useState(getApiKey())
    const [visible, setVisible] = useState(false)
    const [saved, setSaved] = useState(false)

    const handleSave = () => {
        setApiKey(key)
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div className="ai-section">
            <div className="ai-section-header">
                <span className="ai-section-icon">🔑</span>
                <span>API Key</span>
            </div>
            <div className="api-key-group">
                <input
                    type={visible ? 'text' : 'password'}
                    placeholder="Enter Meshy API key"
                    value={key}
                    onChange={e => setKey(e.target.value)}
                    className="ai-input"
                />
                <button className="glass-btn icon-btn-tiny" onClick={() => setVisible(!visible)} title="Toggle visibility">
                    {visible ? '🙈' : '👁️'}
                </button>
            </div>
            <button className={`btn ${saved ? 'btn-success' : 'btn-primary'} full-width btn-sm`} onClick={handleSave}>
                {saved ? '✓ Saved' : '💾 Save Key'}
            </button>
            <div className="ai-hint">
                Get your key at <a href="https://app.meshy.ai/api" target="_blank" rel="noopener noreferrer">app.meshy.ai/api</a>
            </div>
        </div>
    )
}

// ── Task Progress Card ──
function TaskCard({ task, label }: { task: MeshyTask; label: string }) {
    const addNode = useEngineStore(s => s.addNode)
    const isComplete = task.status === 'SUCCEEDED'
    const isFailed = task.status === 'FAILED' || task.status === 'EXPIRED'

    const handleImport = () => {
        const glbUrl = task.model_urls?.glb
        if (!glbUrl) return
        addNode({
            kind: 'model',
            name: label || `AI Model`,
            modelUrl: glbUrl,
        })
    }

    return (
        <div className={`task-card glass-card ${isComplete ? 'success' : isFailed ? 'failed' : ''}`}>
            <div className="task-card-header">
                <span className="task-card-label">{label}</span>
                <span className={`task-status-badge ${task.status.toLowerCase()}`}>
                    {task.status === 'IN_PROGRESS' ? '⏳' : task.status === 'SUCCEEDED' ? '✅' : task.status === 'FAILED' ? '❌' : '⏸️'}
                    {task.status}
                </span>
            </div>

            {task.status === 'IN_PROGRESS' && (
                <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${task.progress}%` }} />
                    <span className="progress-text">{task.progress}%</span>
                </div>
            )}

            {task.thumbnail_url && (
                <img src={task.thumbnail_url} alt={label} className="task-thumbnail" />
            )}

            {isComplete && task.model_urls?.glb && (
                <button className="btn btn-primary full-width btn-sm" onClick={handleImport}>
                    📥 Import to Scene
                </button>
            )}

            {isFailed && (
                <div className="task-error">
                    {task.task_error?.message || 'Generation failed'}
                </div>
            )}
        </div>
    )
}

// ── Text to 3D ──
function TextTo3DSection() {
    const [prompt, setPrompt] = useState('')
    const [negativePrompt, setNegativePrompt] = useState('')
    const [artStyle, setArtStyle] = useState<'realistic' | 'sculpture'>('realistic')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentTask, setCurrentTask] = useState<MeshyTask | null>(null)
    const cancelRef = useRef<(() => void) | null>(null)

    const handleGenerate = useCallback(async () => {
        if (!prompt.trim()) return
        if (!getApiKey()) {
            setError('Please set your Meshy API key first')
            return
        }

        setLoading(true)
        setError('')
        setCurrentTask(null)

        try {
            const taskId = await createTextTo3D({
                prompt: prompt.trim(),
                mode: 'preview',
                negative_prompt: negativePrompt || undefined,
                art_style: artStyle,
                ai_model: 'latest',
                topology: 'triangle',
            })

            const { cancel, promise } = pollTask(taskId, 'text-to-3d', (task) => {
                setCurrentTask({ ...task })
            })

            cancelRef.current = cancel
            const finalTask = await promise
            setCurrentTask({ ...finalTask })
            showToast('success', '3D model generated! Click Import to add to scene.')
        } catch (err: any) {
            setError(err.message || 'Generation failed')
        } finally {
            setLoading(false)
            cancelRef.current = null
        }
    }, [prompt, negativePrompt, artStyle])

    const handleCancel = () => {
        cancelRef.current?.()
        setLoading(false)
    }

    return (
        <div className="ai-section">
            <div className="ai-section-header">
                <span className="ai-section-icon">💬</span>
                <span>Text to 3D</span>
            </div>
            <textarea
                className="ai-textarea"
                placeholder="Describe a 3D model... e.g. 'a futuristic spaceship with glowing engines'"
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                maxLength={1000}
                rows={3}
            />
            <div className="char-count">{prompt.length}/1000</div>

            <textarea
                className="ai-textarea ai-textarea-sm"
                placeholder="Negative prompt (optional) — describe what to avoid"
                value={negativePrompt}
                onChange={e => setNegativePrompt(e.target.value)}
                rows={2}
            />

            {/* Art Style Selector */}
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                <button
                    className={`btn btn-sm ${artStyle === 'realistic' ? 'btn-primary' : 'glass-btn'}`}
                    onClick={() => setArtStyle('realistic')} style={{ flex: 1 }}
                >
                    🎭 Realistic
                </button>
                <button
                    className={`btn btn-sm ${artStyle === 'sculpture' ? 'btn-primary' : 'glass-btn'}`}
                    onClick={() => setArtStyle('sculpture')} style={{ flex: 1 }}
                >
                    🗿 Sculpture
                </button>
            </div>

            {error && <div className="ai-error">{error}</div>}

            <div className="ai-actions">
                {loading ? (
                    <button className="btn glass-btn full-width btn-sm" onClick={handleCancel}>
                        ⏹ Cancel
                    </button>
                ) : (
                    <button
                        className="btn btn-primary full-width btn-sm"
                        onClick={handleGenerate}
                        disabled={!prompt.trim()}
                    >
                        🪄 Generate 3D Model
                    </button>
                )}
            </div>

            {currentTask && <TaskCard task={currentTask} label={prompt.slice(0, 30)} />}

            {/* Prompt suggestions */}
            <div style={{ marginTop: 8 }}>
                <div className="ai-hint" style={{ marginBottom: 4 }}>Quick prompts:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {['Wooden treasure chest', 'Crystal sword', 'Robot character', 'Medieval castle', 'Fantasy tree'].map(p => (
                        <button key={p} className="btn glass-btn" style={{ fontSize: 10, padding: '3px 8px' }}
                            onClick={() => setPrompt(p)}>
                            {p}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ── Image to 3D ──
function ImageTo3DSection() {
    const [imagePreview, setImagePreview] = useState('')
    const [imageData, setImageData] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentTask, setCurrentTask] = useState<MeshyTask | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null!)
    const cancelRef = useRef<(() => void) | null>(null)

    const handleFile = useCallback(async (file: File) => {
        if (!file.type.match(/^image\/(jpeg|jpg|png)$/)) {
            setError('Please use JPG or PNG images')
            return
        }
        const base64 = await fileToBase64(file)
        setImagePreview(base64)
        setImageData(base64)
        setError('')
    }, [])

    const handleGenerate = useCallback(async () => {
        if (!imageData) return
        if (!getApiKey()) {
            setError('Please set your Meshy API key first')
            return
        }

        setLoading(true)
        setError('')
        setCurrentTask(null)

        try {
            const taskId = await createImageTo3D({
                image_url: imageData,
                ai_model: 'latest',
                topology: 'triangle',
            })

            const { cancel, promise } = pollTask(taskId, 'image-to-3d', (task) => {
                setCurrentTask({ ...task })
            })

            cancelRef.current = cancel
            const finalTask = await promise
            setCurrentTask({ ...finalTask })
        } catch (err: any) {
            setError(err.message || 'Generation failed')
        } finally {
            setLoading(false)
            cancelRef.current = null
        }
    }, [imageData])

    const handleCancel = () => {
        cancelRef.current?.()
        setLoading(false)
    }

    return (
        <div className="ai-section">
            <div className="ai-section-header">
                <span className="ai-section-icon">🖼️</span>
                <span>Image to 3D</span>
            </div>

            <div
                className={`drop-zone ai-drop-zone ${imagePreview ? 'has-image' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                    e.preventDefault()
                    const file = e.dataTransfer.files[0]
                    if (file) handleFile(file)
                }}
            >
                {imagePreview ? (
                    <img src={imagePreview} alt="Upload" className="ai-image-preview" />
                ) : (
                    <>
                        <div className="drop-zone-icon">📸</div>
                        <div className="drop-zone-text">Drop or click to upload</div>
                        <div className="drop-zone-hint">JPG, PNG supported</div>
                    </>
                )}
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                style={{ display: 'none' }}
                onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleFile(file)
                }}
            />

            {imagePreview && (
                <button className="btn glass-btn full-width btn-sm" onClick={() => {
                    setImagePreview(''); setImageData(''); setCurrentTask(null)
                }}>
                    ✕ Clear Image
                </button>
            )}

            {error && <div className="ai-error">{error}</div>}

            <div className="ai-actions">
                {loading ? (
                    <button className="btn glass-btn full-width btn-sm" onClick={handleCancel}>
                        ⏹ Cancel
                    </button>
                ) : (
                    <button
                        className="btn btn-primary full-width btn-sm"
                        onClick={handleGenerate}
                        disabled={!imageData}
                    >
                        🪄 Generate 3D Model
                    </button>
                )}
            </div>

            {currentTask && <TaskCard task={currentTask} label="Image to 3D" />}
        </div>
    )
}

// ── URL to 3D ──
function UrlTo3DSection() {
    const [url, setUrl] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentTask, setCurrentTask] = useState<MeshyTask | null>(null)
    const cancelRef = useRef<(() => void) | null>(null)

    const handleGenerate = useCallback(async () => {
        if (!url.trim()) return
        if (!getApiKey()) {
            setError('Please set your Meshy API key first')
            return
        }

        setLoading(true)
        setError('')
        setCurrentTask(null)

        try {
            const taskId = await createImageTo3D({
                image_url: url.trim(),
                ai_model: 'latest',
                topology: 'triangle',
            })

            const { cancel, promise } = pollTask(taskId, 'image-to-3d', (task) => {
                setCurrentTask({ ...task })
            })

            cancelRef.current = cancel
            const finalTask = await promise
            setCurrentTask({ ...finalTask })
        } catch (err: any) {
            setError(err.message || 'Generation failed')
        } finally {
            setLoading(false)
            cancelRef.current = null
        }
    }, [url])

    const handleCancel = () => {
        cancelRef.current?.()
        setLoading(false)
    }

    return (
        <div className="ai-section">
            <div className="ai-section-header">
                <span className="ai-section-icon">🔗</span>
                <span>Image URL to 3D</span>
            </div>
            <input
                type="url"
                className="ai-input"
                placeholder="https://example.com/image.png"
                value={url}
                onChange={e => setUrl(e.target.value)}
            />
            <div className="ai-hint">Paste a public URL to any JPG/PNG image</div>

            {error && <div className="ai-error">{error}</div>}

            <div className="ai-actions">
                {loading ? (
                    <button className="btn glass-btn full-width btn-sm" onClick={handleCancel}>
                        ⏹ Cancel
                    </button>
                ) : (
                    <button
                        className="btn btn-primary full-width btn-sm"
                        onClick={handleGenerate}
                        disabled={!url.trim()}
                    >
                        🪄 Generate from URL
                    </button>
                )}
            </div>

            {currentTask && <TaskCard task={currentTask} label="URL to 3D" />}
        </div>
    )
}

// ── Text to Texture ──
function TextToTextureSection() {
    const [modelUrl, setModelUrl] = useState('')
    const [objectPrompt, setObjectPrompt] = useState('')
    const [stylePrompt, setStylePrompt] = useState('')
    const [artStyle, setArtStyle] = useState<'realistic' | 'fake-3d-cartoon' | 'japanese-anime'>('realistic')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [currentTask, setCurrentTask] = useState<MeshyTask | null>(null)
    const cancelRef = useRef<(() => void) | null>(null)
    const selectedNode = useEngineStore(s => {
        const id = s.editor.selectedNodeId
        return id ? s.nodes[id] : null
    })

    // Auto-fill model URL from selected node
    const useSelected = () => {
        if (selectedNode?.modelUrl) {
            setModelUrl(selectedNode.modelUrl)
            setObjectPrompt(selectedNode.name)
            showToast('info', `Using model: ${selectedNode.name}`)
        }
    }

    const handleGenerate = useCallback(async () => {
        if (!modelUrl || !objectPrompt || !stylePrompt) {
            setError('Please fill in all fields')
            return
        }
        if (!getApiKey()) {
            setError('Please set your Meshy API key first')
            return
        }

        setLoading(true)
        setError('')
        setCurrentTask(null)

        try {
            const taskId = await createTextToTexture({
                model_url: modelUrl,
                object_prompt: objectPrompt,
                style_prompt: stylePrompt,
                art_style: artStyle,
                resolution: '2048',
            })

            const { cancel, promise } = pollTask(taskId, 'text-to-texture', (task) => {
                setCurrentTask({ ...task })
            })

            cancelRef.current = cancel
            const finalTask = await promise
            setCurrentTask({ ...finalTask })
            showToast('success', 'Texture generated! Apply it to your model.')
        } catch (err: any) {
            setError(err.message || 'Texture generation failed')
        } finally {
            setLoading(false)
            cancelRef.current = null
        }
    }, [modelUrl, objectPrompt, stylePrompt, artStyle])

    return (
        <div className="ai-section">
            <div className="ai-section-header">
                <span className="ai-section-icon">🎨</span>
                <span>Text to Texture</span>
            </div>

            <div className="ai-hint" style={{ marginBottom: 8 }}>
                Generate AI textures for your 3D models
            </div>

            {selectedNode?.kind === 'model' && (
                <button className="btn glass-btn full-width btn-sm" onClick={useSelected} style={{ marginBottom: 8 }}>
                    📎 Use Selected: {selectedNode.name}
                </button>
            )}

            <input
                className="ai-input"
                placeholder="Model GLB URL (or select a model above)"
                value={modelUrl}
                onChange={e => setModelUrl(e.target.value)}
            />

            <input
                className="ai-input"
                placeholder="What is this object? e.g. 'a sword'"
                value={objectPrompt}
                onChange={e => setObjectPrompt(e.target.value)}
                style={{ marginTop: 6 }}
            />

            <textarea
                className="ai-textarea ai-textarea-sm"
                placeholder="Describe the texture style... e.g. 'battle-worn steel with rust and scratches'"
                value={stylePrompt}
                onChange={e => setStylePrompt(e.target.value)}
                rows={2}
            />

            {/* Art Style for textures */}
            <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                {[
                    { key: 'realistic' as const, label: '🎭 Realistic' },
                    { key: 'fake-3d-cartoon' as const, label: '🧸 Cartoon' },
                    { key: 'japanese-anime' as const, label: '🇯🇵 Anime' },
                ].map(s => (
                    <button key={s.key}
                        className={`btn btn-sm ${artStyle === s.key ? 'btn-primary' : 'glass-btn'}`}
                        onClick={() => setArtStyle(s.key)} style={{ flex: 1 }}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {error && <div className="ai-error">{error}</div>}

            <div className="ai-actions">
                {loading ? (
                    <button className="btn glass-btn full-width btn-sm" onClick={() => { cancelRef.current?.(); setLoading(false) }}>
                        ⏹ Cancel
                    </button>
                ) : (
                    <button
                        className="btn btn-primary full-width btn-sm"
                        onClick={handleGenerate}
                        disabled={!modelUrl || !objectPrompt || !stylePrompt}
                    >
                        🎨 Generate Texture
                    </button>
                )}
            </div>

            {currentTask && <TaskCard task={currentTask} label={stylePrompt.slice(0, 30)} />}
        </div>
    )
}

// ── Main AI Panel ──
export function AIGenerationPanel() {
    const [activeMode, setActiveMode] = useState<'text' | 'image' | 'url' | 'texture'>('text')

    return (
        <div className="tab-content ai-panel">
            <ApiKeySection />

            <div className="ai-mode-tabs">
                <button className={`ai-mode-btn ${activeMode === 'text' ? 'active' : ''}`}
                    onClick={() => setActiveMode('text')}>
                    <span>💬</span> Text
                </button>
                <button className={`ai-mode-btn ${activeMode === 'image' ? 'active' : ''}`}
                    onClick={() => setActiveMode('image')}>
                    <span>🖼️</span> Image
                </button>
                <button className={`ai-mode-btn ${activeMode === 'url' ? 'active' : ''}`}
                    onClick={() => setActiveMode('url')}>
                    <span>🔗</span> URL
                </button>
                <button className={`ai-mode-btn ${activeMode === 'texture' ? 'active' : ''}`}
                    onClick={() => setActiveMode('texture')}>
                    <span>🎨</span> Texture
                </button>
            </div>

            {activeMode === 'text' && <TextTo3DSection />}
            {activeMode === 'image' && <ImageTo3DSection />}
            {activeMode === 'url' && <UrlTo3DSection />}
            {activeMode === 'texture' && <TextToTextureSection />}

            <div className="ai-footer">
                <div className="ai-hint ai-footer-text">
                    Powered by <strong>Meshy.ai</strong> • Models generated as GLB
                </div>
            </div>
        </div>
    )
}
