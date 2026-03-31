/* ====== TrustGen — Variant Preview ======
 * Mini Three.js Canvas for variant thumbnail previews.
 * Renders a SceneGraph in a small auto-orbiting 3D view.
 * Trust Layer aesthetic: dark background, cyan accents.
 */
import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { SceneGraph, SceneGraphNode, PrimitiveShape } from '../engine/TextTo3DGenerator'

// ── Geometry & Material factories (lightweight duplicates to avoid import side-effects) ──

const DEG = Math.PI / 180

function makeGeo(shape: PrimitiveShape, s: { x: number; y: number; z: number }): THREE.BufferGeometry {
    switch (shape) {
        case 'box': return new THREE.BoxGeometry(s.x, s.y, s.z)
        case 'sphere': return new THREE.SphereGeometry(s.x / 2, 16, 16)
        case 'cylinder': return new THREE.CylinderGeometry(s.x / 2, s.x / 2, s.y, 16)
        case 'cone': return new THREE.ConeGeometry(s.x / 2, s.y, 16)
        case 'torus': return new THREE.TorusGeometry(s.x / 2, s.y / 2, 8, 24)
        case 'capsule': return new THREE.CapsuleGeometry(s.x / 2, s.y - s.x, 8, 8)
        case 'ring': return new THREE.RingGeometry(s.x / 3, s.x / 2, 24)
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

// ── Scene renderer ──

function PreviewScene({ sceneGraph }: { sceneGraph: SceneGraph }) {
    const groupRef = useRef<THREE.Group>(null)

    // Build geometry once
    const meshes = useMemo(() => {
        return sceneGraph.objects.map((node, i) => ({
            key: `${node.name}-${i}`,
            geometry: makeGeo(node.shape, node.size),
            material: makeMat(node.material),
            position: [node.position.x, node.position.y, node.position.z] as [number, number, number],
            rotation: [node.rotation.x * DEG, node.rotation.y * DEG, node.rotation.z * DEG] as [number, number, number],
        }))
    }, [sceneGraph])

    // Auto-fit camera to content
    const center = useMemo(() => {
        if (sceneGraph.objects.length === 0) return new THREE.Vector3(0, 0.5, 0)
        const box = new THREE.Box3()
        sceneGraph.objects.forEach(o => {
            const half = new THREE.Vector3(o.size.x / 2, o.size.y / 2, o.size.z / 2)
            const pos = new THREE.Vector3(o.position.x, o.position.y, o.position.z)
            box.expandByPoint(pos.clone().sub(half))
            box.expandByPoint(pos.clone().add(half))
        })
        const c = new THREE.Vector3()
        box.getCenter(c)
        return c
    }, [sceneGraph])

    // Auto-orbit
    useFrame(({ clock }) => {
        if (groupRef.current) {
            groupRef.current.rotation.y = clock.getElapsedTime() * 0.5
        }
    })

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[3, 4, 2]} intensity={1.2} color="#e8f0ff" />
            <directionalLight position={[-2, 2, -1]} intensity={0.3} color="#06b6d4" />

            {/* Scene group */}
            <group ref={groupRef} position={[-center.x, -center.y, -center.z]}>
                {meshes.map(m => (
                    <mesh
                        key={m.key}
                        geometry={m.geometry}
                        material={m.material}
                        position={m.position}
                        rotation={m.rotation}
                        castShadow
                    />
                ))}
            </group>
        </>
    )
}

// ── Public Component ──

interface VariantPreviewProps {
    sceneGraph: SceneGraph
    selected: boolean
    onClick: () => void
    label: string
    desc: string
    variantId: number
    objectCount: number
}

export function VariantPreview({
    sceneGraph, selected, onClick, label, desc, variantId, objectCount,
}: VariantPreviewProps) {
    // Estimate vertex count from objects
    const vertexEstimate = useMemo(() => {
        let count = 0
        sceneGraph.objects.forEach(o => {
            switch (o.shape) {
                case 'sphere': count += 16 * 16; break
                case 'cylinder': count += 16 * 4; break
                case 'cone': count += 16 * 2; break
                case 'torus': count += 8 * 24; break
                case 'box': count += 24; break
                default: count += 24
            }
        })
        return count
    }, [sceneGraph])

    return (
        <button
            className={`t3d-variant-card ${selected ? 't3d-variant-card--selected' : ''}`}
            onClick={onClick}
            id={`variant-preview-${variantId}`}
        >
            {/* 3D Preview Canvas */}
            <div className="t3d-variant-canvas-wrap">
                <Canvas
                    gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
                    dpr={[1, 1.5]}
                    camera={{ position: [2, 1.5, 2], fov: 40, near: 0.1, far: 50 }}
                    style={{ background: 'transparent' }}
                >
                    <PreviewScene sceneGraph={sceneGraph} />
                </Canvas>

                {/* Variant badge */}
                <span className="t3d-variant-badge">V{variantId}</span>
            </div>

            {/* Info */}
            <div className="t3d-variant-info">
                <span className="t3d-variant-label">{label}</span>
                <span className="t3d-variant-desc">{desc}</span>
            </div>

            {/* Stats bar */}
            <div className="t3d-variant-stats">
                <span>{objectCount} obj</span>
                <span>~{vertexEstimate} verts</span>
            </div>
        </button>
    )
}

export default VariantPreview
