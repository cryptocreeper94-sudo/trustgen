/* ====== TrustGen — Lume Studio Panel ======
 * Split-pane editor for Lume-to-3D:
 *   Left: Monaco editor with Lume syntax highlighting
 *   Right: Live 3D preview (debounced, updates as you type)
 *   Bottom: Compilation output + errors in natural language
 *   Toolbar: Run, Examples, Export
 *
 * Mobile: Stacks vertically with toggleable panels.
 * Trust Layer aesthetic: void black, cyan accents.
 */
import { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { MonacoEditor } from './MonacoEditor'
import { compileLume, LUME_EXAMPLES, type CompileResult } from '../engine/LumeTo3DCompiler'
import { buildSceneGroup, type SceneGraph, type SceneGraphNode, type PrimitiveShape } from '../engine/TextTo3DGenerator'

// ── Mini scene renderer (same lightweight approach as VariantPreview) ──

const DEG = Math.PI / 180

function makeGeo(shape: PrimitiveShape, s: { x: number; y: number; z: number }): THREE.BufferGeometry {
    switch (shape) {
        case 'box': return new THREE.BoxGeometry(s.x, s.y, s.z)
        case 'sphere': return new THREE.SphereGeometry(s.x / 2, 24, 24)
        case 'cylinder': return new THREE.CylinderGeometry(s.x / 2, s.x / 2, s.y, 24)
        case 'cone': return new THREE.ConeGeometry(s.x / 2, s.y, 24)
        case 'torus': return new THREE.TorusGeometry(s.x / 2, s.y / 2, 12, 32)
        case 'capsule': return new THREE.CapsuleGeometry(s.x / 2, s.y - s.x, 12, 12)
        case 'ring': return new THREE.RingGeometry(s.x / 3, s.x / 2, 32)
        case 'dodecahedron': return new THREE.DodecahedronGeometry(s.x / 2)
        case 'octahedron': return new THREE.OctahedronGeometry(s.x / 2)
        case 'icosahedron': return new THREE.IcosahedronGeometry(s.x / 2)
        case 'tetrahedron': return new THREE.TetrahedronGeometry(s.x / 2)
        case 'plane': return new THREE.PlaneGeometry(s.x, s.z)
        default: return new THREE.BoxGeometry(s.x, s.y, s.z)
    }
}

function makeMat(m: SceneGraphNode['material']): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color: new THREE.Color(m.color),
        metalness: m.metalness,
        roughness: m.roughness,
        emissive: m.emissive ? new THREE.Color(m.emissive) : undefined,
        emissiveIntensity: m.emissiveIntensity ?? 0,
        opacity: m.opacity ?? 1,
        transparent: m.transparent ?? false,
        side: THREE.DoubleSide,
    })
}

function LumePreviewScene({ sceneGraph }: { sceneGraph: SceneGraph }) {
    const meshes = useMemo(() => {
        return sceneGraph.objects.map((node, i) => ({
            key: `${node.name}-${i}`,
            geometry: makeGeo(node.shape, node.size),
            material: makeMat(node.material),
            position: [node.position.x, node.position.y, node.position.z] as [number, number, number],
            rotation: [node.rotation.x * DEG, node.rotation.y * DEG, node.rotation.z * DEG] as [number, number, number],
        }))
    }, [sceneGraph])

    return (
        <>
            <ambientLight intensity={0.35} />
            <directionalLight position={[4, 5, 3]} intensity={1.1} color="#e8f0ff" castShadow />
            <directionalLight position={[-3, 3, -2]} intensity={0.25} color="#06b6d4" />
            <pointLight position={[0, 4, 0]} intensity={0.3} color="#a855f7" />

            {/* Ground plane */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
                <planeGeometry args={[20, 20]} />
                <meshStandardMaterial color="#0a0a10" roughness={0.95} metalness={0} />
            </mesh>

            {/* Grid */}
            <gridHelper args={[10, 10, '#1a1a2e', '#10101a']} position={[0, 0, 0]} />

            {meshes.map(m => (
                <mesh
                    key={m.key}
                    geometry={m.geometry}
                    material={m.material}
                    position={m.position}
                    rotation={m.rotation}
                    castShadow
                    receiveShadow
                />
            ))}
        </>
    )
}

// ── Empty state scene ──

function EmptyScene() {
    const meshRef = useRef<THREE.Mesh>(null)
    useFrame(({ clock }) => {
        if (meshRef.current) {
            meshRef.current.rotation.y = clock.getElapsedTime() * 0.5
            meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.3) * 0.2
        }
    })
    return (
        <>
            <ambientLight intensity={0.3} />
            <directionalLight position={[3, 4, 2]} intensity={0.8} />
            <mesh ref={meshRef}>
                <icosahedronGeometry args={[0.5, 0]} />
                <meshStandardMaterial color="#06b6d4" wireframe opacity={0.3} transparent />
            </mesh>
        </>
    )
}

// ══════════════════════════════════════════
//  MAIN COMPONENT
// ══════════════════════════════════════════

export function LumeStudioPanel() {
    const [code, setCode] = useState(LUME_EXAMPLES[0].code)
    const [result, setResult] = useState<CompileResult | null>(null)
    const [livePreview, setLivePreview] = useState(true)
    const [mobileView, setMobileView] = useState<'editor' | 'preview' | 'output'>('editor')
    const debounceRef = useRef<ReturnType<typeof setTimeout>>()

    // ── Auto-compile on code change (debounced) ──
    useEffect(() => {
        if (!livePreview) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {
            const r = compileLume(code)
            setResult(r)
        }, 400)
        return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    }, [code, livePreview])

    // ── Manual compile ──
    const compile = useCallback(() => {
        const r = compileLume(code)
        setResult(r)
    }, [code])

    // ── Apply to main viewport ──
    const applyToScene = useCallback(() => {
        if (!result?.sceneGraph) return
        const group = buildSceneGroup(result.sceneGraph)
        const event = new CustomEvent('trustgen:generate', {
            detail: {
                type: 'lume-to-3d',
                config: { group, sceneGraph: result.sceneGraph, description: 'Lume scene', style: 'realistic' },
            },
        })
        window.dispatchEvent(event)
    }, [result])

    // ── Export as GLB ──
    const exportGLB = useCallback(async () => {
        if (!result?.sceneGraph) return
        const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js')
        const group = buildSceneGroup(result.sceneGraph)
        const exporter = new GLTFExporter()
        exporter.parse(
            group,
            (glb) => {
                const blob = new Blob([glb as ArrayBuffer], { type: 'model/gltf-binary' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url; a.download = 'lume-scene.glb'; a.click()
                URL.revokeObjectURL(url)
            },
            (err) => console.error('Export failed:', err),
            { binary: true }
        )
    }, [result])

    return (
        <div className="lume-studio" id="lume-studio-panel">
            {/* ── Header / Toolbar ── */}
            <div className="lume-header">
                <div className="lume-header-title">
                    <span className="lume-header-orb" />
                    <span className="lume-header-text">Lume Studio</span>
                    <span className="lume-pro-badge">BETA</span>
                </div>
                <div className="lume-toolbar">
                    <button className="lume-tb-btn" onClick={compile} title="Compile">
                        ▶ Run
                    </button>
                    <button
                        className={`lume-tb-btn ${livePreview ? 'lume-tb-btn--active' : ''}`}
                        onClick={() => setLivePreview(!livePreview)}
                        title="Toggle live preview"
                    >
                        👁 Live
                    </button>
                    <button
                        className="lume-tb-btn"
                        onClick={applyToScene}
                        disabled={!result?.sceneGraph}
                        title="Apply to main viewport"
                    >
                        📌 Apply
                    </button>
                    <button
                        className="lume-tb-btn"
                        onClick={exportGLB}
                        disabled={!result?.sceneGraph}
                        title="Export as GLB"
                    >
                        📦 GLB
                    </button>
                </div>
            </div>

            {/* ── Examples ── */}
            <div className="lume-examples-bar">
                {LUME_EXAMPLES.map((ex, i) => (
                    <button
                        key={i}
                        className="lume-example-btn"
                        onClick={() => setCode(ex.code)}
                        title={ex.name}
                    >
                        {ex.name}
                    </button>
                ))}
            </div>

            {/* ── Mobile Tab Bar ── */}
            <div className="lume-mobile-tabs">
                {(['editor', 'preview', 'output'] as const).map(tab => (
                    <button
                        key={tab}
                        className={`lume-mobile-tab ${mobileView === tab ? 'lume-mobile-tab--active' : ''}`}
                        onClick={() => setMobileView(tab)}
                    >
                        {tab === 'editor' ? '✏️ Code' : tab === 'preview' ? '🧊 Preview' : '📋 Output'}
                    </button>
                ))}
            </div>

            {/* ── Split Pane ── */}
            <div className="lume-split">
                {/* Editor */}
                <div className={`lume-editor-pane ${mobileView !== 'editor' ? 'lume-hide-mobile' : ''}`}>
                    <MonacoEditor
                        value={code}
                        language="lume"
                        onChange={setCode}
                    />
                </div>

                {/* Preview */}
                <div className={`lume-preview-pane ${mobileView !== 'preview' ? 'lume-hide-mobile' : ''}`}>
                    <Canvas
                        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
                        shadows
                        dpr={[1, 2]}
                        camera={{ position: [4, 3, 4], fov: 45, near: 0.1, far: 100 }}
                        style={{ background: '#06060a' }}
                    >
                        {result?.sceneGraph ? (
                            <LumePreviewScene sceneGraph={result.sceneGraph} />
                        ) : (
                            <EmptyScene />
                        )}
                        <OrbitControls enableDamping dampingFactor={0.05} />
                    </Canvas>

                    {/* Stats overlay */}
                    {result?.sceneGraph && (
                        <div className="lume-preview-stats">
                            <span>{result.sceneGraph.objects.length} objects</span>
                            <span>{result.commands.length} commands</span>
                            {result.errors.length > 0 && (
                                <span className="lume-preview-stat-err">{result.errors.length} errors</span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Output/Console ── */}
            <div className={`lume-output ${mobileView !== 'output' ? 'lume-hide-mobile-output' : ''}`}>
                <div className="lume-output-header">
                    <span className="lume-output-title">Console</span>
                    {result && (
                        <span className={`lume-output-status ${result.success ? 'lume-output-status--ok' : 'lume-output-status--err'}`}>
                            {result.success ? '✅ Compiled' : '❌ Errors'}
                        </span>
                    )}
                </div>
                <div className="lume-output-log">
                    {!result && (
                        <div className="lume-output-empty">
                            Write Lume code and press ▶ Run or enable 👁 Live preview
                        </div>
                    )}
                    {result?.errors.map((e, i) => (
                        <div key={i} className="lume-output-error">
                            <span className="lume-output-line">Line {e.line}:</span> {e.message}
                            <div className="lume-output-suggestion">💡 {e.suggestion}</div>
                        </div>
                    ))}
                    {result?.warnings.map((w, i) => (
                        <div key={i} className="lume-output-warning">⚠️ {w}</div>
                    ))}
                    {result?.success && result.commands.length > 0 && (
                        <div className="lume-output-success">
                            ✅ Compiled {result.commands.length} commands → {result.sceneGraph?.objects.length || 0} objects
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default LumeStudioPanel
