/* ====== TrustGen — Auto-Rigger 3D Overlay ====== */
/* Renders joint marker circles over the 3D viewport using CSS overlay positioning */
import { useCallback, useMemo, useRef, useEffect, useState } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useRigStore } from '../stores/rigStore'
import { computeBoundingBox, normalizedToWorld, worldToNormalized, buildSkeletonFromMarkers, applyRigToMesh, detectTPose } from '../engine/autoRigEngine'
import { useEngineStore } from '../store'
import type { JointMarker } from '../types/rigTypes'

// ══════════════════════════════════════════
//  JOINT MARKER OVERLAYS (HTML)
// ══════════════════════════════════════════

/** Renders HTML circle markers for each joint, positioned via 3D projection */
export function JointMarkerOverlay() {
    const { camera, gl, size } = useThree()
    const markers = useRigStore(s => s.markers)
    const activeMarkerId = useRigStore(s => s.activeMarkerId)
    const mode = useRigStore(s => s.mode)
    const targetNodeId = useRigStore(s => s.targetNodeId)
    const placeMarker = useRigStore(s => s.placeMarker)
    const moveMarker = useRigStore(s => s.moveMarker)
    const setActiveMarker = useRigStore(s => s.setActiveMarker)
    const [projectedPositions, setProjectedPositions] = useState<Map<string, { x: number; y: number; behind: boolean }>>(new Map())

    // Get the target object's bounding box
    const nodes = useEngineStore(s => s.nodes)
    const targetNode = nodes.find(n => n.id === targetNodeId)

    const objectRef = useRef<THREE.Object3D | null>(null)
    const bboxRef = useRef<THREE.Box3>(new THREE.Box3())

    // Find the 3D object in the scene
    useEffect(() => {
        if (!targetNodeId) return
        const scene = gl.domElement.parentElement?.querySelector('canvas')
        // We'll find the object traversing the Three.js scene
    }, [targetNodeId])

    // Project markers to screen coordinates each frame
    useFrame(() => {
        if (!targetNodeId || markers.length === 0) return

        const newPositions = new Map<string, { x: number; y: number; behind: boolean }>()
        const tempVec = new THREE.Vector3()

        for (const marker of markers) {
            if (!marker.placed) {
                // For unplaced markers, use default template position
                const worldPos = normalizedToWorld(marker.position, bboxRef.current)
                tempVec.copy(worldPos)
            } else {
                tempVec.set(marker.position.x, marker.position.y, marker.position.z)
                const worldPos = normalizedToWorld(marker.position, bboxRef.current)
                tempVec.copy(worldPos)
            }

            // Project to NDC
            tempVec.project(camera)

            const behind = tempVec.z > 1
            const x = (tempVec.x * 0.5 + 0.5) * size.width
            const y = (-tempVec.y * 0.5 + 0.5) * size.height

            newPositions.set(marker.id, { x, y, behind })
        }

        setProjectedPositions(newPositions)
    })

    return null // Rendering happens in the HTML overlay
}

// ══════════════════════════════════════════
//  BONE VISUALIZATION
// ══════════════════════════════════════════

/** Renders bone connections between placed markers as lines */
export function BoneVisualization() {
    const markers = useRigStore(s => s.markers)
    const showBones = useRigStore(s => s.showBones)
    const targetNodeId = useRigStore(s => s.targetNodeId)

    const lineGeometry = useMemo(() => {
        if (!showBones) return null

        const placedMarkers = markers.filter(m => m.placed)
        if (placedMarkers.length < 2) return null

        const points: THREE.Vector3[] = []
        const markerMap = new Map(placedMarkers.map(m => [m.id, m]))

        for (const marker of placedMarkers) {
            if (marker.parentId && markerMap.has(marker.parentId)) {
                const parent = markerMap.get(marker.parentId)!
                points.push(
                    new THREE.Vector3(marker.position.x, marker.position.y, marker.position.z),
                    new THREE.Vector3(parent.position.x, parent.position.y, parent.position.z)
                )
            }
        }

        if (points.length === 0) return null
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        return geometry
    }, [markers, showBones])

    if (!lineGeometry || !showBones) return null

    return (
        <lineSegments geometry={lineGeometry}>
            <lineBasicMaterial color="#22d3ee" linewidth={2} transparent opacity={0.7} />
        </lineSegments>
    )
}

// ══════════════════════════════════════════
//  JOINT SPHERES (in-scene 3D markers)
// ══════════════════════════════════════════

function JointSphere({ marker, isActive }: { marker: JointMarker; isActive: boolean }) {
    const setActiveMarker = useRigStore(s => s.setActiveMarker)
    const size = marker.placed ? marker.radius : marker.radius * 0.7
    const opacity = marker.placed ? 0.9 : 0.35

    return (
        <mesh
            position={[marker.position.x, marker.position.y, marker.position.z]}
            onClick={(e) => {
                e.stopPropagation()
                setActiveMarker(marker.id)
            }}
        >
            {/* Outer ring */}
            <ringGeometry args={[size * 0.6, size, 32]} />
            <meshBasicMaterial
                color={isActive ? '#ffffff' : marker.color}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
                depthTest={false}
            />
        </mesh>
    )
}

/** Renders center dots for each joint marker */
function JointCenter({ marker, isActive }: { marker: JointMarker; isActive: boolean }) {
    return (
        <mesh
            position={[marker.position.x, marker.position.y, marker.position.z]}
        >
            <sphereGeometry args={[marker.radius * 0.2, 16, 16]} />
            <meshBasicMaterial
                color={isActive ? '#ffffff' : marker.color}
                transparent
                opacity={marker.placed ? 1 : 0.4}
                depthTest={false}
            />
        </mesh>
    )
}

// ══════════════════════════════════════════
//  RAYCASTER FOR JOINT PLACEMENT
// ══════════════════════════════════════════

export function RigRaycaster() {
    const active = useRigStore(s => s.active)
    const mode = useRigStore(s => s.mode)
    const targetNodeId = useRigStore(s => s.targetNodeId)
    const placeNextMarker = useRigStore(s => s.placeNextMarker)
    const { scene, camera, gl } = useThree()

    const handleClick = useCallback((event: THREE.Event) => {
        if (!active || mode !== 'placing' || !targetNodeId) return

        const raycaster = new THREE.Raycaster()
        const rect = gl.domElement.getBoundingClientRect()
        const mouse = new THREE.Vector2(
            ((event as any).clientX - rect.left) / rect.width * 2 - 1,
            -((event as any).clientY - rect.top) / rect.height * 2 + 1
        )

        raycaster.setFromCamera(mouse, camera)

        // Find the target mesh
        const meshes: THREE.Mesh[] = []
        scene.traverse((child) => {
            if (child instanceof THREE.Mesh && child.userData?.nodeId === targetNodeId) {
                meshes.push(child)
            }
        })

        // Also try parent groups
        if (meshes.length === 0) {
            scene.traverse((child) => {
                if (child.userData?.nodeId === targetNodeId) {
                    child.traverse((c) => {
                        if (c instanceof THREE.Mesh) meshes.push(c)
                    })
                }
            })
        }

        if (meshes.length === 0) return

        const intersects = raycaster.intersectObjects(meshes, true)
        if (intersects.length > 0) {
            const hit = intersects[0]
            // Convert hit point to normalized bbox space
            const bbox = computeBoundingBox(meshes[0].parent || meshes[0])
            const normalized = worldToNormalized(hit.point, bbox)
            placeNextMarker(normalized)
        }
    }, [active, mode, targetNodeId, scene, camera, gl, placeNextMarker])

    useEffect(() => {
        if (!active) return
        const canvas = gl.domElement
        canvas.addEventListener('click', handleClick as any)
        return () => canvas.removeEventListener('click', handleClick as any)
    }, [active, handleClick, gl])

    return null
}

// ══════════════════════════════════════════
//  MAIN AUTO-RIGGER COMPONENT
// ══════════════════════════════════════════

export default function AutoRigger() {
    const active = useRigStore(s => s.active)
    const markers = useRigStore(s => s.markers)
    const activeMarkerId = useRigStore(s => s.activeMarkerId)
    const showBones = useRigStore(s => s.showBones)

    if (!active) return null

    return (
        <group>
            {/* Joint marker spheres */}
            {markers.map(marker => (
                <group key={marker.id}>
                    <JointSphere marker={marker} isActive={marker.id === activeMarkerId} />
                    <JointCenter marker={marker} isActive={marker.id === activeMarkerId} />
                </group>
            ))}

            {/* Bone connection lines */}
            {showBones && <BoneVisualization />}

            {/* Raycaster for click-to-place */}
            <RigRaycaster />
        </group>
    )
}
