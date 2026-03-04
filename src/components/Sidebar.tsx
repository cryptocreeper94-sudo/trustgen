/* ====== TrustGen — Tabbed Sidebar (Properties Inspector) ====== */
import React, { useState, useCallback, useRef } from 'react'
import { useEngineStore } from '../store'
import { SceneHierarchy } from './SceneHierarchy'
import { AIGenerationPanel } from './AIPanel'
import { InfoBubble } from './Tooltip'
import { getParticleConfig } from './ParticleSystem'
import type {
    SidebarTab, MaterialPreset, EnvironmentPreset,
    ParticlePreset
} from '../types'
import { MATERIAL_PRESETS as PRESETS } from '../types'

const TABS: { id: SidebarTab; icon: string; label: string }[] = [
    { id: 'scene', icon: '🎬', label: 'Scene' },
    { id: 'materials', icon: '🎨', label: 'Materials' },
    { id: 'animation', icon: '⏱️', label: 'Animate' },
    { id: 'lighting', icon: '💡', label: 'Lighting' },
    { id: 'effects', icon: '✨', label: 'Effects' },
    { id: 'ai', icon: '🧠', label: 'AI Gen' },
    { id: 'export', icon: '💾', label: 'Export' },
]

function Accordion({ title, icon, defaultOpen = false, children }: {
    title: string; icon: string; defaultOpen?: boolean; children: React.ReactNode
}) {
    const [open, setOpen] = useState(defaultOpen)
    return (
        <div className={`accordion ${open ? 'open' : ''}`}>
            <button className="accordion-header" onClick={() => setOpen(!open)}>
                <span className="accordion-icon">{icon}</span>
                <span className="accordion-title">{title}</span>
                <span className="accordion-arrow">{open ? '▾' : '▸'}</span>
            </button>
            <div className={`accordion-body ${open ? 'expanded' : ''}`}>
                <div className="accordion-content">
                    {children}
                </div>
            </div>
        </div>
    )
}

function SliderRow({ label, value, min, max, step, onChange, unit = '' }: {
    label: string; value: number; min: number; max: number; step: number;
    onChange: (v: number) => void; unit?: string
}) {
    return (
        <div className="control-row">
            <span className="control-label">{label}</span>
            <div className="slider-group">
                <input type="range" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(parseFloat(e.target.value))} />
                <span className="control-value">{value.toFixed(step < 1 ? 2 : 0)}{unit}</span>
            </div>
        </div>
    )
}

function ToggleRow({ label, value, onChange }: {
    label: string; value: boolean; onChange: (v: boolean) => void
}) {
    return (
        <div className="control-row">
            <span className="control-label">{label}</span>
            <label className="toggle">
                <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
                <span className="toggle-track" />
                <span className="toggle-thumb" />
            </label>
        </div>
    )
}

function ColorRow({ label, value, onChange }: {
    label: string; value: string; onChange: (v: string) => void
}) {
    return (
        <div className="control-row">
            <span className="control-label">{label}</span>
            <input type="color" value={value} onChange={e => onChange(e.target.value)} />
        </div>
    )
}

// ── Scene Tab ──
function SceneTab() {
    const selectedId = useEngineStore(s => s.editor.selectedNodeId)
    const node = useEngineStore(s => selectedId ? s.nodes[selectedId] : null)
    const updateNode = useEngineStore(s => s.updateNode)
    const addNode = useEngineStore(s => s.addNode)
    const fileInputRef = useRef<HTMLInputElement>(null!)
    const [dragOver, setDragOver] = useState(false)

    const handleModelFile = useCallback((file: File) => {
        if (!file.name.match(/\.(glb|gltf|fbx)$/i)) {
            alert('Please upload a .glb, .gltf, or .fbx file')
            return
        }
        const url = URL.createObjectURL(file)
        addNode({
            kind: 'model',
            name: file.name.replace(/\.(glb|gltf|fbx)$/i, ''),
            modelUrl: url,
        })
    }, [addNode])

    return (
        <div className="tab-content">
            {/* Model Import */}
            <Accordion title="Import Model" icon="📦" defaultOpen>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Drag & drop or browse for 3D files</span>
                    <InfoBubble text="Supports GLB, GLTF, and FBX formats. Drop files directly onto the viewport or use this panel. Models appear at the scene origin." />
                </div>
                <div
                    className={`drop-zone ${dragOver ? 'active' : ''}`}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                        e.preventDefault(); setDragOver(false)
                        const file = e.dataTransfer.files[0]
                        if (file) handleModelFile(file)
                    }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="drop-zone-icon">⬆️</div>
                    <div className="drop-zone-text">Drop GLB/GLTF/FBX here</div>
                    <div className="drop-zone-hint">or click to browse</div>
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".glb,.gltf,.fbx"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleModelFile(file)
                    }}
                />
            </Accordion>

            <SceneHierarchy />
            {node && (
                <Accordion title="Transform" icon="📐" defaultOpen>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Position, rotation & scale</span>
                        <InfoBubble text="Edit X/Y/Z values directly or use the viewport gizmos. Rotation is in degrees. Use W/E/R keys to switch between Move/Rotate/Scale tools." />
                    </div>
                    <div className="transform-grid">
                        {(['position', 'rotation', 'scale'] as const).map(prop => (
                            <div key={prop} className="transform-section">
                                <div className="transform-label">{prop.charAt(0).toUpperCase() + prop.slice(1)}</div>
                                <div className="transform-inputs">
                                    {(['x', 'y', 'z'] as const).map(axis => (
                                        <div key={axis} className="axis-input">
                                            <span className={`axis-label axis-${axis}`}>{axis.toUpperCase()}</span>
                                            <input
                                                type="number"
                                                step={prop === 'rotation' ? 5 : 0.1}
                                                value={node.transform[prop][axis]}
                                                onChange={e => {
                                                    const val = parseFloat(e.target.value) || 0
                                                    updateNode(node.id, {
                                                        transform: {
                                                            ...node.transform,
                                                            [prop]: { ...node.transform[prop], [axis]: val }
                                                        }
                                                    })
                                                }}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </Accordion>
            )}
        </div>
    )
}

// ── Materials Tab ──
function MaterialsTab() {
    const selectedId = useEngineStore(s => s.editor.selectedNodeId)
    const node = useEngineStore(s => selectedId ? s.nodes[selectedId] : null)
    const updateNode = useEngineStore(s => s.updateNode)

    if (!node || !node.material) {
        return (
            <div className="tab-content">
                <div className="empty-tab">
                    <div className="empty-icon">🎨</div>
                    <div className="empty-text">Select a mesh to edit materials</div>
                </div>
            </div>
        )
    }

    const mat = node.material
    const setMat = (patch: any) => updateNode(node.id, { material: { ...mat, ...patch } })

    return (
        <div className="tab-content">
            <Accordion title="Material Presets" icon="🎨" defaultOpen>
                <div className="preset-carousel">
                    {(Object.keys(PRESETS) as MaterialPreset[]).map(preset => (
                        <button
                            key={preset}
                            className={`preset-card glass-btn ${mat.preset === preset ? 'active' : ''}`}
                            onClick={() => setMat({ ...PRESETS[preset], preset })}
                        >
                            <div className="preset-swatch" style={{
                                background: PRESETS[preset].metalness > 0.5
                                    ? `linear-gradient(135deg, ${PRESETS[preset].color}, #fff)`
                                    : PRESETS[preset].color,
                                opacity: PRESETS[preset].opacity,
                            }} />
                            <span className="preset-name">{preset}</span>
                        </button>
                    ))}
                </div>
            </Accordion>

            <Accordion title="PBR Properties" icon="🔧" defaultOpen>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Physical material settings</span>
                    <InfoBubble text="PBR (Physically-Based Rendering) controls how light interacts with surfaces. Metalness=1 for metals, Roughness=0 for mirror. Emissive makes objects glow." />
                </div>
                <ColorRow label="Color" value={mat.color} onChange={v => setMat({ color: v })} />
                <SliderRow label="Metalness" value={mat.metalness} min={0} max={1} step={0.01} onChange={v => setMat({ metalness: v })} />
                <SliderRow label="Roughness" value={mat.roughness} min={0} max={1} step={0.01} onChange={v => setMat({ roughness: v })} />
                <ColorRow label="Emissive" value={mat.emissive} onChange={v => setMat({ emissive: v })} />
                <SliderRow label="Emissive Int." value={mat.emissiveIntensity} min={0} max={5} step={0.1} onChange={v => setMat({ emissiveIntensity: v })} />
                <SliderRow label="Opacity" value={mat.opacity} min={0} max={1} step={0.01} onChange={v => setMat({ opacity: v })} />
                <ToggleRow label="Transparent" value={mat.transparent} onChange={v => setMat({ transparent: v })} />
                <ToggleRow label="Wireframe" value={mat.wireframe} onChange={v => setMat({ wireframe: v })} />
            </Accordion>
        </div>
    )
}

// ── Animation Tab ──
function AnimationTab() {
    const timeline = useEngineStore(s => s.timeline)
    const setPlaying = useEngineStore(s => s.setPlaying)
    const setCurrentTime = useEngineStore(s => s.setCurrentTime)
    const setDuration = useEngineStore(s => s.setDuration)
    const setTimelineSpeed = useEngineStore(s => s.setTimelineSpeed)
    const toggleLoop = useEngineStore(s => s.toggleLoop)
    const addKeyframe = useEngineStore(s => s.addKeyframe)
    const selectedId = useEngineStore(s => s.editor.selectedNodeId)
    const node = useEngineStore(s => selectedId ? s.nodes[selectedId] : null)

    return (
        <div className="tab-content">
            <Accordion title="Playback" icon="▶️" defaultOpen>
                <div className="playback-controls">
                    <button className="glass-btn playback-btn" onClick={() => setCurrentTime(0)} title="Rewind">⏮</button>
                    <button className={`glass-btn playback-btn ${timeline.playing ? 'active' : ''}`}
                        onClick={() => setPlaying(!timeline.playing)} title={timeline.playing ? 'Pause' : 'Play'}>
                        {timeline.playing ? '⏸' : '▶'}
                    </button>
                    <button className="glass-btn playback-btn" onClick={() => { setPlaying(false); setCurrentTime(0) }} title="Stop">⏹</button>
                    <button className={`glass-btn playback-btn ${timeline.looping ? 'active' : ''}`}
                        onClick={toggleLoop} title="Loop">🔁</button>
                </div>
                <SliderRow label="Time" value={timeline.currentTime} min={0} max={timeline.duration} step={0.1}
                    onChange={v => setCurrentTime(v)} unit="s" />
                <SliderRow label="Duration" value={timeline.duration} min={1} max={60} step={1}
                    onChange={v => setDuration(v)} unit="s" />
                <SliderRow label="Speed" value={timeline.speed} min={0.1} max={5} step={0.1}
                    onChange={v => setTimelineSpeed(v)} unit="×" />
            </Accordion>

            {node && (
                <Accordion title="Keyframes" icon="💎" defaultOpen>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Animate properties over time</span>
                        <InfoBubble text="Set the timeline position, adjust the object's transform, then click a keyframe button. The engine interpolates between keyframes automatically." />
                    </div>
                    <div className="keyframe-actions">
                        <button className="glass-btn btn-sm" onClick={() => addKeyframe(node.id, 'position.x', node.transform.position.x)}>
                            + Position X
                        </button>
                        <button className="glass-btn btn-sm" onClick={() => addKeyframe(node.id, 'position.y', node.transform.position.y)}>
                            + Position Y
                        </button>
                        <button className="glass-btn btn-sm" onClick={() => addKeyframe(node.id, 'rotation.y', node.transform.rotation.y)}>
                            + Rotation Y
                        </button>
                        <button className="glass-btn btn-sm" onClick={() => addKeyframe(node.id, 'scale', node.transform.scale.x)}>
                            + Scale
                        </button>
                    </div>

                    {timeline.tracks.filter(t => t.nodeId === node.id).length === 0 ? (
                        <div className="empty-hint">No keyframes — position the object, set the time, and click a button above</div>
                    ) : (
                        <div className="track-list">
                            {timeline.tracks.filter(t => t.nodeId === node.id).map(track => (
                                <div key={track.id} className="track-item glass-card">
                                    <div className="track-name">{track.property}</div>
                                    <div className="keyframe-dots">
                                        {track.keyframes.map((kf, i) => (
                                            <span key={i} className="keyframe-dot" title={`t=${kf.time.toFixed(1)}s val=${kf.value.toFixed(2)}`}>
                                                ◆
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Accordion>
            )}
        </div>
    )
}

// ── Lighting Tab ──
function LightingTab() {
    const env = useEngineStore(s => s.environment)
    const updateEnv = useEngineStore(s => s.updateEnvironment)

    const envPresets: EnvironmentPreset[] = ['studio', 'sunset', 'forest', 'city', 'warehouse', 'night', 'dawn', 'apartment']

    return (
        <div className="tab-content">
            <Accordion title="Environment" icon="🌍" defaultOpen>
                <div className="control-row">
                    <span className="control-label">Type</span>
                    <select value={env.type} onChange={e => updateEnv({ type: e.target.value as any })}>
                        <option value="gradient">Gradient</option>
                        <option value="color">Solid</option>
                        <option value="hdri">HDRI</option>
                        <option value="sky">Sky</option>
                    </select>
                </div>

                {env.type === 'hdri' && (
                    <div className="preset-carousel">
                        {envPresets.map(p => (
                            <button key={p} className={`preset-card glass-btn ${env.hdriPreset === p ? 'active' : ''}`}
                                onClick={() => updateEnv({ hdriPreset: p })}>
                                <div className="preset-swatch env-swatch" data-preset={p} />
                                <span className="preset-name">{p}</span>
                            </button>
                        ))}
                    </div>
                )}

                {(env.type === 'color' || env.type === 'gradient') && (
                    <>
                        <ColorRow label="Color 1" value={env.color1} onChange={v => updateEnv({ color1: v })} />
                        {env.type === 'gradient' && (
                            <ColorRow label="Color 2" value={env.color2} onChange={v => updateEnv({ color2: v })} />
                        )}
                    </>
                )}
            </Accordion>

            <Accordion title="Atmosphere" icon="🌫️">
                <ToggleRow label="Ground Shadow" value={env.groundShadow} onChange={v => updateEnv({ groundShadow: v })} />
                <ToggleRow label="Fog" value={env.fog} onChange={v => updateEnv({ fog: v })} />
                {env.fog && (
                    <>
                        <ColorRow label="Fog Color" value={env.fogColor} onChange={v => updateEnv({ fogColor: v })} />
                        <SliderRow label="Near" value={env.fogNear} min={1} max={50} step={1} onChange={v => updateEnv({ fogNear: v })} />
                        <SliderRow label="Far" value={env.fogFar} min={10} max={200} step={5} onChange={v => updateEnv({ fogFar: v })} />
                    </>
                )}
            </Accordion>

            <Accordion title="Camera" icon="🎥">
                <SliderRow label="FOV" value={useEngineStore.getState().camera.fov} min={20} max={120} step={1}
                    onChange={v => useEngineStore.getState().updateCamera({ fov: v })} unit="°" />
                <ToggleRow label="Auto Rotate" value={useEngineStore.getState().camera.autoRotate}
                    onChange={v => useEngineStore.getState().updateCamera({ autoRotate: v })} />
                <SliderRow label="Rotate Speed" value={useEngineStore.getState().camera.autoRotateSpeed}
                    min={0.1} max={5} step={0.1}
                    onChange={v => useEngineStore.getState().updateCamera({ autoRotateSpeed: v })} unit="×" />
            </Accordion>
        </div>
    )
}

// ── Effects Tab ──
function EffectsTab() {
    const pp = useEngineStore(s => s.postProcessing)
    const updateEffect = useEngineStore(s => s.updateEffect)

    return (
        <div className="tab-content">
            <Accordion title="Bloom" icon="🌟" defaultOpen>
                <ToggleRow label="Enabled" value={pp.bloom.enabled} onChange={v => updateEffect('bloom', { enabled: v })} />
                {pp.bloom.enabled && (
                    <>
                        <SliderRow label="Intensity" value={pp.bloom.intensity} min={0} max={3} step={0.05} onChange={v => updateEffect('bloom', { intensity: v })} />
                        <SliderRow label="Threshold" value={pp.bloom.threshold} min={0} max={1} step={0.05} onChange={v => updateEffect('bloom', { threshold: v })} />
                    </>
                )}
            </Accordion>

            <Accordion title="SSAO" icon="🔲">
                <ToggleRow label="Enabled" value={pp.ssao.enabled} onChange={v => updateEffect('ssao', { enabled: v })} />
                {pp.ssao.enabled && (
                    <>
                        <SliderRow label="Intensity" value={pp.ssao.intensity} min={0} max={2} step={0.05} onChange={v => updateEffect('ssao', { intensity: v })} />
                        <SliderRow label="Radius" value={pp.ssao.radius} min={0.1} max={2} step={0.05} onChange={v => updateEffect('ssao', { radius: v })} />
                    </>
                )}
            </Accordion>

            <Accordion title="Depth of Field" icon="📷">
                <ToggleRow label="Enabled" value={pp.dof.enabled} onChange={v => updateEffect('dof', { enabled: v })} />
                {pp.dof.enabled && (
                    <>
                        <SliderRow label="Focus Dist" value={pp.dof.focusDistance} min={0} max={20} step={0.1} onChange={v => updateEffect('dof', { focusDistance: v })} />
                        <SliderRow label="Bokeh" value={pp.dof.bokehScale} min={0} max={10} step={0.5} onChange={v => updateEffect('dof', { bokehScale: v })} />
                    </>
                )}
            </Accordion>

            <Accordion title="Vignette" icon="⬛">
                <ToggleRow label="Enabled" value={pp.vignette.enabled} onChange={v => updateEffect('vignette', { enabled: v })} />
                {pp.vignette.enabled && (
                    <>
                        <SliderRow label="Darkness" value={pp.vignette.darkness} min={0} max={1} step={0.05} onChange={v => updateEffect('vignette', { darkness: v })} />
                        <SliderRow label="Offset" value={pp.vignette.offset} min={0} max={1} step={0.05} onChange={v => updateEffect('vignette', { offset: v })} />
                    </>
                )}
            </Accordion>

            <Accordion title="Color Grading" icon="🌈">
                <ToggleRow label="Enabled" value={pp.colorGrading.enabled} onChange={v => updateEffect('colorGrading', { enabled: v })} />
                {pp.colorGrading.enabled && (
                    <>
                        <SliderRow label="Brightness" value={pp.colorGrading.brightness} min={-5} max={5} step={0.1} onChange={v => updateEffect('colorGrading', { brightness: v })} />
                        <SliderRow label="Contrast" value={pp.colorGrading.contrast} min={-5} max={5} step={0.1} onChange={v => updateEffect('colorGrading', { contrast: v })} />
                        <SliderRow label="Saturation" value={pp.colorGrading.saturation} min={-5} max={5} step={0.1} onChange={v => updateEffect('colorGrading', { saturation: v })} />
                        <SliderRow label="Hue Shift" value={pp.colorGrading.hueShift} min={-180} max={180} step={5} onChange={v => updateEffect('colorGrading', { hueShift: v })} unit="°" />
                    </>
                )}
            </Accordion>

            <Accordion title="Film Grain" icon="📺">
                <ToggleRow label="Enabled" value={pp.filmGrain.enabled} onChange={v => updateEffect('filmGrain', { enabled: v })} />
                {pp.filmGrain.enabled && (
                    <SliderRow label="Intensity" value={pp.filmGrain.intensity} min={0} max={1} step={0.05} onChange={v => updateEffect('filmGrain', { intensity: v })} />
                )}
            </Accordion>

            <Accordion title="Chromatic Aberration" icon="🔮">
                <ToggleRow label="Enabled" value={pp.chromaticAberration.enabled} onChange={v => updateEffect('chromaticAberration', { enabled: v })} />
                {pp.chromaticAberration.enabled && (
                    <SliderRow label="Offset" value={pp.chromaticAberration.offset} min={0} max={0.02} step={0.001} onChange={v => updateEffect('chromaticAberration', { offset: v })} />
                )}
            </Accordion>

            <ParticlePresets />
        </div>
    )
}

// ── Particle Presets ──
const PARTICLE_OPTS: { preset: ParticlePreset; icon: string; label: string }[] = [
    { preset: 'fire', icon: '🔥', label: 'Fire' },
    { preset: 'smoke', icon: '💨', label: 'Smoke' },
    { preset: 'sparkles', icon: '✨', label: 'Sparkles' },
    { preset: 'rain', icon: '🌧️', label: 'Rain' },
    { preset: 'snow', icon: '❄️', label: 'Snow' },
    { preset: 'magic', icon: '🪄', label: 'Magic' },
    { preset: 'explosion', icon: '💥', label: 'Explosion' },
    { preset: 'fireflies', icon: '🪲', label: 'Fireflies' },
]

function ParticlePresets() {
    const addNode = useEngineStore(s => s.addNode)

    return (
        <Accordion title="Particle System" icon="🎇">
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Add particle effects to your scene</span>
                <InfoBubble text="Click any preset to add a particle emitter. Particles spawn at the emitter's position and follow its configuration. Move the emitter node to reposition." />
            </div>
            <div className="add-menu-grid">
                {PARTICLE_OPTS.map(p => (
                    <button
                        key={p.preset}
                        className="add-menu-item glass-btn"
                        onClick={() => addNode({
                            kind: 'particles',
                            name: `${p.label} Particles`,
                            particles: getParticleConfig(p.preset),
                            transform: {
                                position: { x: 0, y: 0, z: 0 },
                                rotation: { x: 0, y: 0, z: 0 },
                                scale: { x: 1, y: 1, z: 1 },
                            },
                        })}
                    >
                        <span>{p.icon}</span>
                        <span>{p.label}</span>
                    </button>
                ))}
            </div>
        </Accordion>
    )
}

// ── Export Tab ──
function ExportTab() {
    const exp = useEngineStore(s => s.exportSettings)
    const updateExport = useEngineStore(s => s.updateExport)

    const handleExportPNG = () => {
        const canvas = document.querySelector('canvas')
        if (!canvas) return
        const link = document.createElement('a')
        link.download = `trustgen-export-${Date.now()}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
    }

    const handleExportScene = () => {
        const state = useEngineStore.getState()
        const data = {
            version: '1.0',
            nodes: state.nodes,
            rootNodeIds: state.rootNodeIds,
            environment: state.environment,
            camera: state.camera,
            postProcessing: state.postProcessing,
            timeline: state.timeline,
        }
        const blob = new Blob([JSON.stringify(data, (key, val) => key === '_ref' ? undefined : val, 2)], { type: 'application/json' })
        const link = document.createElement('a')
        link.download = `trustgen-scene-${Date.now()}.json`
        link.href = URL.createObjectURL(blob)
        link.click()
    }

    const handleImportScene = () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            const text = await file.text()
            try {
                const data = JSON.parse(text)
                useEngineStore.setState({
                    nodes: data.nodes || {},
                    rootNodeIds: data.rootNodeIds || [],
                    environment: data.environment || useEngineStore.getState().environment,
                    camera: data.camera || useEngineStore.getState().camera,
                    postProcessing: data.postProcessing || useEngineStore.getState().postProcessing,
                    timeline: data.timeline || useEngineStore.getState().timeline,
                })
            } catch (err) {
                alert('Invalid scene file')
            }
        }
        input.click()
    }

    return (
        <div className="tab-content">
            <Accordion title="Screenshot" icon="📸" defaultOpen>
                <SliderRow label="Width" value={exp.width} min={640} max={7680} step={320} onChange={v => updateExport({ width: v })} unit="px" />
                <SliderRow label="Height" value={exp.height} min={480} max={4320} step={240} onChange={v => updateExport({ height: v })} unit="px" />
                <button className="btn btn-primary full-width" onClick={handleExportPNG}>
                    📥 Export PNG
                </button>
            </Accordion>

            <Accordion title="Scene File" icon="📁" defaultOpen>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Save & load your work</span>
                    <InfoBubble text="Scene files include all objects, materials, lights, animations, environment settings, and post-processing. Auto-save also runs every 30 seconds to localStorage." />
                </div>
                <div className="export-buttons">
                    <button className="btn glass-btn full-width" onClick={handleExportScene}>💾 Save Scene (.json)</button>
                    <button className="btn glass-btn full-width" onClick={handleImportScene}>📂 Load Scene (.json)</button>
                </div>
            </Accordion>
        </div>
    )
}

// ── Main Sidebar ──
export function Sidebar() {
    const activeTab = useEngineStore(s => s.editor.sidebarTab)
    const setTab = useEngineStore(s => s.setSidebarTab)
    const sidebarOpen = useEngineStore(s => s.editor.sidebarOpen)

    const renderTab = () => {
        switch (activeTab) {
            case 'scene': return <SceneTab />
            case 'materials': return <MaterialsTab />
            case 'animation': return <AnimationTab />
            case 'lighting': return <LightingTab />
            case 'effects': return <EffectsTab />
            case 'ai': return <AIGenerationPanel />
            case 'export': return <ExportTab />
        }
    }

    return (
        <aside className={`sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
            <div className="sidebar-header glass-card">
                <div className="brand">
                    <div className="brand-logo">◈</div>
                    <div>
                        <h1>TrustGen</h1>
                        <div className="subtitle">3D Engine • Animation • Export</div>
                    </div>
                </div>
            </div>

            <nav className="sidebar-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setTab(tab.id)}
                        title={tab.label}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-body">
                {renderTab()}
            </div>
        </aside>
    )
}
