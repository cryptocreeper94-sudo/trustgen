/* ====== TrustGen — Tabbed Sidebar (Properties Inspector) ====== */
import React, { useState, useCallback, useRef } from 'react'
import { useEngineStore } from '../store'
import { useRigStore } from '../stores/rigStore'
import MotionLibrary from './MotionLibrary'
import IKControls from './IKControls'
import { MOTION_PRESETS } from '../engine/ProceduralMotionLibrary'
import { RIG_TEMPLATES } from '../types/rigTypes'
import type { RigTemplateName } from '../types/rigTypes'
import { SceneHierarchy } from './SceneHierarchy'
import { AIMegaPanel } from './AIMegaPanel'
import { PublishTab } from './PublishTab'
import { LumeScriptPanel } from './LumeScriptPanel'
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
    { id: 'ai', icon: '🧠', label: 'AI Studio' },
    { id: 'lume' as any, icon: '◈', label: 'Lume' },
    { id: 'publish' as any, icon: '📤', label: 'Publish' },
    { id: 'export', icon: '💾', label: 'Save' },
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

// ── Rigging Controls ──
function RiggingControls({ nodeId }: { nodeId: string | null }) {
    const {
        active, mode, template, markers, mirrorMode, showBones, showEnvelopes,
        startRigging, cancelRigging, setTemplate, toggleMirrorMode,
        toggleShowBones, toggleShowEnvelopes, resetMarkers, setMode,
    } = useRigStore()

    const placedCount = markers.filter(m => m.placed).length
    const totalCount = markers.length
    const progress = totalCount > 0 ? (placedCount / totalCount) * 100 : 0

    if (!nodeId) {
        return (
            <div>
                <div className="empty-hint" style={{ fontSize: 11, marginBottom: 6 }}>
                    Select a mesh node to begin rigging
                </div>
                <div className="rig-tip-box">
                    <strong>💡 Getting Started</strong>
                    <ul>
                        <li>Import a 3D model (GLB/FBX) via the Scene tab</li>
                        <li>Select the mesh in the hierarchy</li>
                        <li>Return here to begin placing joints</li>
                    </ul>
                </div>
            </div>
        )
    }

    if (!active) {
        return (
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        Place joint markers on a T-pose model to auto-generate a skeleton with skinning weights.
                    </span>
                    <InfoBubble text="Auto-rigging works best with models in T-pose (arms extended). The system places joint markers at body landmarks, then generates a bone hierarchy with automatic weight painting for mesh deformation." />
                </div>
                <div className="control-row" style={{ marginBottom: 8 }}>
                    <span className="control-label">Template</span>
                    <InfoBubble text="Templates define preset joint positions. Humanoid (23 joints) for characters, Quadruped (18 joints) for animals, Simple (5 joints) for props, or Custom for freeform joint placement." />
                    <select
                        value={template}
                        onChange={e => setTemplate(e.target.value as RigTemplateName)}
                        style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', color: 'var(--text-primary)', fontSize: 11 }}
                    >
                        {Object.values(RIG_TEMPLATES).map(t => (
                            <option key={t.name} value={t.name}>
                                {t.icon} {t.label} ({t.joints.length} joints)
                            </option>
                        ))}
                    </select>
                </div>

                <div className="rig-tip-box" style={{ marginBottom: 8 }}>
                    <strong>📋 Best Practices</strong>
                    <ul>
                        <li>Use a <b>T-pose</b> model for best results</li>
                        <li>Start with joints closest to the center (hips/spine)</li>
                        <li>Enable <b>Mirror Mode</b> to auto-place symmetric joints</li>
                        <li>You can adjust marker positions after placing them</li>
                    </ul>
                </div>

                <button
                    className="btn btn-primary"
                    style={{ width: '100%' }}
                    onClick={() => startRigging(nodeId, template)}
                >
                    🦴 Start Rigging
                </button>
            </div>
        )
    }

    return (
        <div>
            {/* Progress */}
            <div style={{ marginBottom: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        Joints Placed
                        <InfoBubble text="Click directly on the mesh surface to place each joint marker. Joints are placed sequentially — the highlighted joint in the list is the next one to place. You can also click a joint name to select and reposition it." />
                    </span>
                    <span>{placedCount} / {totalCount}</span>
                </div>
                <div className="rig-progress-bar">
                    <div className="rig-progress-fill" style={{ width: `${progress}%` }} />
                </div>
            </div>

            {/* Placement tip — shown during placing mode */}
            {mode === 'placing' && placedCount < 3 && (
                <div className="rig-tip-box" style={{ marginBottom: 6 }}>
                    <strong>🎯 Placement Tips</strong>
                    <ul>
                        <li>Click directly on the <b>mesh surface</b> where the joint should be</li>
                        <li>Orbit the camera to get a better angle</li>
                        <li>The highlighted joint below is the next to place</li>
                        {mirrorMode && <li>Mirror Mode is ON — left-side joints auto-mirror to right</li>}
                    </ul>
                </div>
            )}

            {/* Joint List */}
            <div className="rig-joint-list">
                {markers.map(marker => (
                    <div
                        key={marker.id}
                        className={`rig-joint-item ${marker.placed ? 'placed' : ''} ${useRigStore.getState().activeMarkerId === marker.id ? 'active' : ''}`}
                    >
                        <span
                            className="rig-joint-dot"
                            style={{ background: marker.placed ? marker.color : 'var(--border)' }}
                        />
                        <span className="rig-joint-name">{marker.name}</span>
                        <span className="rig-joint-type">{marker.type}</span>
                    </div>
                ))}
            </div>

            {/* Toggles */}
            <div style={{ marginTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ToggleRow label="Mirror Mode" value={mirrorMode} onChange={toggleMirrorMode} />
                    <InfoBubble text="When enabled, placing a left-side joint (e.g. L_Shoulder) automatically places the mirrored right-side joint (R_Shoulder) at the reflected position. Great for symmetric characters." />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ToggleRow label="Show Bones" value={showBones} onChange={toggleShowBones} />
                    <InfoBubble text="Renders line segments between connected joints in the viewport, showing the bone hierarchy. Useful for verifying the skeleton structure before applying weights." />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ToggleRow label="Show Envelopes" value={showEnvelopes} onChange={toggleShowEnvelopes} />
                    <InfoBubble text="Visualizes the influence radius around each bone. Vertices within an envelope are weighted to that bone. Wider envelopes = smoother but less precise deformation." />
                </div>
            </div>

            {/* Mode status */}
            <div className="rig-mode-badge" style={{ marginTop: 8 }}>
                {mode === 'placing' && `🎯 Click on mesh to place: ${markers.find(m => !m.placed)?.name || 'Done'}`}
                {mode === 'adjusting' && '✋ All joints placed — drag to adjust, then generate'}
                {mode === 'generating' && '⏳ Generating skeleton...'}
                {mode === 'complete' && '✅ Rig complete — skeleton applied'}
            </div>

            {/* Actions with tips */}
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {placedCount >= 2 && mode !== 'complete' && (
                    <button
                        className="btn btn-primary"
                        style={{ flex: 1, fontSize: 11 }}
                        onClick={() => setMode('complete')}
                        title="Builds the bone skeleton from placed markers and computes skinning weights using envelope distance-based painting"
                    >
                        ⚡ Generate & Apply
                    </button>
                )}
                <button className="btn" style={{ fontSize: 11 }} onClick={resetMarkers}
                    title="Clears all placed markers and restarts the placement process from scratch">
                    ↺ Reset
                </button>
                <button className="btn" style={{ fontSize: 11, color: 'var(--danger)' }} onClick={cancelRigging}
                    title="Exits rigging mode entirely and discards all work">
                    ✕ Cancel
                </button>
            </div>

            {/* Post-generation tips */}
            {mode === 'complete' && (
                <div className="rig-tip-box" style={{ marginTop: 8 }}>
                    <strong>✅ What's Next</strong>
                    <ul>
                        <li>Play existing animations in the <b>Skeletal Clips</b> section above</li>
                        <li>Export the rigged model via the <b>Export tab</b></li>
                        <li>The skeleton is baked into the GLB file on export</li>
                    </ul>
                </div>
            )}
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
    const updateNode = useEngineStore(s => s.updateNode)

    const skelAnim = node?.skeletalAnim

    // IK state
    const [ikActiveChains, setIkActiveChains] = useState<Set<string>>(new Set())
    const [ikWeights, setIkWeights] = useState<Record<string, number>>({})

    return (
        <div className="tab-content">
            {/* Skeletal Animation Controls */}
            {skelAnim && skelAnim.clips.length > 0 && (
                <Accordion title="Skeletal Clips" icon="🦴" defaultOpen>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                            {skelAnim.hasRig ? '✓ Rigged model' : 'Morph animations'} — {skelAnim.clips.length} clip{skelAnim.clips.length > 1 ? 's' : ''}
                        </span>
                        <InfoBubble text="Skeletal animations detected in this model. Select a clip, control playback speed, and toggle loop mode." />
                    </div>

                    {/* Clip Selector */}
                    <div className="control-row">
                        <span className="control-label">Active Clip</span>
                        <select
                            value={skelAnim.activeClipIndex}
                            onChange={e => updateNode(node!.id, {
                                skeletalAnim: { ...skelAnim, activeClipIndex: parseInt(e.target.value) }
                            })}
                            style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', color: 'var(--text)', fontSize: 11 }}
                        >
                            {skelAnim.clips.map((clip, i) => (
                                <option key={i} value={i}>
                                    {clip.name} ({clip.duration.toFixed(1)}s)
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Playback Controls */}
                    <div className="playback-controls" style={{ marginTop: 6 }}>
                        <button
                            className={`glass-btn playback-btn ${skelAnim.playing ? 'active' : ''}`}
                            onClick={() => updateNode(node!.id, {
                                skeletalAnim: { ...skelAnim, playing: !skelAnim.playing }
                            })}
                            title={skelAnim.playing ? 'Pause' : 'Play'}
                        >
                            {skelAnim.playing ? '⏸' : '▶'}
                        </button>
                        <button
                            className={`glass-btn playback-btn ${skelAnim.loop ? 'active' : ''}`}
                            onClick={() => updateNode(node!.id, {
                                skeletalAnim: { ...skelAnim, loop: !skelAnim.loop }
                            })}
                            title="Toggle Loop"
                        >🔁</button>
                    </div>

                    <SliderRow label="Speed" value={skelAnim.speed} min={0.1} max={3} step={0.1}
                        onChange={v => updateNode(node!.id, {
                            skeletalAnim: { ...skelAnim, speed: v }
                        })} unit="×" />

                    <SliderRow label="Crossfade" value={skelAnim.crossfadeDuration} min={0} max={2} step={0.1}
                        onChange={v => updateNode(node!.id, {
                            skeletalAnim: { ...skelAnim, crossfadeDuration: v }
                        })} unit="s" />

                    {/* Clip Info */}
                    <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 4, padding: '4px 0' }}>
                        {skelAnim.clips[skelAnim.activeClipIndex]?.trackCount || 0} tracks · {skelAnim.clips[skelAnim.activeClipIndex]?.duration.toFixed(2) || 0}s
                    </div>
                </Accordion>
            )}

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

            {/* ── Auto-Rigging ── */}
            <Accordion title="Auto-Rigging" icon="🦴" defaultOpen={false}>
                <RiggingControls nodeId={selectedId} />
            </Accordion>

            {/* ── Procedural Motion Library ── */}
            <Accordion title="Motion Library" icon="🎭" defaultOpen={false}>
                <MotionLibrary
                    onApplyClip={(name, params) => {
                        const preset = MOTION_PRESETS.find(p => p.name === name)
                        if (!preset || !selectedId) return
                        const clip = preset.generate(params)
                        const n = useEngineStore.getState().nodes[selectedId]
                        if (!n) return
                        const existingClips = n.skeletalAnim?.clips || []
                        updateNode(selectedId, {
                            skeletalAnim: {
                                ...(n.skeletalAnim || { hasRig: true, playing: false, loop: true, speed: 1, crossfadeDuration: 0.3, activeClipIndex: 0, clips: [] }),
                                clips: [
                                    ...existingClips,
                                    { name: clip.name, duration: clip.duration, trackCount: clip.tracks.length, _clip: clip }
                                ],
                                activeClipIndex: existingClips.length,
                                playing: true,
                            }
                        })
                    }}
                    onPreviewClip={(name, params) => {
                        const preset = MOTION_PRESETS.find(p => p.name === name)
                        if (!preset || !selectedId) return
                        const clip = preset.generate(params)
                        const n = useEngineStore.getState().nodes[selectedId]
                        if (!n) return
                        updateNode(selectedId, {
                            skeletalAnim: {
                                ...(n.skeletalAnim || { hasRig: true, playing: false, loop: false, speed: 1, crossfadeDuration: 0.3, activeClipIndex: 0, clips: [] }),
                                clips: [{ name: clip.name, duration: clip.duration, trackCount: clip.tracks.length, _clip: clip }],
                                activeClipIndex: 0,
                                playing: true,
                                loop: false,
                            }
                        })
                    }}
                />
            </Accordion>

            {/* ── Inverse Kinematics ── */}
            <Accordion title="Inverse Kinematics" icon="🎯" defaultOpen={false}>
                <IKControls
                    hasRig={!!skelAnim?.hasRig}
                    activeChains={ikActiveChains}
                    onToggleChain={(name) => {
                        setIkActiveChains(prev => {
                            const next = new Set(prev)
                            if (next.has(name)) next.delete(name)
                            else next.add(name)
                            return next
                        })
                    }}
                    onSetWeight={(name, w) => setIkWeights(prev => ({ ...prev, [name]: w }))}
                    weights={ikWeights}
                />
            </Accordion>
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
    const [vaultExporting, setVaultExporting] = useState(false)
    const [vaultResult, setVaultResult] = useState<{ hallmarkId?: string; assetUrl?: string } | null>(null)
    const [sceneName, setSceneName] = useState('My TrustGen Scene')

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

    const handleVaultExport = async () => {
        setVaultExporting(true)
        setVaultResult(null)
        try {
            const state = useEngineStore.getState()
            const sceneData = {
                version: '1.0',
                nodes: state.nodes,
                rootNodeIds: state.rootNodeIds,
                environment: state.environment,
                camera: state.camera,
                postProcessing: state.postProcessing,
                timeline: state.timeline,
            }
            const token = localStorage.getItem('trustgen-auth-token')
            const res = await fetch('/api/vault/export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ sceneName, sceneData, format: 'json' }),
            })
            const result = await res.json()
            if (result.success) {
                setVaultResult({ hallmarkId: result.hallmarkId, assetUrl: result.assetUrl })
            } else {
                alert(result.error || 'Vault export failed')
            }
        } catch (err) {
            alert('Vault export failed — check your SSO connection')
        } finally {
            setVaultExporting(false)
        }
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

            <Accordion title="TrustVault" icon="🔐">
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>Export to blockchain-verified storage</span>
                    <InfoBubble text="Exports your scene to TrustVault with automatic hallmark verification. Requires Trust Layer SSO login." />
                </div>
                <div className="control-row">
                    <span className="control-label">Scene Name</span>
                    <input
                        type="text"
                        value={sceneName}
                        onChange={e => setSceneName(e.target.value)}
                        placeholder="My Scene"
                        style={{ flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', color: 'var(--text)', fontSize: 11 }}
                    />
                </div>
                <button
                    className="btn btn-primary full-width"
                    onClick={handleVaultExport}
                    disabled={vaultExporting || !sceneName.trim()}
                    style={{ marginTop: 8 }}
                >
                    {vaultExporting ? '⏳ Exporting…' : '🔐 Export to TrustVault'}
                </button>
                {vaultResult && (
                    <div className="vault-result glass-card" style={{ marginTop: 8, padding: 8, fontSize: 10 }}>
                        <div style={{ color: '#06b6d4' }}>✓ Exported & Hallmarked</div>
                        <div style={{ color: 'var(--text-muted)', marginTop: 4 }}>
                            Hallmark: <code style={{ fontSize: 9 }}>{vaultResult.hallmarkId}</code>
                        </div>
                    </div>
                )}
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
            case 'ai': return <AIMegaPanel />
            case 'lume': return <LumeScriptPanel />
            case 'publish': return <PublishTab />
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
