/* ====== TrustGen — Auto-Rig Engine ====== */
/* Builds THREE.Skeleton from placed joint markers and computes skinning weights */
import * as THREE from 'three'
import type { JointMarker, BoneDefinition } from '../types/rigTypes'
import type { Vec3 } from '../types'

// ══════════════════════════════════
//  BOUNDING BOX UTILITIES
// ══════════════════════════════════

/** Compute the bounding box of a mesh or group */
export function computeBoundingBox(object: THREE.Object3D): THREE.Box3 {
    const box = new THREE.Box3()
    object.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.geometry.computeBoundingBox()
            if (child.geometry.boundingBox) {
                const worldBox = child.geometry.boundingBox.clone()
                worldBox.applyMatrix4(child.matrixWorld)
                box.union(worldBox)
            }
        }
    })
    return box
}

/** Convert normalized [0,1] position to world position within bounding box */
export function normalizedToWorld(normalized: Vec3, box: THREE.Box3): THREE.Vector3 {
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    return new THREE.Vector3(
        center.x + (normalized.x - 0.5) * size.x,
        box.min.y + normalized.y * size.y,
        center.z + (normalized.z - 0.5) * size.z
    )
}

/** Convert world position back to normalized bounding box space */
export function worldToNormalized(world: THREE.Vector3, box: THREE.Box3): Vec3 {
    const size = new THREE.Vector3()
    const center = new THREE.Vector3()
    box.getSize(size)
    box.getCenter(center)
    return {
        x: (world.x - center.x) / size.x + 0.5,
        y: (world.y - box.min.y) / size.y,
        z: (world.z - center.z) / size.z + 0.5,
    }
}

// ══════════════════════════════════
//  T-POSE DETECTION
// ══════════════════════════════════

export interface TPoseResult {
    isTPose: boolean
    confidence: number
    message: string
}

/** Simple heuristic T-pose detection for humanoid models */
export function detectTPose(object: THREE.Object3D): TPoseResult {
    const box = computeBoundingBox(object)
    const size = new THREE.Vector3()
    box.getSize(size)

    const aspectRatio = size.x / size.y


    // T-pose: arms extended = wide aspect ratio (> 0.8)
    // A-pose or relaxed: narrower (< 0.6)
    if (aspectRatio > 0.7) {
        return { isTPose: true, confidence: Math.min(aspectRatio / 1.0, 1), message: 'Model appears to be in T-pose ✓' }
    } else if (aspectRatio > 0.5) {
        return { isTPose: false, confidence: 0.5, message: '⚠️ Model may be in A-pose. Rigging may produce suboptimal weights.' }
    }
    return { isTPose: false, confidence: 0.2, message: '⚠️ Model does not appear to be in T-pose. Consider re-posing before rigging.' }
}

// ══════════════════════════════════
//  SKELETON BUILDER
// ══════════════════════════════════

/** Build a THREE.Skeleton from placed joint markers */
export function buildSkeletonFromMarkers(
    markers: JointMarker[],
    objectBBox: THREE.Box3
): { skeleton: THREE.Skeleton; bones: BoneDefinition[]; rootBone: THREE.Bone } {
    const placedMarkers = markers.filter(m => m.placed)
    if (placedMarkers.length < 2) throw new Error('Need at least 2 placed joints to build skeleton')

    // Build bone definitions
    const boneDefs: BoneDefinition[] = []
    const boneMap: Map<string, THREE.Bone> = new Map()

    // Create bones
    for (const marker of placedMarkers) {
        const bone = new THREE.Bone()
        bone.name = marker.name
        const worldPos = normalizedToWorld(marker.position, objectBBox)
        bone.position.copy(worldPos)
        boneMap.set(marker.name, bone)
    }

    // Establish parent-child relationships
    let rootBone: THREE.Bone | null = null
    for (const marker of placedMarkers) {
        const bone = boneMap.get(marker.name)!
        if (marker.parentId) {
            const parentMarker = placedMarkers.find(m => m.id === marker.parentId)
            if (parentMarker) {
                const parentBone = boneMap.get(parentMarker.name)
                if (parentBone) {
                    parentBone.add(bone)
                    // Convert child position to parent-relative
                    const parentWorldPos = normalizedToWorld(parentMarker.position, objectBBox)
                    const childWorldPos = normalizedToWorld(marker.position, objectBBox)
                    bone.position.copy(childWorldPos.sub(parentWorldPos))

                    // Create bone definition
                    boneDefs.push({
                        name: marker.name,
                        head: parentMarker.position,
                        tail: marker.position,
                        parentName: parentMarker.name,
                        roll: 0,
                        length: parentWorldPos.distanceTo(childWorldPos.add(parentWorldPos)),
                        envelopeRadius: marker.radius,
                    })
                }
            }
        } else {
            rootBone = bone
            boneDefs.push({
                name: marker.name,
                head: marker.position,
                tail: marker.position,
                parentName: null,
                roll: 0,
                length: 0,
                envelopeRadius: marker.radius,
            })
        }
    }

    if (!rootBone) throw new Error('No root joint found (joint with no parent)')

    // Build skeleton
    const boneList: THREE.Bone[] = []
    rootBone.traverse((child) => {
        if (child instanceof THREE.Bone) boneList.push(child)
    })

    // Update world matrices
    rootBone.updateMatrixWorld(true)

    // Create inverse bind matrices
    const inverseBindMatrices: THREE.Matrix4[] = boneList.map(bone => {
        const m = new THREE.Matrix4()
        m.copy(bone.matrixWorld).invert()
        return m
    })

    const skeleton = new THREE.Skeleton(boneList, inverseBindMatrices)
    return { skeleton, bones: boneDefs, rootBone }
}

// ══════════════════════════════════
//  SKINNING WEIGHT COMPUTATION
// ══════════════════════════════════

/** Distance-based envelope weight computation */
export function computeSkinWeights(
    mesh: THREE.Mesh,
    skeleton: THREE.Skeleton,
    envelopeRadius: number = 0.5
): { skinIndex: THREE.BufferAttribute; skinWeight: THREE.BufferAttribute } {
    const geometry = mesh.geometry
    const posAttr = geometry.getAttribute('position')
    const vertexCount = posAttr.count
    const boneCount = skeleton.bones.length
    const MAX_INFLUENCES = 4

    const skinIndices = new Float32Array(vertexCount * MAX_INFLUENCES)
    const skinWeights = new Float32Array(vertexCount * MAX_INFLUENCES)

    // Get bone world positions
    skeleton.bones.forEach(b => b.updateMatrixWorld(true))
    const bonePositions = skeleton.bones.map(bone => {
        const pos = new THREE.Vector3()
        bone.getWorldPosition(pos)
        return pos
    })

    // Compute vertex → mesh world transform
    mesh.updateMatrixWorld(true)
    const tempVert = new THREE.Vector3()

    for (let vi = 0; vi < vertexCount; vi++) {
        tempVert.set(posAttr.getX(vi), posAttr.getY(vi), posAttr.getZ(vi))
        tempVert.applyMatrix4(mesh.matrixWorld)

        // Score each bone by inverse distance with envelope falloff
        const scores: { index: number; weight: number }[] = []
        for (let bi = 0; bi < boneCount; bi++) {
            const dist = tempVert.distanceTo(bonePositions[bi])
            // Envelope capsule falloff: 1 at center, 0 at envelope radius
            const weight = Math.max(0, 1 - (dist / envelopeRadius))
            if (weight > 0.001) {
                scores.push({ index: bi, weight: weight * weight }) // quadratic falloff
            }
        }

        // Sort by weight descending, take top 4
        scores.sort((a, b) => b.weight - a.weight)
        const top = scores.slice(0, MAX_INFLUENCES)

        // Normalize weights
        const totalWeight = top.reduce((sum, s) => sum + s.weight, 0)
        const offset = vi * MAX_INFLUENCES

        for (let j = 0; j < MAX_INFLUENCES; j++) {
            if (j < top.length && totalWeight > 0) {
                skinIndices[offset + j] = top[j].index
                skinWeights[offset + j] = top[j].weight / totalWeight
            } else {
                skinIndices[offset + j] = 0
                skinWeights[offset + j] = 0
            }
        }
    }

    return {
        skinIndex: new THREE.BufferAttribute(new Uint16Array(skinIndices), MAX_INFLUENCES),
        skinWeight: new THREE.BufferAttribute(skinWeights, MAX_INFLUENCES),
    }
}

// ══════════════════════════════════
//  APPLY RIG TO MESH
// ══════════════════════════════════

/** Convert a regular Mesh into a SkinnedMesh with the given skeleton */
export function applyRigToMesh(
    mesh: THREE.Mesh,
    skeleton: THREE.Skeleton,
    rootBone: THREE.Bone,
    envelopeRadius?: number
): THREE.SkinnedMesh {
    // Compute skin weights
    const { skinIndex, skinWeight } = computeSkinWeights(mesh, skeleton, envelopeRadius)

    // Create skinned mesh
    const skinnedMesh = new THREE.SkinnedMesh(mesh.geometry.clone(), mesh.material)
    skinnedMesh.name = mesh.name + '_skinned'
    skinnedMesh.geometry.setAttribute('skinIndex', skinIndex)
    skinnedMesh.geometry.setAttribute('skinWeight', skinWeight)

    // Attach skeleton
    skinnedMesh.add(rootBone)
    skinnedMesh.bind(skeleton)
    skinnedMesh.frustumCulled = false

    // Copy transform
    skinnedMesh.position.copy(mesh.position)
    skinnedMesh.rotation.copy(mesh.rotation)
    skinnedMesh.scale.copy(mesh.scale)

    return skinnedMesh
}

// ══════════════════════════════════
//  MIRROR JOINT POSITION
// ══════════════════════════════════

/** Mirror a position across the YZ plane (flip X) */
export function mirrorPosition(pos: Vec3): Vec3 {
    return { x: 1 - pos.x, y: pos.y, z: pos.z }
}

// ══════════════════════════════════
//  INITIALIZE MARKERS FROM TEMPLATE
// ══════════════════════════════════

let _markerIdCounter = 0
function nextMarkerId(): string {
    return `jm_${++_markerIdCounter}_${Date.now()}`
}

/** Create initial markers from a rig template */
export function createMarkersFromTemplate(
    templateJoints: { name: string; type: string; defaultPosition: Vec3; parentName: string | null; mirrorName: string | null; hingeAxis?: Vec3; color: string }[]
): JointMarker[] {
    const markers: JointMarker[] = []
    const nameToId: Map<string, string> = new Map()

    // First pass: create all markers
    for (const joint of templateJoints) {
        const id = nextMarkerId()
        nameToId.set(joint.name, id)
        markers.push({
            id,
            name: joint.name,
            position: { ...joint.defaultPosition },
            type: joint.type as JointMarker['type'],
            parentId: null, // set in second pass
            mirrorId: null, // set in third pass
            placed: false,
            radius: joint.type === 'ball' ? 0.025 : 0.02,
            color: joint.color,
            hingeAxis: joint.hingeAxis,
        })
    }

    // Second pass: link parents
    for (let i = 0; i < templateJoints.length; i++) {
        const joint = templateJoints[i]
        if (joint.parentName) {
            markers[i].parentId = nameToId.get(joint.parentName) || null
        }
    }

    // Third pass: link mirrors
    for (let i = 0; i < templateJoints.length; i++) {
        const joint = templateJoints[i]
        if (joint.mirrorName) {
            markers[i].mirrorId = nameToId.get(joint.mirrorName) || null
        }
    }

    return markers
}
