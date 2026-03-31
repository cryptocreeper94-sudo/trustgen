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

// ── Humanoid Template (55 joints — full 5-finger) ──
export const HUMANOID_TEMPLATE: RigTemplate = {
    name: 'humanoid',
    label: 'Humanoid',
    icon: '🧍',
    joints: [
        // ── Spine Chain (6 joints) ──
        { name: 'Hips', type: 'ball', defaultPosition: { x: 0, y: 0.45, z: 0 }, parentName: null, mirrorName: null, color: '#06b6d4' },
        { name: 'Spine', type: 'fixed', defaultPosition: { x: 0, y: 0.52, z: 0 }, parentName: 'Hips', mirrorName: null, color: '#06b6d4' },
        { name: 'Chest', type: 'fixed', defaultPosition: { x: 0, y: 0.60, z: 0 }, parentName: 'Spine', mirrorName: null, color: '#06b6d4' },
        { name: 'UpperChest', type: 'fixed', defaultPosition: { x: 0, y: 0.68, z: 0 }, parentName: 'Chest', mirrorName: null, color: '#06b6d4' },
        { name: 'Neck', type: 'ball', defaultPosition: { x: 0, y: 0.82, z: 0 }, parentName: 'UpperChest', mirrorName: null, color: '#22d3ee' },
        { name: 'Head', type: 'fixed', defaultPosition: { x: 0, y: 0.95, z: 0 }, parentName: 'Neck', mirrorName: null, color: '#22d3ee' },

        // ── Left Arm Chain (5 joints) ──
        { name: 'L_Shoulder', type: 'ball', defaultPosition: { x: -0.16, y: 0.76, z: 0 }, parentName: 'UpperChest', mirrorName: 'R_Shoulder', color: '#14b8a6' },
        { name: 'L_UpperArm', type: 'ball', defaultPosition: { x: -0.22, y: 0.68, z: 0 }, parentName: 'L_Shoulder', mirrorName: 'R_UpperArm', color: '#14b8a6' },
        { name: 'L_Elbow', type: 'hinge', defaultPosition: { x: -0.32, y: 0.56, z: 0 }, parentName: 'L_UpperArm', mirrorName: 'R_Elbow', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#14b8a6' },
        { name: 'L_ForeArm', type: 'fixed', defaultPosition: { x: -0.40, y: 0.50, z: 0 }, parentName: 'L_Elbow', mirrorName: 'R_ForeArm', color: '#14b8a6' },
        { name: 'L_Wrist', type: 'ball', defaultPosition: { x: -0.48, y: 0.44, z: 0 }, parentName: 'L_ForeArm', mirrorName: 'R_Wrist', color: '#14b8a6' },

        // ── Right Arm Chain (5 joints) ──
        { name: 'R_Shoulder', type: 'ball', defaultPosition: { x: 0.16, y: 0.76, z: 0 }, parentName: 'UpperChest', mirrorName: 'L_Shoulder', color: '#0ea5e9' },
        { name: 'R_UpperArm', type: 'ball', defaultPosition: { x: 0.22, y: 0.68, z: 0 }, parentName: 'R_Shoulder', mirrorName: 'L_UpperArm', color: '#0ea5e9' },
        { name: 'R_Elbow', type: 'hinge', defaultPosition: { x: 0.32, y: 0.56, z: 0 }, parentName: 'R_UpperArm', mirrorName: 'L_Elbow', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#0ea5e9' },
        { name: 'R_ForeArm', type: 'fixed', defaultPosition: { x: 0.40, y: 0.50, z: 0 }, parentName: 'R_Elbow', mirrorName: 'L_ForeArm', color: '#0ea5e9' },
        { name: 'R_Wrist', type: 'ball', defaultPosition: { x: 0.48, y: 0.44, z: 0 }, parentName: 'R_Elbow', mirrorName: 'L_Wrist', color: '#0ea5e9' },

        // ── Left Hand — Thumb (3 joints) ──
        { name: 'L_Thumb_Meta', type: 'ball', defaultPosition: { x: -0.50, y: 0.43, z: 0.02 }, parentName: 'L_Wrist', mirrorName: 'R_Thumb_Meta', color: '#2dd4bf' },
        { name: 'L_Thumb_Prox', type: 'hinge', defaultPosition: { x: -0.52, y: 0.42, z: 0.03 }, parentName: 'L_Thumb_Meta', mirrorName: 'R_Thumb_Prox', hingeAxis: { x: 0, y: 0, z: 1 }, color: '#2dd4bf' },
        { name: 'L_Thumb_Dist', type: 'fixed', defaultPosition: { x: -0.54, y: 0.41, z: 0.04 }, parentName: 'L_Thumb_Prox', mirrorName: 'R_Thumb_Dist', color: '#2dd4bf' },
        // ── Left Hand — Index (3 joints) ──
        { name: 'L_Index_Meta', type: 'ball', defaultPosition: { x: -0.51, y: 0.43, z: 0.01 }, parentName: 'L_Wrist', mirrorName: 'R_Index_Meta', color: '#2dd4bf' },
        { name: 'L_Index_Prox', type: 'hinge', defaultPosition: { x: -0.53, y: 0.42, z: 0.01 }, parentName: 'L_Index_Meta', mirrorName: 'R_Index_Prox', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#2dd4bf' },
        { name: 'L_Index_Dist', type: 'fixed', defaultPosition: { x: -0.55, y: 0.41, z: 0.01 }, parentName: 'L_Index_Prox', mirrorName: 'R_Index_Dist', color: '#2dd4bf' },
        // ── Left Hand — Middle (3 joints) ──
        { name: 'L_Middle_Meta', type: 'ball', defaultPosition: { x: -0.51, y: 0.43, z: 0 }, parentName: 'L_Wrist', mirrorName: 'R_Middle_Meta', color: '#2dd4bf' },
        { name: 'L_Middle_Prox', type: 'hinge', defaultPosition: { x: -0.54, y: 0.42, z: 0 }, parentName: 'L_Middle_Meta', mirrorName: 'R_Middle_Prox', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#2dd4bf' },
        { name: 'L_Middle_Dist', type: 'fixed', defaultPosition: { x: -0.56, y: 0.41, z: 0 }, parentName: 'L_Middle_Prox', mirrorName: 'R_Middle_Dist', color: '#2dd4bf' },
        // ── Left Hand — Ring (3 joints) ──
        { name: 'L_Ring_Meta', type: 'ball', defaultPosition: { x: -0.51, y: 0.43, z: -0.01 }, parentName: 'L_Wrist', mirrorName: 'R_Ring_Meta', color: '#2dd4bf' },
        { name: 'L_Ring_Prox', type: 'hinge', defaultPosition: { x: -0.53, y: 0.42, z: -0.01 }, parentName: 'L_Ring_Meta', mirrorName: 'R_Ring_Prox', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#2dd4bf' },
        { name: 'L_Ring_Dist', type: 'fixed', defaultPosition: { x: -0.55, y: 0.41, z: -0.01 }, parentName: 'L_Ring_Prox', mirrorName: 'R_Ring_Dist', color: '#2dd4bf' },
        // ── Left Hand — Pinky (3 joints) ──
        { name: 'L_Pinky_Meta', type: 'ball', defaultPosition: { x: -0.50, y: 0.43, z: -0.02 }, parentName: 'L_Wrist', mirrorName: 'R_Pinky_Meta', color: '#2dd4bf' },
        { name: 'L_Pinky_Prox', type: 'hinge', defaultPosition: { x: -0.52, y: 0.42, z: -0.02 }, parentName: 'L_Pinky_Meta', mirrorName: 'R_Pinky_Prox', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#2dd4bf' },
        { name: 'L_Pinky_Dist', type: 'fixed', defaultPosition: { x: -0.53, y: 0.41, z: -0.02 }, parentName: 'L_Pinky_Prox', mirrorName: 'R_Pinky_Dist', color: '#2dd4bf' },

        // ── Right Hand — Thumb (3 joints) ──
        { name: 'R_Thumb_Meta', type: 'ball', defaultPosition: { x: 0.50, y: 0.43, z: 0.02 }, parentName: 'R_Wrist', mirrorName: 'L_Thumb_Meta', color: '#38bdf8' },
        { name: 'R_Thumb_Prox', type: 'hinge', defaultPosition: { x: 0.52, y: 0.42, z: 0.03 }, parentName: 'R_Thumb_Meta', mirrorName: 'L_Thumb_Prox', hingeAxis: { x: 0, y: 0, z: 1 }, color: '#38bdf8' },
        { name: 'R_Thumb_Dist', type: 'fixed', defaultPosition: { x: 0.54, y: 0.41, z: 0.04 }, parentName: 'R_Thumb_Prox', mirrorName: 'L_Thumb_Dist', color: '#38bdf8' },
        // ── Right Hand — Index (3 joints) ──
        { name: 'R_Index_Meta', type: 'ball', defaultPosition: { x: 0.51, y: 0.43, z: 0.01 }, parentName: 'R_Wrist', mirrorName: 'L_Index_Meta', color: '#38bdf8' },
        { name: 'R_Index_Prox', type: 'hinge', defaultPosition: { x: 0.53, y: 0.42, z: 0.01 }, parentName: 'R_Index_Meta', mirrorName: 'L_Index_Prox', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#38bdf8' },
        { name: 'R_Index_Dist', type: 'fixed', defaultPosition: { x: 0.55, y: 0.41, z: 0.01 }, parentName: 'R_Index_Prox', mirrorName: 'L_Index_Dist', color: '#38bdf8' },
        // ── Right Hand — Middle (3 joints) ──
        { name: 'R_Middle_Meta', type: 'ball', defaultPosition: { x: 0.51, y: 0.43, z: 0 }, parentName: 'R_Wrist', mirrorName: 'L_Middle_Meta', color: '#38bdf8' },
        { name: 'R_Middle_Prox', type: 'hinge', defaultPosition: { x: 0.54, y: 0.42, z: 0 }, parentName: 'R_Middle_Meta', mirrorName: 'L_Middle_Prox', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#38bdf8' },
        { name: 'R_Middle_Dist', type: 'fixed', defaultPosition: { x: 0.56, y: 0.41, z: 0 }, parentName: 'R_Middle_Prox', mirrorName: 'L_Middle_Dist', color: '#38bdf8' },
        // ── Right Hand — Ring (3 joints) ──
        { name: 'R_Ring_Meta', type: 'ball', defaultPosition: { x: 0.51, y: 0.43, z: -0.01 }, parentName: 'R_Wrist', mirrorName: 'L_Ring_Meta', color: '#38bdf8' },
        { name: 'R_Ring_Prox', type: 'hinge', defaultPosition: { x: 0.53, y: 0.42, z: -0.01 }, parentName: 'R_Ring_Meta', mirrorName: 'L_Ring_Prox', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#38bdf8' },
        { name: 'R_Ring_Dist', type: 'fixed', defaultPosition: { x: 0.55, y: 0.41, z: -0.01 }, parentName: 'R_Ring_Prox', mirrorName: 'L_Ring_Dist', color: '#38bdf8' },
        // ── Right Hand — Pinky (3 joints) ──
        { name: 'R_Pinky_Meta', type: 'ball', defaultPosition: { x: 0.50, y: 0.43, z: -0.02 }, parentName: 'R_Wrist', mirrorName: 'L_Pinky_Meta', color: '#38bdf8' },
        { name: 'R_Pinky_Prox', type: 'hinge', defaultPosition: { x: 0.52, y: 0.42, z: -0.02 }, parentName: 'R_Pinky_Meta', mirrorName: 'L_Pinky_Prox', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#38bdf8' },
        { name: 'R_Pinky_Dist', type: 'fixed', defaultPosition: { x: 0.53, y: 0.41, z: -0.02 }, parentName: 'R_Pinky_Prox', mirrorName: 'L_Pinky_Dist', color: '#38bdf8' },

        // ── Left Leg Chain (4 joints) ──
        { name: 'L_Hip', type: 'ball', defaultPosition: { x: -0.10, y: 0.42, z: 0 }, parentName: 'Hips', mirrorName: 'R_Hip', color: '#34d399' },
        { name: 'L_Knee', type: 'hinge', defaultPosition: { x: -0.10, y: 0.22, z: 0.02 }, parentName: 'L_Hip', mirrorName: 'R_Knee', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#34d399' },
        { name: 'L_Ankle', type: 'ball', defaultPosition: { x: -0.10, y: 0.04, z: 0 }, parentName: 'L_Knee', mirrorName: 'R_Ankle', color: '#34d399' },
        { name: 'L_Toe', type: 'fixed', defaultPosition: { x: -0.10, y: 0.01, z: 0.06 }, parentName: 'L_Ankle', mirrorName: 'R_Toe', color: '#34d399' },

        // ── Right Leg Chain (4 joints) ──
        { name: 'R_Hip', type: 'ball', defaultPosition: { x: 0.10, y: 0.42, z: 0 }, parentName: 'Hips', mirrorName: 'L_Hip', color: '#38bdf8' },
        { name: 'R_Knee', type: 'hinge', defaultPosition: { x: 0.10, y: 0.22, z: 0.02 }, parentName: 'R_Hip', mirrorName: 'L_Knee', hingeAxis: { x: 1, y: 0, z: 0 }, color: '#38bdf8' },
        { name: 'R_Ankle', type: 'ball', defaultPosition: { x: 0.10, y: 0.04, z: 0 }, parentName: 'R_Knee', mirrorName: 'L_Ankle', color: '#38bdf8' },
        { name: 'R_Toe', type: 'fixed', defaultPosition: { x: 0.10, y: 0.01, z: 0.06 }, parentName: 'R_Ankle', mirrorName: 'L_Toe', color: '#38bdf8' },
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
