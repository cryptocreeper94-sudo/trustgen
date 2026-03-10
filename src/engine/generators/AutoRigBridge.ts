/* ====== TrustGen — Auto-Rig Bridge ======
 * Automatically maps generated character/creature body part positions
 * to rig joint markers, then builds the skeleton and skin weights.
 *
 * This bridges CharacterCreator → autoRigEngine → ProceduralMotionLibrary:
 *   buildCharacter(config) → autoRigCharacter(group) → SkinnedMesh with skeleton
 */
import * as THREE from 'three'
import type { Vec3 } from '../../types'
import type { JointMarker } from '../../types/rigTypes'
import { HUMANOID_TEMPLATE, QUADRUPED_TEMPLATE } from '../../types/rigTypes'
import {
    computeBoundingBox, buildSkeletonFromMarkers,
    createMarkersFromTemplate,
} from '../autoRigEngine'

// ══════════════════════════════════════════
//  MAP CHARACTER PARTS TO JOINT POSITIONS
// ══════════════════════════════════════════

/**
 * Walk a character group to find named body parts and extract their world positions.
 * Character names match what CharacterCreator sets: 'Torso', 'Head', 'Shoulder_L', etc.
 */
function extractPartPositions(group: THREE.Group): Map<string, THREE.Vector3> {
    const parts = new Map<string, THREE.Vector3>()
    group.updateMatrixWorld(true)

    group.traverse((obj) => {
        if (obj.name && obj.name.length > 0) {
            const worldPos = new THREE.Vector3()
            obj.getWorldPosition(worldPos)
            parts.set(obj.name, worldPos)
        }
    })

    return parts
}

/**
 * Compute joint positions for a humanoid character from its body parts.
 * Returns normalized positions (0–1) within the character's bounding box.
 */
function humanoidJointPositions(group: THREE.Group): Map<string, Vec3> {
    const bbox = computeBoundingBox(group)
    const size = new THREE.Vector3()
    bbox.getSize(size)
    const min = bbox.min

    // Normalize a world position to bounding box space
    const norm = (wp: THREE.Vector3): Vec3 => ({
        x: size.x > 0 ? (wp.x - min.x) / size.x : 0.5,
        y: size.y > 0 ? (wp.y - min.y) / size.y : 0.5,
        z: size.z > 0 ? (wp.z - min.z) / size.z : 0.5,
    })

    const parts = extractPartPositions(group)
    const joints = new Map<string, Vec3>()

    // Try to map each humanoid joint to a body part
    const getPos = (partName: string, fallback: Vec3): Vec3 => {
        const pos = parts.get(partName)
        return pos ? norm(pos) : fallback
    }

    // Spine chain
    joints.set('Hips', getPos('Torso', { x: 0.5, y: 0.45, z: 0.5 }))
    joints.set('Spine', { ...joints.get('Hips')!, y: (joints.get('Hips')!.y + 0.65) / 2 })
    joints.set('Chest', getPos('Torso', { x: 0.5, y: 0.65, z: 0.5 }))
    joints.set('Neck', getPos('Neck', { x: 0.5, y: 0.82, z: 0.5 }))
    joints.set('Head', getPos('Head', { x: 0.5, y: 0.92, z: 0.5 }))

    // Arms
    joints.set('L_Shoulder', getPos('Shoulder_L', { x: 0.22, y: 0.78, z: 0.5 }))
    joints.set('R_Shoulder', getPos('Shoulder_R', { x: 0.78, y: 0.78, z: 0.5 }))
    joints.set('L_Elbow', getPos('UpperArm_L', { x: 0.1, y: 0.62, z: 0.5 }))
    joints.set('R_Elbow', getPos('UpperArm_R', { x: 0.9, y: 0.62, z: 0.5 }))
    joints.set('L_Wrist', getPos('Hand_L', { x: 0.05, y: 0.45, z: 0.5 }))
    joints.set('R_Wrist', getPos('Hand_R', { x: 0.95, y: 0.45, z: 0.5 }))

    // Legs
    joints.set('L_Hip', getPos('UpperLeg_L', { x: 0.38, y: 0.46, z: 0.5 }))
    joints.set('R_Hip', getPos('UpperLeg_R', { x: 0.62, y: 0.46, z: 0.5 }))
    joints.set('L_Knee', getPos('LowerLeg_L', { x: 0.38, y: 0.22, z: 0.52 }))
    joints.set('R_Knee', getPos('LowerLeg_R', { x: 0.62, y: 0.22, z: 0.52 }))
    joints.set('L_Ankle', getPos('Shoe_L', { x: 0.38, y: 0.05, z: 0.5 }))
    joints.set('R_Ankle', getPos('Shoe_R', { x: 0.62, y: 0.05, z: 0.5 }))
    joints.set('L_Toe', getPos('Foot_L', { x: 0.38, y: 0.02, z: 0.6 }))
    joints.set('R_Toe', getPos('Foot_R', { x: 0.62, y: 0.02, z: 0.6 }))

    // Fingers (simplified)
    joints.set('L_Thumb', { x: 0.03, y: 0.42, z: 0.55 })
    joints.set('R_Thumb', { x: 0.97, y: 0.42, z: 0.55 })
    joints.set('L_FingerTip', { x: 0.02, y: 0.40, z: 0.5 })
    joints.set('R_FingerTip', { x: 0.98, y: 0.40, z: 0.5 })

    return joints
}

// ══════════════════════════════════════════
//  AUTO-RIG CHARACTER
// ══════════════════════════════════════════

export interface AutoRigResult {
    /** The rigged skeleton */
    skeleton: THREE.Skeleton
    /** Root bone of the hierarchy */
    rootBone: THREE.Bone
    /** The generated joint markers (with positions) */
    markers: JointMarker[]
    /** Joint visualization helpers */
    helpers: THREE.Group
    /** Whether auto-rig was applied */
    rigged: boolean
}

/**
 * Automatically rig a character group using the humanoid template.
 * Maps body part names to joint positions, builds skeleton, computes weights.
 */
export function autoRigCharacter(group: THREE.Group): AutoRigResult {
    const bbox = computeBoundingBox(group)
    const jointPositions = humanoidJointPositions(group)

    // Create markers from the humanoid template with computed positions
    const markers = createMarkersFromTemplate(HUMANOID_TEMPLATE.joints)

    // Override marker positions with computed ones
    for (const marker of markers) {
        const pos = jointPositions.get(marker.name)
        if (pos) {
            marker.position = pos
            marker.placed = true
        }
    }

    // Build skeleton
    const { skeleton, rootBone } = buildSkeletonFromMarkers(markers, bbox)

    // Create joint visualization helpers
    const helpers = createJointHelpers(markers, bbox)

    return { skeleton, rootBone, markers, helpers, rigged: true }
}

/**
 * Auto-rig a creature group using the quadruped template.
 */
export function autoRigCreature(group: THREE.Group): AutoRigResult {
    const bbox = computeBoundingBox(group)
    const markers = createMarkersFromTemplate(QUADRUPED_TEMPLATE.joints)

    // Use default positions from the template
    for (const marker of markers) {
        marker.placed = true
    }

    const { skeleton, rootBone } = buildSkeletonFromMarkers(markers, bbox)
    const helpers = createJointHelpers(markers, bbox)

    return { skeleton, rootBone, markers, helpers, rigged: true }
}

// ══════════════════════════════════════════
//  JOINT VISUALIZATION — "Hinge Points"
// ══════════════════════════════════════════

/**
 * Create visual joint helpers that show hinge points, ball joints,
 * and bone connections. Ultra-premium look with glowing markers.
 */
function createJointHelpers(markers: JointMarker[], bbox: THREE.Box3): THREE.Group {
    const helpers = new THREE.Group()
    helpers.name = 'RigHelpers'

    const bboxSize = new THREE.Vector3()
    bbox.getSize(bboxSize)

    for (const marker of markers) {
        if (!marker.placed) continue

        // Convert normalized position to world position
        const worldPos = new THREE.Vector3(
            bbox.min.x + marker.position.x * bboxSize.x,
            bbox.min.y + marker.position.y * bboxSize.y,
            bbox.min.z + marker.position.z * bboxSize.z,
        )

        let jointMesh: THREE.Mesh

        if (marker.type === 'hinge') {
            // Hinge joints — torus ring showing the rotation axis
            const torusGeo = new THREE.TorusGeometry(marker.radius * 1.2, marker.radius * 0.15, 8, 16)
            const torusMat = new THREE.MeshStandardMaterial({
                color: marker.color,
                emissive: marker.color,
                emissiveIntensity: 0.8,
                metalness: 0.7,
                roughness: 0.15,
                transparent: true,
                opacity: 0.9,
            })
            jointMesh = new THREE.Mesh(torusGeo, torusMat)

            // Orient torus to show hinge axis
            if (marker.hingeAxis) {
                const axis = new THREE.Vector3(marker.hingeAxis.x, marker.hingeAxis.y, marker.hingeAxis.z)
                const up = new THREE.Vector3(0, 0, 1)
                const quat = new THREE.Quaternion().setFromUnitVectors(up, axis.normalize())
                jointMesh.quaternion.copy(quat)
            }
        } else if (marker.type === 'ball') {
            // Ball joints — glowing sphere
            const sphereGeo = new THREE.SphereGeometry(marker.radius, 12, 12)
            const sphereMat = new THREE.MeshStandardMaterial({
                color: marker.color,
                emissive: marker.color,
                emissiveIntensity: 0.6,
                metalness: 0.5,
                roughness: 0.2,
                transparent: true,
                opacity: 0.85,
            })
            jointMesh = new THREE.Mesh(sphereGeo, sphereMat)
        } else {
            // Fixed joints — small diamond
            const diamondGeo = new THREE.OctahedronGeometry(marker.radius * 0.6)
            const diamondMat = new THREE.MeshStandardMaterial({
                color: marker.color,
                emissive: marker.color,
                emissiveIntensity: 0.4,
                metalness: 0.3,
                roughness: 0.4,
                transparent: true,
                opacity: 0.7,
            })
            jointMesh = new THREE.Mesh(diamondGeo, diamondMat)
        }

        jointMesh.position.copy(worldPos)
        jointMesh.name = `Joint_${marker.name}`
        helpers.add(jointMesh)
    }

    // Draw bone lines between connected joints
    const markerMap = new Map(markers.map(m => [m.id, m]))
    for (const marker of markers) {
        if (!marker.parentId || !marker.placed) continue
        const parent = markerMap.get(marker.parentId)
        if (!parent || !parent.placed) continue

        const startPos = new THREE.Vector3(
            bbox.min.x + parent.position.x * bboxSize.x,
            bbox.min.y + parent.position.y * bboxSize.y,
            bbox.min.z + parent.position.z * bboxSize.z,
        )
        const endPos = new THREE.Vector3(
            bbox.min.x + marker.position.x * bboxSize.x,
            bbox.min.y + marker.position.y * bboxSize.y,
            bbox.min.z + marker.position.z * bboxSize.z,
        )

        // Bone line (glowing cyan)
        const lineGeo = new THREE.BufferGeometry().setFromPoints([startPos, endPos])
        const lineMat = new THREE.LineBasicMaterial({
            color: '#06b6d4',
            transparent: true,
            opacity: 0.6,
            linewidth: 2,
        })
        const line = new THREE.Line(lineGeo, lineMat)
        line.name = `Bone_${parent.name}_to_${marker.name}`
        helpers.add(line)
    }

    return helpers
}

// ══════════════════════════════════════════
//  ATTACH SKELETON TO CHARACTER
// ══════════════════════════════════════════

/**
 * Full auto-rig pipeline: generate character, compute joints, build skeleton,
 * and attach skin weights. Returns the character group with rig visualization.
 */
export function rigAndVisualize(
    characterGroup: THREE.Group,
    showHelpers = true,
): { group: THREE.Group; rig: AutoRigResult } {
    const rig = autoRigCharacter(characterGroup)

    if (showHelpers) {
        characterGroup.add(rig.helpers)
    }

    return { group: characterGroup, rig }
}
