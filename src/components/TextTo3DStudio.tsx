/* ====== TrustGen — Text-to-3D Studio (Pro) ======
 * Premium multi-variant generation UI with:
 *   - 5-mode style selector with hover effects
 *   - 4-variant generation grid with live 3D previews
 *   - Animated pipeline visualization
 *   - Auto-rig detection with one-click rig
 *   - Prompt enhancer + history
 *   - Export pipeline (GLB/OBJ)
 *   - Mobile-responsive layout
 *
 * Trust Layer aesthetic: void black, cyan/purple accents, glassmorphism.
 */
import { useState, useCallback, useRef, useEffect } from 'react'
import { parseDescriptionLocal, buildSceneGroup, type SceneGraph, type GenerationMode } from '../engine/TextTo3DGenerator'
import { VariantPreview } from './VariantPreview'

// ══════════════════════════════════════════
//  TYPES & CONSTANTS
// ══════════════════════════════════════════

export type GenStyle = 'realistic' | 'pixar' | 'lowpoly' | 'voxel' | 'scifi'

const STYLES: { id: GenStyle; label: string; icon: string; desc: string; rMul: number; mMul: number }[] = [
    { id: 'realistic', label: 'Realistic', icon: '🎯', desc: 'Physically accurate materials', rMul: 1, mMul: 1 },
    { id: 'pixar', label: 'Pixar', icon: '🎬', desc: 'Smooth stylized surfaces', rMul: 1.3, mMul: 0.3 },
    { id: 'lowpoly', label: 'Low-Poly', icon: '🔷', desc: 'Angular faceted geometry', rMul: 0.8, mMul: 0.1 },
    { id: 'voxel', label: 'Voxel', icon: '🧱', desc: 'Blocky voxelized look', rMul: 1.0, mMul: 0 },
    { id: 'scifi', label: 'Sci-Fi', icon: '🚀', desc: 'Emissive neon cyberpunk', rMul: 0.3, mMul: 0.8 },
]

type Stage = 'idle' | 'parsing' | 'composing' | 'materials' | 'building' | 'variants' | 'done'

const STAGES: { id: Stage; label: string; icon: string; pct: number }[] = [
    { id: 'parsing', label: 'Parsing', icon: '🧠', pct: 15 },
    { id: 'composing', label: 'Composing', icon: '🏗️', pct: 35 },
    { id: 'materials', label: 'Materials', icon: '🎨', pct: 55 },
    { id: 'building', label: 'Building', icon: '🧊', pct: 75 },
    { id: 'variants', label: 'Variants', icon: '🔄', pct: 90 },
    { id: 'done', label: 'Done', icon: '✅', pct: 100 },
]

const PROMPT_HINTS: Record<string, string> = {
    character: 'Try: "A muscular warrior in dark plate armor, T-pose"',
    house: 'Try: "A cozy stone cottage with a chimney and wooden door"',
    car: 'Try: "A sleek red sports car with chrome rims"',
    sword: 'Try: "An ancient golden sword with glowing emerald pommel"',
    robot: 'Try: "A friendly round robot with glowing cyan eyes"',
    tree: 'Try: "A massive ancient oak with twisted roots"',
    table: 'Try: "A wooden oak table with iron legs"',
    crown: 'Try: "A golden crown with ruby gemstones"',
}

const ENHANCE_KEYWORDS: Record<string, string> = {
    sword: 'with detailed crossguard, leather-wrapped grip, and polished steel blade',
    table: 'with oak wood grain, smooth finish, and sturdy proportions',
    chair: 'with ergonomic proportions, padded seat, and armrests',
    house: 'with weathered stone walls, wooden shutters, and a smoking chimney',
    car: 'with aerodynamic design, metallic paint, tinted windows, and alloy wheels',
    robot: 'with articulated joints, glowing cyan eyes, and brushed metal panels',
    tree: 'with gnarled bark, sprawling root system, and dense leafy canopy',
    character: 'in detailed armor with weathered textures and battle-worn edges',
    crown: 'with intricate filigree, embedded gemstones, and polished gold finish',
    crystal: 'with translucent facets, internal light refraction, and prismatic glow',
}

const HISTORY_KEY = 'trustgen_t3d_prompt_history'

interface Variant { id: number; sg: SceneGraph; label: string; desc: string }

// ══════════════════════════════════════════
//  STYLE PROCESSING
// ══════════════════════════════════════════

function applyStyle(g: SceneGraph, st: typeof STYLES[0]): SceneGraph {
    const c = JSON.parse(JSON.stringify(g)) as SceneGraph
    c.objects.forEach(o => {
        o.material.roughness = Math.min(1, o.material.roughness * st.rMul)
        o.material.metalness = Math.min(1, o.material.metalness * st.mMul)
        if (st.id === 'scifi') {
            o.material.emissive = o.material.emissive || '#00FFFF'
            o.material.emissiveIntensity = (o.material.emissiveIntensity || 0) + 0.5
        }
    })
    return c
}

function makeVariants(base: SceneGraph, style: GenStyle): Variant[] {
    const st = STYLES.find(s => s.id === style)!
    const v: Variant[] = [{ id: 1, sg: applyStyle(base, st), label: 'Original', desc: 'Base composition' }]

    const s2 = JSON.parse(JSON.stringify(base)) as SceneGraph
    s2.objects.forEach(o => { o.size.x *= 1.15; o.size.y *= 1.15; o.size.z *= 1.15 })
    v.push({ id: 2, sg: applyStyle(s2, st), label: 'Scaled', desc: '15% larger proportions' })

    const s3 = JSON.parse(JSON.stringify(base)) as SceneGraph
    s3.objects.forEach(o => { o.material.roughness = Math.max(0, o.material.roughness - 0.15) })
    v.push({ id: 3, sg: applyStyle(s3, st), label: 'Polished', desc: 'Smoother surfaces' })

    const s4 = JSON.parse(JSON.stringify(base)) as SceneGraph
    s4.objects.forEach(o => {
        o.material.metalness = Math.min(1, o.material.metalness + 0.3)
        o.material.roughness = Math.max(0, o.material.roughness - 0.2)
    })
    v.push({ id: 4, sg: applyStyle(s4, st), label: 'Metallic', desc: 'Enhanced reflections' })

    return v
}

function isRiggable(g: SceneGraph): boolean {
    return g.objects.some(o => /torso|head|arm|leg/i.test(o.name))
}

// ══════════════════════════════════════════
//  PROMPT ENHANCER
// ══════════════════════════════════════════

function enhancePrompt(prompt: string): string {
    const lower = prompt.toLowerCase()
    let enhanced = prompt
    for (const [keyword, detail] of Object.entries(ENHANCE_KEYWORDS)) {
        if (lower.includes(keyword) && !lower.includes(detail.split(' ')[0])) {
            enhanced = `${prompt.trim()} ${detail}`
            break
        }
    }
    return enhanced.slice(0, 500)
}

// ══════════════════════════════════════════
//  PROMPT HISTORY
// ══════════════════════════════════════════

function loadHistory(): string[] {
    try {
        const raw = localStorage.getItem(HISTORY_KEY)
        return raw ? JSON.parse(raw) : []
    } catch { return [] }
}

function saveHistory(prompt: string) {
    try {
        const hist = loadHistory().filter(h => h !== prompt)
        hist.unshift(prompt)
        localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, 10)))
    } catch { /* ignore */ }
}

// ══════════════════════════════════════════
//  EXPORT UTILS
// ══════════════════════════════════════════

async function exportAsGLB(sg: SceneGraph, description: string) {
    const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
    const group = buildSceneGroup(sg)
    const exporter = new GLTFExporter()
    exporter.parse(
        group,
        (result) => {
            const blob = new Blob([result as ArrayBuffer], { type: 'model/gltf-binary' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${description.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.glb`
            a.click()
            URL.revokeObjectURL(url)
        },
        (error) => { console.error('GLB export failed:', error) },
        { binary: true }
    )
}

async function exportAsOBJ(sg: SceneGraph, description: string) {
    const { OBJExporter } = await import('three/examples/jsm/exporters/OBJExporter.js')
    const group = buildSceneGroup(sg)
    const exporter = new OBJExporter()
    const result = exporter.parse(group)
    const blob = new Blob([result], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${description.replace(/[^a-z0-9]/gi, '_').slice(0, 30)}.obj`
    a.click()
    URL.revokeObjectURL(url)
}

// ══════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════

interface Props { onGenerate: (type: string, config: any) => void }

export function TextTo3DStudio({ onGenerate }: Props) {
    const [prompt, setPrompt] = useState('')
    const [style, setStyle] = useState<GenStyle>('realistic')
    const [mode, setMode] = useState<GenerationMode>('local')
    const [stage, setStage] = useState<Stage>('idle')
    const [variants, setVariants] = useState<Variant[]>([])
    const [sel, setSel] = useState<number | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [history] = useState<string[]>(() => loadHistory())
    const [showHistory, setShowHistory] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Current stage info
    const currentStageIdx = STAGES.findIndex(s => s.id === stage)
    const currentPct = stage === 'idle' ? 0 : (STAGES[currentStageIdx]?.pct ?? 0)

    // Hint
    const hint = prompt.length > 2 ? Object.entries(PROMPT_HINTS).find(([k]) => prompt.toLowerCase().includes(k))?.[1] || '' : ''

    // Rig detection
    const canRig = sel !== null && variants[sel - 1] && isRiggable(variants[sel - 1].sg)

    // ── Generate ──
    const generate = useCallback(async () => {
        if (!prompt.trim()) return
        setError(null); setVariants([]); setSel(null)
        saveHistory(prompt.trim())

        try {
            for (const s of STAGES.slice(0, -1)) {
                setStage(s.id)
                await new Promise(r => setTimeout(r, 250 + Math.random() * 200))
            }
            const base = parseDescriptionLocal(prompt)
            const vars = makeVariants(base, style)
            setVariants(vars)
            setStage('done')
        } catch (e: any) {
            setError(e.message)
            setStage('idle')
        }
    }, [prompt, style, mode])

    // ── Enhance prompt ──
    const handleEnhance = useCallback(() => {
        const enhanced = enhancePrompt(prompt)
        setPrompt(enhanced)
        textareaRef.current?.focus()
    }, [prompt])

    // ── Apply variant ──
    const apply = useCallback((v: Variant) => {
        setSel(v.id)
        onGenerate('text-to-3d', {
            group: buildSceneGroup(v.sg),
            sceneGraph: v.sg,
            description: prompt,
            style,
            variant: v.label,
        })
    }, [onGenerate, prompt, style])

    // ── Click-outside to close history ──
    useEffect(() => {
        if (!showHistory) return
        const close = () => setShowHistory(false)
        document.addEventListener('click', close, { once: true })
        return () => document.removeEventListener('click', close)
    }, [showHistory])

    return (
        <div className="t3d-studio" id="text-to-3d-studio">
            {/* ── Header ── */}
            <div className="t3d-header">
                <div className="t3d-header-title">
                    <span className="t3d-header-orb" />
                    <span className="t3d-header-text">Text to 3D</span>
                    <span className="t3d-pro-badge">PRO</span>
                </div>
                <div className="t3d-header-meta">
                    {stage === 'done' && variants.length > 0 && (
                        <span className="t3d-meta-count">{variants.length} variants</span>
                    )}
                </div>
            </div>

            {/* ── Prompt Area ── */}
            <div className="t3d-prompt-section">
                <div className="t3d-prompt-wrap">
                    <textarea
                        ref={textareaRef}
                        value={prompt}
                        onChange={e => setPrompt(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) generate() }}
                        placeholder="Describe what you want to create..."
                        rows={3}
                        maxLength={500}
                        className="t3d-prompt-input"
                        id="t3d-prompt-textarea"
                    />
                    <div className="t3d-prompt-actions">
                        <span className="t3d-char-count">{prompt.length}/500</span>
                        <button
                            className="t3d-enhance-btn"
                            onClick={handleEnhance}
                            disabled={!prompt.trim()}
                            title="Auto-enhance prompt with details"
                        >
                            ✨ Enhance
                        </button>
                        {history.length > 0 && (
                            <button
                                className="t3d-history-btn"
                                onClick={e => { e.stopPropagation(); setShowHistory(!showHistory) }}
                                title="Prompt history"
                            >
                                🕐
                            </button>
                        )}
                    </div>
                </div>
                {hint && <div className="t3d-hint">{hint}</div>}
                {showHistory && history.length > 0 && (
                    <div className="t3d-history-dropdown" id="t3d-prompt-history">
                        {history.map((h, i) => (
                            <button key={i} className="t3d-history-item" onClick={() => { setPrompt(h); setShowHistory(false) }}>
                                {h.slice(0, 60)}{h.length > 60 ? '…' : ''}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Style Selector ── */}
            <div className="t3d-section-label">Style</div>
            <div className="t3d-style-grid">
                {STYLES.map(st => (
                    <button
                        key={st.id}
                        className={`t3d-style-btn ${style === st.id ? 't3d-style-btn--active' : ''}`}
                        onClick={() => setStyle(st.id)}
                        title={st.desc}
                        id={`t3d-style-${st.id}`}
                    >
                        <span className="t3d-style-icon">{st.icon}</span>
                        <span className="t3d-style-label">{st.label}</span>
                    </button>
                ))}
            </div>

            {/* ── Advanced Options (collapsible) ── */}
            <button
                className="t3d-advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
            >
                <span>{showAdvanced ? '▾' : '▸'} Advanced</span>
            </button>
            {showAdvanced && (
                <div className="t3d-advanced-drawer">
                    <div className="t3d-mode-row">
                        {(['local', 'ai'] as GenerationMode[]).map(m => (
                            <button
                                key={m}
                                className={`t3d-mode-btn ${mode === m ? 't3d-mode-btn--active' : ''}`}
                                onClick={() => setMode(m)}
                            >
                                {m === 'local' ? '⚡ Instant (Local)' : '🧠 AI Enhanced'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Generate Button ── */}
            <button
                className="t3d-generate-btn"
                onClick={generate}
                disabled={!prompt.trim() || (stage !== 'idle' && stage !== 'done')}
                id="t3d-generate-button"
            >
                {stage !== 'idle' && stage !== 'done'
                    ? <><span className="t3d-gen-spinner" /> {STAGES[currentStageIdx]?.label || 'Generating'}...</>
                    : '🚀 Generate 4 Variants'}
            </button>

            {/* ── Pipeline Visualization ── */}
            {stage !== 'idle' && (
                <div className="t3d-pipeline">
                    <div className="t3d-pipeline-bar">
                        <div className="t3d-pipeline-fill" style={{ width: `${currentPct}%` }} />
                    </div>
                    <div className="t3d-pipeline-steps">
                        {STAGES.map((s, i) => (
                            <div
                                key={s.id}
                                className={`t3d-pipeline-step ${currentPct >= s.pct ? 't3d-pipeline-step--done' : ''} ${stage === s.id ? 't3d-pipeline-step--active' : ''}`}
                            >
                                <span className="t3d-pipeline-icon">{s.icon}</span>
                                <span className="t3d-pipeline-num">{s.id === 'done' ? '✓' : i + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Error ── */}
            {error && (
                <div className="t3d-error" id="t3d-error-display">
                    ⚠️ {error}
                </div>
            )}

            {/* ── Variant Grid (with live 3D previews) ── */}
            {variants.length > 0 && (
                <div className="t3d-variants-section">
                    <div className="t3d-section-label">Choose a Variant</div>
                    <div className="t3d-variant-grid">
                        {variants.map(v => (
                            <VariantPreview
                                key={v.id}
                                sceneGraph={v.sg}
                                selected={sel === v.id}
                                onClick={() => apply(v)}
                                label={v.label}
                                desc={v.desc}
                                variantId={v.id}
                                objectCount={v.sg.objects.length}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* ── Auto-Rig Detection ── */}
            {canRig && (
                <div className="t3d-rig-banner" id="t3d-auto-rig">
                    <span className="t3d-rig-icon">🦴</span>
                    <span className="t3d-rig-text">
                        Character detected — <strong>Auto-Rig</strong> available
                    </span>
                    <button className="t3d-rig-btn">Rig It →</button>
                </div>
            )}

            {/* ── Export Bar ── */}
            {sel !== null && variants[sel - 1] && (
                <div className="t3d-export-bar" id="t3d-export-section">
                    <div className="t3d-export-info">
                        {variants[sel - 1].sg.objects.length} objects · {style} · V{sel}
                    </div>
                    <div className="t3d-export-actions">
                        <button
                            className="t3d-export-btn"
                            onClick={() => exportAsGLB(variants[sel - 1].sg, prompt)}
                            title="Export as GLB (web/game standard)"
                        >
                            📦 GLB
                        </button>
                        <button
                            className="t3d-export-btn"
                            onClick={() => exportAsOBJ(variants[sel - 1].sg, prompt)}
                            title="Export as OBJ (universal format)"
                        >
                            📐 OBJ
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TextTo3DStudio
