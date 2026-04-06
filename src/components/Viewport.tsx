/* ====== TrustGen — 3D Viewport Canvas ====== */
import { Suspense, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import {
    OrbitControls, TransformControls, GizmoHelper, GizmoViewport,
    Grid, Stats
} from '@react-three/drei'
import * as THREE from 'three'
import { useEngineStore } from '../store'
import { useStoryStore } from '../stores/storyStore'
import { SceneNode3D } from './SceneNode3D'
import { PostProcessingPipeline } from './PostProcessing'
import { EnvironmentSetup } from './EnvironmentSetup'
import { AnimationEngine } from '../engine/AnimationEngine'
import { StoryPlayback } from '../engine/StoryPlayback'
import { StoryOverlay } from './StoryOverlay'
import { ModelImporter } from './ModelImporter'
import AutoRigger from './AutoRigger'

function LoadingFallback() {
    return (
        <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#06b6d4" wireframe />
        </mesh>
    )
}

function SceneContent() {
    const rootNodeIds = useEngineStore(s => s.rootNodeIds)
    const selectedId = useEngineStore(s => s.editor.selectedNodeId)
    const nodes = useEngineStore(s => s.nodes)
    const tool = useEngineStore(s => s.editor.tool)
    const gizmoSpace = useEngineStore(s => s.editor.gizmoSpace)
    const snapping = useEngineStore(s => s.editor.snapping)
    const snapValue = useEngineStore(s => s.editor.snapValue)
    const updateNode = useEngineStore(s => s.updateNode)
    const selectNode = useEngineStore(s => s.selectNode)
    const showGrid = useEngineStore(s => s.editor.showGrid)

    const selectedNode = selectedId ? nodes[selectedId] : null
    const selectedRef = selectedNode?._ref as THREE.Object3D | undefined

    const handleTransformChange = useCallback(() => {
        if (!selectedRef || !selectedId) return
        const pos = selectedRef.position
        const rot = selectedRef.rotation
        const scl = selectedRef.scale
        updateNode(selectedId, {
            transform: {
                position: { x: pos.x, y: pos.y, z: pos.z },
                rotation: {
                    x: rot.x * 180 / Math.PI,
                    y: rot.y * 180 / Math.PI,
                    z: rot.z * 180 / Math.PI,
                },
                scale: { x: scl.x, y: scl.y, z: scl.z },
            }
        })
    }, [selectedRef, selectedId, updateNode])

    return (
        <>
            {/* Click to deselect */}
            <mesh
                visible={false}
                position={[0, -0.01, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                onClick={() => selectNode(null)}
            >
                <planeGeometry args={[100, 100]} />
                <meshBasicMaterial />
            </mesh>

            {/* Render all root scene nodes */}
            <Suspense fallback={<LoadingFallback />}>
                {rootNodeIds.map(id => (
                    <SceneNode3D key={id} nodeId={id} />
                ))}
            </Suspense>

            {/* Transform Gizmo on selected object */}
            {selectedRef && tool !== 'select' && (
                <TransformControls
                    object={selectedRef}
                    mode={tool}
                    space={gizmoSpace}
                    translationSnap={snapping ? snapValue : undefined}
                    rotationSnap={snapping ? Math.PI / 12 : undefined}
                    scaleSnap={snapping ? 0.1 : undefined}
                    onMouseUp={handleTransformChange}
                />
            )}

            {/* Grid */}
            {showGrid && (
                <Grid
                    position={[0, -0.001, 0]}
                    args={[30, 30]}
                    cellSize={1}
                    cellThickness={0.5}
                    cellColor="#1a1a2e"
                    sectionSize={5}
                    sectionThickness={1}
                    sectionColor="#2a2a3a"
                    fadeDistance={30}
                    fadeStrength={1}
                    followCamera={false}
                    infiniteGrid
                />
            )}

            {/* Environment */}
            <EnvironmentSetup />

            {/* Gizmo navigator */}
            <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
                <GizmoViewport labelColor="white" axisHeadScale={1} />
            </GizmoHelper>

            {/* Auto-Rigger overlay */}
            <AutoRigger />
        </>
    )
}

export function Viewport() {
    const camera = useEngineStore(s => s.camera)
    const autoRotate = useEngineStore(s => s.camera.autoRotate)
    const autoRotateSpeed = useEngineStore(s => s.camera.autoRotateSpeed)
    const showStats = useEngineStore(s => s.editor.showStats)
    const postProcessing = useEngineStore(s => s.postProcessing)
    const storyPlaying = useStoryStore(s => s.playback.playing)

    return (
        <>
            <Canvas
                gl={{
                    antialias: true,
                    alpha: false,
                    powerPreference: 'high-performance',
                    stencil: false,
                    depth: true,
                    preserveDrawingBuffer: true, // Required for video export
                }}
                shadows
                dpr={[1, 2]}
                camera={{
                    position: [camera.position.x, camera.position.y, camera.position.z],
                    fov: camera.fov,
                    near: 0.1,
                    far: 200,
                }}
                onCreated={({ gl }) => {
                    gl.toneMapping = THREE.ACESFilmicToneMapping
                    gl.toneMappingExposure = 1.2
                    gl.shadowMap.type = THREE.PCFSoftShadowMap
                }}
            >
                <SceneContent />

                <OrbitControls
                    makeDefault
                    autoRotate={autoRotate && !storyPlaying}
                    autoRotateSpeed={autoRotateSpeed}
                    enableDamping={!storyPlaying}
                    dampingFactor={0.05}
                    minDistance={1}
                    maxDistance={100}
                    enabled={!storyPlaying}
                />

                {showStats && <Stats />}

                <AnimationEngine />
                <StoryPlayback />
                <PostProcessingPipeline settings={postProcessing} />
            </Canvas>
            <StoryOverlay />
            <ModelImporter />
        </>
    )
}
