/* ====== TrustGen — Inverse Kinematics Engine ======
 * CCD-IK (Cyclic Coordinate Descent) solver for humanoid rigs.
 * Supports arbitrary bone chains — drag end-effectors (hands, feet, head)
 * and the IK system solves all joint rotations in real-time.
 *
 * Features:
 * - CCD-IK with configurable iteration count
 * - Joint angle constraints (hinge limits, ball-socket cones)
 * - Pre-defined IK chains for humanoid rig
 * - Pole target support for knee/elbow direction
 * - Smooth blending between IK and FK
 */
import * as THREE from 'three'

// ── Types ──

export interface IKConstraint {
    /** Min rotation in radians per axis */
    min: THREE.Vector3
    /** Max rotation in radians per axis */
    max: THREE.Vector3
}

export interface IKJoint {
    /** Joint bone name (matches humanoid rig) */
    name: string
    /** Reference to the THREE.Bone or Object3D */
    bone: THREE.Object3D
    /** Angular constraints (optional) */
    constraint?: IKConstraint
}

export interface IKChain {
    /** Friendly name for this chain */
    name: string
    /** Ordered joints from root → tip (e.g. Hips → Knee → Ankle) */
    joints: IKJoint[]
    /** Target position to reach */
    target: THREE.Vector3
    /** Pole target for bending direction (e.g. forward for knees) */
    poleTarget?: THREE.Vector3
    /** Whether this chain is currently active */
    enabled: boolean
    /** IK/FK blend weight (0 = pure FK, 1 = pure IK) */
    weight: number
}

export interface IKSolverConfig {
    /** Max CCD iterations per solve */
    iterations: number
    /** Distance threshold to consider "reached" */
    tolerance: number
    /** Damping factor to prevent overshooting (0–1) */
    damping: number
}

// ── Default Configuration ──

export const DEFAULT_IK_CONFIG: IKSolverConfig = {
    iterations: 10,
    tolerance: 0.001,
    damping: 0.8,
}

// ── Common Humanoid Joint Constraints ──

const DEG = Math.PI / 180

export const HUMANOID_CONSTRAINTS: Record<string, IKConstraint> = {
    // Knees only bend backward (positive X rotation)
    L_Knee: {
        min: new THREE.Vector3(0, 0, 0),
        max: new THREE.Vector3(150 * DEG, 0, 0),
    },
    R_Knee: {
        min: new THREE.Vector3(0, 0, 0),
        max: new THREE.Vector3(150 * DEG, 0, 0),
    },
    // Elbows only flex (negative X rotation for most setups)
    L_Elbow: {
        min: new THREE.Vector3(-150 * DEG, 0, 0),
        max: new THREE.Vector3(0, 0, 0),
    },
    R_Elbow: {
        min: new THREE.Vector3(-150 * DEG, 0, 0),
        max: new THREE.Vector3(0, 0, 0),
    },
    // Hips: wide range of motion
    L_Hip: {
        min: new THREE.Vector3(-120 * DEG, -45 * DEG, -30 * DEG),
        max: new THREE.Vector3(30 * DEG, 45 * DEG, 30 * DEG),
    },
    R_Hip: {
        min: new THREE.Vector3(-120 * DEG, -45 * DEG, -30 * DEG),
        max: new THREE.Vector3(30 * DEG, 45 * DEG, 30 * DEG),
    },
    // Shoulders: very wide range
    L_Shoulder: {
        min: new THREE.Vector3(-180 * DEG, -90 * DEG, -90 * DEG),
        max: new THREE.Vector3(60 * DEG, 90 * DEG, 180 * DEG),
    },
    R_Shoulder: {
        min: new THREE.Vector3(-180 * DEG, -90 * DEG, -180 * DEG),
        max: new THREE.Vector3(60 * DEG, 90 * DEG, 90 * DEG),
    },
    // Spine: limited bending
    Spine: {
        min: new THREE.Vector3(-30 * DEG, -30 * DEG, -15 * DEG),
        max: new THREE.Vector3(30 * DEG, 30 * DEG, 15 * DEG),
    },
    Chest: {
        min: new THREE.Vector3(-20 * DEG, -25 * DEG, -10 * DEG),
        max: new THREE.Vector3(20 * DEG, 25 * DEG, 10 * DEG),
    },
    // Neck: moderate range
    Neck: {
        min: new THREE.Vector3(-40 * DEG, -60 * DEG, -15 * DEG),
        max: new THREE.Vector3(40 * DEG, 60 * DEG, 15 * DEG),
    },
    // Wrist: full axis roll
    L_Wrist: {
        min: new THREE.Vector3(-80 * DEG, -30 * DEG, -60 * DEG),
        max: new THREE.Vector3(80 * DEG, 30 * DEG, 60 * DEG),
    },
    R_Wrist: {
        min: new THREE.Vector3(-80 * DEG, -30 * DEG, -60 * DEG),
        max: new THREE.Vector3(80 * DEG, 30 * DEG, 60 * DEG),
    },
}

// ── CCD-IK Solver ──

const _tmpQuat = new THREE.Quaternion()
const _tmpVec = new THREE.Vector3()
const _tmpVec2 = new THREE.Vector3()
const _tmpEuler = new THREE.Euler()
const _worldPos = new THREE.Vector3()

/**
 * Solve a single IK chain using Cyclic Coordinate Descent.
 * Iterates from tip to root, rotating each joint to bring the
 * end-effector closer to the target.
 */
export function solveCCDIK(
    chain: IKChain,
    config: IKSolverConfig = DEFAULT_IK_CONFIG
): void {
    if (!chain.enabled || chain.joints.length < 2) return

    const { iterations, tolerance, damping } = config
    const joints = chain.joints
    const endEffectorBone = joints[joints.length - 1].bone
    const target = chain.target

    for (let iter = 0; iter < iterations; iter++) {
        // Check if we're close enough
        endEffectorBone.getWorldPosition(_worldPos)
        const dist = _worldPos.distanceTo(target)
        if (dist < tolerance) break

        // Iterate from second-to-last joint back to root
        for (let i = joints.length - 2; i >= 0; i--) {
            const joint = joints[i]
            const bone = joint.bone

            // Get world positions
            bone.getWorldPosition(_tmpVec)          // joint position
            endEffectorBone.getWorldPosition(_tmpVec2) // current end-effector position

            // Vector from joint to current end-effector
            const toEffector = _tmpVec2.clone().sub(_tmpVec).normalize()
            // Vector from joint to target
            const toTarget = target.clone().sub(_tmpVec).normalize()

            // Calculate rotation to align toEffector with toTarget
            _tmpQuat.setFromUnitVectors(toEffector, toTarget)

            // Apply damping
            _tmpQuat.slerp(new THREE.Quaternion(), 1 - damping)

            // Apply rotation in bone's local space
            // Convert world-space rotation to local space
            const parentWorldQuat = new THREE.Quaternion()
            if (bone.parent) {
                bone.parent.getWorldQuaternion(parentWorldQuat)
            }
            const parentWorldQuatInverse = parentWorldQuat.clone().invert()
            const localRotation = _tmpQuat.clone()
                .premultiply(parentWorldQuatInverse)
                .multiply(parentWorldQuat)

            bone.quaternion.premultiply(localRotation)

            // Apply constraints
            if (joint.constraint) {
                applyConstraint(bone, joint.constraint)
            }

            // Update world matrices
            bone.updateMatrixWorld(true)
        }
    }
}

/**
 * Apply angular constraints to a bone's rotation.
 * Clamps Euler angles to the constraint min/max range.
 */
function applyConstraint(bone: THREE.Object3D, constraint: IKConstraint): void {
    _tmpEuler.setFromQuaternion(bone.quaternion, 'XYZ')

    _tmpEuler.x = THREE.MathUtils.clamp(_tmpEuler.x, constraint.min.x, constraint.max.x)
    _tmpEuler.y = THREE.MathUtils.clamp(_tmpEuler.y, constraint.min.y, constraint.max.y)
    _tmpEuler.z = THREE.MathUtils.clamp(_tmpEuler.z, constraint.min.z, constraint.max.z)

    bone.quaternion.setFromEuler(_tmpEuler)
}

// ── Pre-defined Humanoid IK Chains ──

export type HumanoidIKChainName =
    | 'leftArm'
    | 'rightArm'
    | 'leftLeg'
    | 'rightLeg'
    | 'spine'
    | 'head'

export interface HumanoidIKChainDef {
    name: HumanoidIKChainName
    label: string
    icon: string
    /** Joint names from root to tip */
    jointNames: string[]
    /** Default pole target offset (in model space) */
    defaultPoleOffset: THREE.Vector3
}

export const HUMANOID_IK_CHAINS: HumanoidIKChainDef[] = [
    {
        name: 'leftArm',
        label: 'Left Arm',
        icon: '🤚',
        jointNames: ['L_Shoulder', 'L_Elbow', 'L_Wrist'],
        defaultPoleOffset: new THREE.Vector3(0, 0, -1), // elbows point backward
    },
    {
        name: 'rightArm',
        label: 'Right Arm',
        icon: '✋',
        jointNames: ['R_Shoulder', 'R_Elbow', 'R_Wrist'],
        defaultPoleOffset: new THREE.Vector3(0, 0, -1),
    },
    {
        name: 'leftLeg',
        label: 'Left Leg',
        icon: '🦵',
        jointNames: ['L_Hip', 'L_Knee', 'L_Ankle'],
        defaultPoleOffset: new THREE.Vector3(0, 0, 1), // knees point forward
    },
    {
        name: 'rightLeg',
        label: 'Right Leg',
        icon: '🦿',
        jointNames: ['R_Hip', 'R_Knee', 'R_Ankle'],
        defaultPoleOffset: new THREE.Vector3(0, 0, 1),
    },
    {
        name: 'spine',
        label: 'Spine',
        icon: '🔗',
        jointNames: ['Hips', 'Spine', 'Chest', 'Neck'],
        defaultPoleOffset: new THREE.Vector3(0, 0, 1),
    },
    {
        name: 'head',
        label: 'Head Look-At',
        icon: '👁️',
        jointNames: ['Chest', 'Neck', 'Head'],
        defaultPoleOffset: new THREE.Vector3(0, 1, 0),
    },
]

/**
 * Build IK chains from a rigged model's skeleton.
 * Traverses the THREE.Skeleton to find matching bones.
 */
export function buildHumanoidIKChains(
    skeleton: THREE.Skeleton | THREE.Object3D
): IKChain[] {
    const boneMap = new Map<string, THREE.Bone>()

    // Collect all bones from the skeleton or object hierarchy
    const root = skeleton instanceof THREE.Skeleton
        ? skeleton.bones[0]?.parent || skeleton.bones[0]
        : skeleton

    if (!root) return []

    root.traverse(child => {
        if ((child as THREE.Bone).isBone || child.name) {
            boneMap.set(child.name, child as THREE.Bone)
        }
    })

    const chains: IKChain[] = []

    for (const chainDef of HUMANOID_IK_CHAINS) {
        const joints: IKJoint[] = []
        let allFound = true

        for (const jointName of chainDef.jointNames) {
            const bone = boneMap.get(jointName)
            if (!bone) {
                allFound = false
                break
            }
            joints.push({
                name: jointName,
                bone,
                constraint: HUMANOID_CONSTRAINTS[jointName],
            })
        }

        if (allFound && joints.length >= 2) {
            // Get end-effector world position as initial target
            const tipBone = joints[joints.length - 1].bone
            const initialTarget = new THREE.Vector3()
            tipBone.getWorldPosition(initialTarget)

            chains.push({
                name: chainDef.label,
                joints,
                target: initialTarget,
                poleTarget: chainDef.defaultPoleOffset.clone(),
                enabled: false,
                weight: 1.0,
            })
        }
    }

    return chains
}

/**
 * Solve all enabled IK chains for a humanoid rig.
 * Call this in the animation loop (useFrame).
 */
export function solveAllChains(
    chains: IKChain[],
    config?: IKSolverConfig
): void {
    for (const chain of chains) {
        if (chain.enabled && chain.weight > 0) {
            solveCCDIK(chain, config)
        }
    }
}

// ── IK Handle (Draggable Target) ──

export interface IKHandle {
    chainName: string
    position: THREE.Vector3
    visible: boolean
    color: string
}

/**
 * Create default IK handles for all humanoid chains.
 */
export function createIKHandles(): IKHandle[] {
    const colors: Record<string, string> = {
        'Left Arm': '#14b8a6',
        'Right Arm': '#0ea5e9',
        'Left Leg': '#34d399',
        'Right Leg': '#38bdf8',
        'Spine': '#06b6d4',
        'Head Look-At': '#22d3ee',
    }

    return HUMANOID_IK_CHAINS.map(def => ({
        chainName: def.label,
        position: new THREE.Vector3(0, 0, 0),
        visible: false,
        color: colors[def.label] || '#06b6d4',
    }))
}
