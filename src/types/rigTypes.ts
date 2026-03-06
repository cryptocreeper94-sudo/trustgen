/* ====== TrustGen — Auto-Rig Type System ====== */
import type { Vec3 } from '../types'

// ── Joint Types ──
export type JointType = 'ball' | 'hinge' | 'fixed'

export interface JointMarker {
    id: string
    name: string
    position: Vec3
    type: JointType
    parentId: string | null
    mirrorId: string | null       // linked mirror joint (e.g. L_Shoulder ↔ R_Shoulder)
    placed: boolean
    radius: number                // visual circle radius
    color: string
    /** Axis constraint for hinge joints (e.g. knee only bends on X) */
    hingeAxis?: Vec3
}

// ── Bone Definition ──
export interface BoneDefinition {
    name: string
    head: Vec3             // start of bone (parent joint)
    tail: Vec3             // end of bone (child joint)
    parentName: string | null
    roll: number           // bone twist along its axis
    length: number
    /** Envelope radius for distance-based weight painting */
    envelopeRadius: number
}

// ── Rig Templates ──
export type RigTemplateName = 'humanoid' | 'quadruped' | 'simple' | 'custom'

export interface RigTemplateJoint {
    name: string
    type: JointType
    /** Expected relative position (normalized 0–1 in bounding box space) */
    defaultPosition: Vec3
    parentName: string | null
    mirrorName: string | null
    hingeAxis?: Vec3
    color: string
}

export interface RigTemplate {
    name: RigTemplateName
    label: string
    icon: string
    joints: RigTemplateJoint[]
}

// ── Rig Session State ──
export type RigMode = 'idle' | 'placing' | 'adjusting' | 'generating' | 'complete'

export interface RigState {
    active: boolean
    mode: RigMode
    template: RigTemplateName
    markers: JointMarker[]
    activeMarkerId: string | null
    mirrorMode: boolean
    showBones: boolean
    showEnvelopes: boolean
    /** Index of current joint to place (for guided placement) */
    placementIndex: number
    /** Generated bone hierarchy (after "Generate Skeleton") */
    bones: BoneDefinition[]
}

// ── Humanoid Template (23 joints) ──
export const HUMANOID_TEMPLATE: RigTemplate = {
    name: 'humanoid',
    label: 'Humanoid',
    icon: '🧍',
    joints: [
        // Spine
        { name: 'Hips', type: 'ball', defaultPosition: { x: 0, y: 0.45, z: 0 }, parentName: null, mirrorName: null, color: '#06b6d4' },
        { name: 'Spine', type: 'fixed', defaultPosition: { x: 0, y: 0.55, z: 0 }, parentName: 'Hips', mirrorName: null, color: '#06b6d4' },
        { name: 'Chest', type: 'fixed', defaultPosition: { x: 0, y: 0.65, z: 0 }, parentName: 'Spine', mirrorName: null, color: '#06b6d4' },
        { name: 'Neck', type: 'ball', defaultPosition: { x: 0, y: 0.82, z: 0 }, parentName: 'Chest', mirrorName: null, color: '#22d3ee' },
        { name: 'Head', type: 'fixed', defaultPosition: { x: 0, y: 0.95, z: 0 }, parentName: 'Neck', mirrorName: null, color: '#22d3ee' },

        // Left Arm
        { name: 'L_Shoulder', type: 'ball', defaultPosition: { x: -0.18, y: 0.78, z: 0 }, parentName: 'Chest', mirrorName: 'R_Shoulder', color: '#14b8a6' },
        { name: 'L_Elbow', type: 'hinge', defaultPosition: { x: -0.35, y: 0.6, z: 0 }, parentName: 'L_Shoulder', mirrorName: 'R_Elbow', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#14b8a6' },
        { name: 'L_Wrist', type: 'ball', defaultPosition: { x: -0.5, y: 0.45, z: 0 }, parentName: 'L_Elbow', mirrorName: 'R_Wrist', color: '#14b8a6' },

        // Right Arm
        { name: 'R_Shoulder', type: 'ball', defaultPosition: { x: 0.18, y: 0.78, z: 0 }, parentName: 'Chest', mirrorName: 'L_Shoulder', color: '#0ea5e9' },
        { name: 'R_Elbow', type: 'hinge', defaultPosition: { x: 0.35, y: 0.6, z: 0 }, parentName: 'R_Shoulder', mirrorName: 'L_Elbow', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#0ea5e9' },
        { name: 'R_Wrist', type: 'ball', defaultPosition: { x: 0.5, y: 0.45, z: 0 }, parentName: 'R_Elbow', mirrorName: 'L_Wrist', color: '#0ea5e9' },

        // Left Leg
        { name: 'L_Hip', type: 'ball', defaultPosition: { x: -0.1, y: 0.42, z: 0 }, parentName: 'Hips', mirrorName: 'R_Hip', color: '#34d399' },
        { name: 'L_Knee', type: 'hinge', defaultPosition: { x: -0.1, y: 0.22, z: 0.02 }, parentName: 'L_Hip', mirrorName: 'R_Knee', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#34d399' },
        { name: 'L_Ankle', type: 'ball', defaultPosition: { x: -0.1, y: 0.04, z: 0 }, parentName: 'L_Knee', mirrorName: 'R_Ankle', color: '#34d399' },
        { name: 'L_Toe', type: 'fixed', defaultPosition: { x: -0.1, y: 0.01, z: 0.06 }, parentName: 'L_Ankle', mirrorName: 'R_Toe', color: '#34d399' },

        // Right Leg
        { name: 'R_Hip', type: 'ball', defaultPosition: { x: 0.1, y: 0.42, z: 0 }, parentName: 'Hips', mirrorName: 'L_Hip', color: '#38bdf8' },
        { name: 'R_Knee', type: 'hinge', defaultPosition: { x: 0.1, y: 0.22, z: 0.02 }, parentName: 'R_Hip', mirrorName: 'L_Knee', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#38bdf8' },
        { name: 'R_Ankle', type: 'ball', defaultPosition: { x: 0.1, y: 0.04, z: 0 }, parentName: 'R_Knee', mirrorName: 'L_Ankle', color: '#38bdf8' },
        { name: 'R_Toe', type: 'fixed', defaultPosition: { x: 0.1, y: 0.01, z: 0.06 }, parentName: 'R_Ankle', mirrorName: 'L_Toe', color: '#38bdf8' },

        // Fingers (simplified — thumb + index + middle per hand)
        { name: 'L_Thumb', type: 'hinge', defaultPosition: { x: -0.52, y: 0.43, z: 0.02 }, parentName: 'L_Wrist', mirrorName: 'R_Thumb', color: '#14b8a6' },
        { name: 'R_Thumb', type: 'hinge', defaultPosition: { x: 0.52, y: 0.43, z: 0.02 }, parentName: 'R_Wrist', mirrorName: 'L_Thumb', color: '#0ea5e9' },
        { name: 'L_FingerTip', type: 'fixed', defaultPosition: { x: -0.55, y: 0.42, z: 0 }, parentName: 'L_Wrist', mirrorName: 'R_FingerTip', color: '#14b8a6' },
        { name: 'R_FingerTip', type: 'fixed', defaultPosition: { x: 0.55, y: 0.42, z: 0 }, parentName: 'R_Wrist', mirrorName: 'L_FingerTip', color: '#0ea5e9' },
    ],
}

// ── Quadruped Template (18 joints) ──
export const QUADRUPED_TEMPLATE: RigTemplate = {
    name: 'quadruped',
    label: 'Quadruped',
    icon: '🐕',
    joints: [
        { name: 'Root', type: 'ball', defaultPosition: { x: 0, y: 0.5, z: 0 }, parentName: null, mirrorName: null, color: '#06b6d4' },
        { name: 'Spine_Front', type: 'fixed', defaultPosition: { x: 0, y: 0.52, z: 0.25 }, parentName: 'Root', mirrorName: null, color: '#06b6d4' },
        { name: 'Spine_Rear', type: 'fixed', defaultPosition: { x: 0, y: 0.48, z: -0.25 }, parentName: 'Root', mirrorName: null, color: '#06b6d4' },
        { name: 'Neck', type: 'ball', defaultPosition: { x: 0, y: 0.6, z: 0.4 }, parentName: 'Spine_Front', mirrorName: null, color: '#22d3ee' },
        { name: 'Head', type: 'fixed', defaultPosition: { x: 0, y: 0.65, z: 0.55 }, parentName: 'Neck', mirrorName: null, color: '#22d3ee' },
        { name: 'Tail_Base', type: 'ball', defaultPosition: { x: 0, y: 0.5, z: -0.45 }, parentName: 'Spine_Rear', mirrorName: null, color: '#0891b2' },
        { name: 'Tail_Tip', type: 'fixed', defaultPosition: { x: 0, y: 0.55, z: -0.6 }, parentName: 'Tail_Base', mirrorName: null, color: '#0891b2' },
        // Front legs
        { name: 'FL_Shoulder', type: 'ball', defaultPosition: { x: -0.12, y: 0.45, z: 0.3 }, parentName: 'Spine_Front', mirrorName: 'FR_Shoulder', color: '#14b8a6' },
        { name: 'FL_Elbow', type: 'hinge', defaultPosition: { x: -0.12, y: 0.25, z: 0.3 }, parentName: 'FL_Shoulder', mirrorName: 'FR_Elbow', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#14b8a6' },
        { name: 'FL_Paw', type: 'fixed', defaultPosition: { x: -0.12, y: 0.02, z: 0.3 }, parentName: 'FL_Elbow', mirrorName: 'FR_Paw', color: '#14b8a6' },
        { name: 'FR_Shoulder', type: 'ball', defaultPosition: { x: 0.12, y: 0.45, z: 0.3 }, parentName: 'Spine_Front', mirrorName: 'FL_Shoulder', color: '#0ea5e9' },
        { name: 'FR_Elbow', type: 'hinge', defaultPosition: { x: 0.12, y: 0.25, z: 0.3 }, parentName: 'FR_Shoulder', mirrorName: 'FL_Elbow', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#0ea5e9' },
        { name: 'FR_Paw', type: 'fixed', defaultPosition: { x: 0.12, y: 0.02, z: 0.3 }, parentName: 'FR_Elbow', mirrorName: 'FL_Paw', color: '#0ea5e9' },
        // Rear legs
        { name: 'RL_Hip', type: 'ball', defaultPosition: { x: -0.12, y: 0.42, z: -0.3 }, parentName: 'Spine_Rear', mirrorName: 'RR_Hip', color: '#34d399' },
        { name: 'RL_Knee', type: 'hinge', defaultPosition: { x: -0.12, y: 0.22, z: -0.28 }, parentName: 'RL_Hip', mirrorName: 'RR_Knee', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#34d399' },
        { name: 'RL_Paw', type: 'fixed', defaultPosition: { x: -0.12, y: 0.02, z: -0.3 }, parentName: 'RL_Knee', mirrorName: 'RR_Paw', color: '#34d399' },
        { name: 'RR_Hip', type: 'ball', defaultPosition: { x: 0.12, y: 0.42, z: -0.3 }, parentName: 'Spine_Rear', mirrorName: 'RL_Hip', color: '#38bdf8' },
        { name: 'RR_Knee', type: 'hinge', defaultPosition: { x: 0.12, y: 0.22, z: -0.28 }, parentName: 'RR_Hip', mirrorName: 'RL_Knee', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#38bdf8' },
        { name: 'RR_Paw', type: 'fixed', defaultPosition: { x: 0.12, y: 0.02, z: -0.3 }, parentName: 'RR_Knee', mirrorName: 'RL_Paw', color: '#38bdf8' },
    ],
}

// ── Simple Template (5 joints) ──
export const SIMPLE_TEMPLATE: RigTemplate = {
    name: 'simple',
    label: 'Simple',
    icon: '📌',
    joints: [
        { name: 'Root', type: 'ball', defaultPosition: { x: 0, y: 0.3, z: 0 }, parentName: null, mirrorName: null, color: '#06b6d4' },
        { name: 'Mid', type: 'ball', defaultPosition: { x: 0, y: 0.5, z: 0 }, parentName: 'Root', mirrorName: null, color: '#22d3ee' },
        { name: 'Top', type: 'ball', defaultPosition: { x: 0, y: 0.8, z: 0 }, parentName: 'Mid', mirrorName: null, color: '#14b8a6' },
        { name: 'Left', type: 'ball', defaultPosition: { x: -0.3, y: 0.5, z: 0 }, parentName: 'Mid', mirrorName: 'Right', color: '#34d399' },
        { name: 'Right', type: 'ball', defaultPosition: { x: 0.3, y: 0.5, z: 0 }, parentName: 'Mid', mirrorName: 'Left', color: '#38bdf8' },
    ],
}

export const RIG_TEMPLATES: Record<RigTemplateName, RigTemplate> = {
    humanoid: HUMANOID_TEMPLATE,
    quadruped: QUADRUPED_TEMPLATE,
    simple: SIMPLE_TEMPLATE,
    custom: { name: 'custom', label: 'Custom', icon: '✏️', joints: [] },
}

// ── Default Rig State ──
export const DEFAULT_RIG_STATE: RigState = {
    active: false,
    mode: 'idle',
    template: 'humanoid',
    markers: [],
    activeMarkerId: null,
    mirrorMode: true,
    showBones: true,
    showEnvelopes: false,
    placementIndex: 0,
    bones: [],
}
