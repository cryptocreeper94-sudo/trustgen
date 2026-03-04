/* ====== TrustGen — Scene Node 3D Renderer ====== */
import { useRef, useEffect, Suspense } from 'react'
import * as THREE from 'three'
import { useGLTF } from '@react-three/drei'
import { useEngineStore } from '../store'
import { ParticleSystem, getParticleConfig } from './ParticleSystem'
import type { MaterialDef, PrimitiveKind } from '../types'

function PrimitiveGeometry({ kind }: { kind: PrimitiveKind }) {
    switch (kind) {
        case 'box': return <boxGeometry args={[1, 1, 1]} />
        case 'sphere': return <sphereGeometry args={[0.5, 32, 32]} />
        case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />
        case 'cone': return <coneGeometry args={[0.5, 1, 32]} />
        case 'torus': return <torusGeometry args={[0.4, 0.15, 16, 48]} />
        case 'plane': return <planeGeometry args={[1, 1]} />
        case 'ring': return <ringGeometry args={[0.3, 0.5, 32]} />
        case 'dodecahedron': return <dodecahedronGeometry args={[0.5, 0]} />
        default: return <boxGeometry args={[1, 1, 1]} />
    }
}

function NodeMaterial({ mat }: { mat: MaterialDef }) {
    // Load textures if URLs are provided
    const mapTex = useOptionalTexture(mat.mapUrl)
    const normalTex = useOptionalTexture(mat.normalMapUrl)
    const roughTex = useOptionalTexture(mat.roughnessMapUrl)

    return (
        <meshStandardMaterial
            color={mat.color}
            metalness={mat.metalness}
            roughness={mat.roughness}
            emissive={mat.emissive}
            emissiveIntensity={mat.emissiveIntensity}
            opacity={mat.opacity}
            transparent={mat.transparent}
            wireframe={mat.wireframe}
            side={THREE.DoubleSide}
            map={mapTex || undefined}
            normalMap={normalTex || undefined}
            roughnessMap={roughTex || undefined}
        />
    )
}

function useOptionalTexture(url?: string) {
    const tex = useRef<THREE.Texture | null>(null)
    useEffect(() => {
        if (!url) { tex.current = null; return }
        const loader = new THREE.TextureLoader()
        loader.load(url, (loaded) => {
            loaded.flipY = true
            loaded.colorSpace = THREE.SRGBColorSpace
            tex.current = loaded
        })
        return () => { if (tex.current) { tex.current.dispose(); tex.current = null } }
    }, [url])
    return tex.current
}

function ModelRenderer({ url, onClick }: { url: string; onClick: (e: any) => void }) {
    const { scene } = useGLTF(url)
    const cloned = scene.clone(true)
    return (
        <primitive
            object={cloned}
            onClick={onClick}
            onPointerOver={(e: any) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
            onPointerOut={() => { document.body.style.cursor = 'auto' }}
        />
    )
}

interface SceneNode3DProps {
    nodeId: string
}

export function SceneNode3D({ nodeId }: SceneNode3DProps) {
    const node = useEngineStore(s => s.nodes[nodeId])
    const selectedId = useEngineStore(s => s.editor.selectedNodeId)
    const selectNode = useEngineStore(s => s.selectNode)
    const updateNode = useEngineStore(s => s.updateNode)
    const meshRef = useRef<THREE.Mesh>(null!)
    const groupRef = useRef<THREE.Group>(null!)

    const isSelected = selectedId === nodeId

    // Store ref on node for gizmo access
    useEffect(() => {
        const ref = node.kind === 'mesh' ? meshRef.current : groupRef.current
        if (ref) {
            updateNode(nodeId, { _ref: ref })
        }
    }, [nodeId])

    if (!node || !node.visible) return null

    const { position, rotation, scale } = node.transform
    const pos: [number, number, number] = [position.x, position.y, position.z]
    const rot: [number, number, number] = [
        rotation.x * Math.PI / 180,
        rotation.y * Math.PI / 180,
        rotation.z * Math.PI / 180,
    ]
    const scl: [number, number, number] = [scale.x, scale.y, scale.z]

    const handleClick = (e: any) => {
        e.stopPropagation()
        selectNode(nodeId)
    }

    // Render children
    const children = node.childIds.map(cid => (
        <SceneNode3D key={cid} nodeId={cid} />
    ))

    if (node.kind === 'mesh' && node.primitive && node.material) {
        return (
            <group position={pos} rotation={rot} scale={scl}>
                <mesh
                    ref={meshRef}
                    castShadow
                    receiveShadow
                    onClick={handleClick}
                    onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer' }}
                    onPointerOut={() => { document.body.style.cursor = 'auto' }}
                >
                    <PrimitiveGeometry kind={node.primitive} />
                    <NodeMaterial mat={node.material} />
                </mesh>
                {children}
            </group>
        )
    }

    if (node.kind === 'light' && node.light) {
        const lc = new THREE.Color(node.light.color)
        return (
            <group ref={groupRef} position={pos} rotation={rot} onClick={handleClick}>
                {node.light.kind === 'point' && (
                    <>
                        <pointLight
                            color={lc}
                            intensity={node.light.intensity}
                            distance={node.light.distance || 20}
                            decay={node.light.decay ?? 2}
                            castShadow={node.light.castShadow}
                        />
                        {/* Light helper sphere */}
                        <mesh scale={[0.1, 0.1, 0.1]}>
                            <sphereGeometry args={[1, 8, 8]} />
                            <meshBasicMaterial color={node.light.color} transparent opacity={0.6} />
                        </mesh>
                    </>
                )}
                {node.light.kind === 'spot' && (
                    <spotLight
                        color={lc}
                        intensity={node.light.intensity}
                        angle={node.light.angle || 0.5}
                        penumbra={node.light.penumbra || 0.5}
                        distance={node.light.distance || 20}
                        decay={node.light.decay ?? 2}
                        castShadow={node.light.castShadow}
                    />
                )}
                {node.light.kind === 'directional' && (
                    <directionalLight
                        color={lc}
                        intensity={node.light.intensity}
                        castShadow={node.light.castShadow}
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                    />
                )}
                {children}
            </group>
        )
    }

    if (node.kind === 'group') {
        return (
            <group ref={groupRef} position={pos} rotation={rot} scale={scl} onClick={handleClick}>
                {children}
            </group>
        )
    }

    if (node.kind === 'particles' && node.particles) {
        return (
            <group ref={groupRef} position={pos} rotation={rot} scale={scl} onClick={handleClick}>
                <ParticleSystem config={node.particles} />
                {children}
            </group>
        )
    }

    if (node.kind === 'model' && node.modelUrl) {
        return (
            <group ref={groupRef} position={pos} rotation={rot} scale={scl}>
                <Suspense fallback={
                    <mesh><boxGeometry args={[0.5, 0.5, 0.5]} /><meshStandardMaterial color="#a855f7" wireframe /></mesh>
                }>
                    <ModelRenderer url={node.modelUrl} onClick={handleClick} />
                </Suspense>
                {children}
            </group>
        )
    }

    // Fallback for other — render group with children
    return (
        <group ref={groupRef} position={pos} rotation={rot} scale={scl} onClick={handleClick}>
            {children}
        </group>
    )
}
