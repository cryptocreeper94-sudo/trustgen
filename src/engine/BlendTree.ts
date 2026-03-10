/* ====== TrustGen — Animation Blend Tree System ======
 * Blends between multiple animation clips based on parameters.
 *
 * Supports:
 * - 1D blend (e.g. speed: idle → walk → run)
 * - 2D blend (e.g. speed + direction: all locomotion states)
 * - Additive layering (e.g. wave on top of walk)
 * - Crossfade transitions between states
 * - Conditional state transitions
 */
import * as THREE from 'three'

// ── Types ──

export type BlendMode = '1d' | '2d' | 'additive' | 'override'

export interface BlendNode {
    /** Unique ID */
    id: string
    /** Display name */
    name: string
    /** The animation clip */
    clip: THREE.AnimationClip | null
    /** Position on the 1D/2D blend axis */
    position: number       // for 1D: position on the axis
    position2D?: { x: number; y: number }  // for 2D: position in blend space
    /** Weight (computed by the blend tree) */
    weight: number
    /** Playback speed multiplier */
    speed: number
}

export interface BlendTransition {
    /** Source state ID */
    fromId: string
    /** Target state ID */
    toId: string
    /** Crossfade duration in seconds */
    duration: number
    /** Condition to trigger transition */
    condition?: TransitionCondition
}

export interface TransitionCondition {
    /** Parameter name to check */
    param: string
    /** Comparison operator */
    op: '>' | '<' | '>=' | '<=' | '==' | '!='
    /** Value to compare against */
    value: number
}

export interface BlendTree {
    /** Unique ID */
    id: string
    /** Display name */
    name: string
    /** Blend mode */
    mode: BlendMode
    /** Parameter name(s) controlling the blend */
    parameterX: string
    parameterY?: string  // for 2D mode
    /** Current parameter value(s) */
    valueX: number
    valueY?: number
    /** Child nodes */
    nodes: BlendNode[]
    /** State transitions */
    transitions: BlendTransition[]
    /** Active state ID (for state machine mode) */
    activeStateId: string | null
    /** Whether this tree is playing */
    playing: boolean
}

// ── Default Blend Tree ──

export function createDefaultBlendTree(): BlendTree {
    return {
        id: crypto.randomUUID?.() || `bt_${Date.now()}`,
        name: 'New Blend Tree',
        mode: '1d',
        parameterX: 'speed',
        valueX: 0,
        nodes: [],
        transitions: [],
        activeStateId: null,
        playing: false,
    }
}

// ── 1D Blending ──

/**
 * Compute weights for 1D blend based on parameter value.
 * Uses linear interpolation between adjacent nodes.
 */
export function compute1DBlendWeights(
    nodes: BlendNode[],
    paramValue: number
): void {
    if (nodes.length === 0) return
    if (nodes.length === 1) {
        nodes[0].weight = 1
        return
    }

    // Sort by position
    const sorted = [...nodes].sort((a, b) => a.position - b.position)

    // Reset all weights
    for (const node of nodes) {
        node.weight = 0
    }

    // Clamp param to range
    const minPos = sorted[0].position
    const maxPos = sorted[sorted.length - 1].position
    const clamped = THREE.MathUtils.clamp(paramValue, minPos, maxPos)

    // Find the two bracketing nodes
    for (let i = 0; i < sorted.length - 1; i++) {
        const a = sorted[i]
        const b = sorted[i + 1]

        if (clamped >= a.position && clamped <= b.position) {
            const range = b.position - a.position
            if (range === 0) {
                a.weight = 0.5
                b.weight = 0.5
            } else {
                const t = (clamped - a.position) / range
                a.weight = 1 - t
                b.weight = t
            }
            return
        }
    }

    // Edge case: exact match on last node
    sorted[sorted.length - 1].weight = 1
}

// ── 2D Blending ──

/**
 * Compute weights for 2D blend using gradient band interpolation.
 * Produces smooth blending in a 2D parameter space.
 */
export function compute2DBlendWeights(
    nodes: BlendNode[],
    paramX: number,
    paramY: number
): void {
    if (nodes.length === 0) return
    if (nodes.length === 1) {
        nodes[0].weight = 1
        return
    }

    // Reset weights
    for (const node of nodes) {
        node.weight = 0
    }

    // Inverse-distance weighting with sharpness
    const sharpness = 2.0
    let totalWeight = 0

    for (const node of nodes) {
        const pos = node.position2D || { x: node.position, y: 0 }
        const dx = paramX - pos.x
        const dy = paramY - pos.y
        const distSq = dx * dx + dy * dy

        if (distSq < 0.0001) {
            // Exact match — full weight to this node
            for (const n of nodes) n.weight = 0
            node.weight = 1
            return
        }

        node.weight = 1.0 / Math.pow(distSq, sharpness / 2)
        totalWeight += node.weight
    }

    // Normalize
    if (totalWeight > 0) {
        for (const node of nodes) {
            node.weight /= totalWeight
        }
    }
}

// ── Additive Blending ──

/**
 * Apply additive blend: base animation + additive layer with weight.
 * The additive clip is applied ON TOP of the current pose.
 */
export function computeAdditiveWeights(
    baseNode: BlendNode,
    additiveNodes: BlendNode[],
    layerWeights: number[]
): void {
    baseNode.weight = 1.0
    for (let i = 0; i < additiveNodes.length; i++) {
        additiveNodes[i].weight = THREE.MathUtils.clamp(layerWeights[i] || 0, 0, 1)
    }
}

// ── Blend Tree Evaluation ──

/**
 * Evaluate the entire blend tree and compute all node weights.
 */
export function evaluateBlendTree(tree: BlendTree): void {
    switch (tree.mode) {
        case '1d':
            compute1DBlendWeights(tree.nodes, tree.valueX)
            break
        case '2d':
            compute2DBlendWeights(tree.nodes, tree.valueX, tree.valueY ?? 0)
            break
        case 'additive':
            if (tree.nodes.length >= 2) {
                computeAdditiveWeights(
                    tree.nodes[0],
                    tree.nodes.slice(1),
                    tree.nodes.slice(1).map(n => n.weight)
                )
            }
            break
        case 'override':
            // State machine: only the active state has weight
            for (const node of tree.nodes) {
                node.weight = node.id === tree.activeStateId ? 1 : 0
            }
            break
    }
}

// ── Transition Evaluation ──

/**
 * Check if any transition conditions are met and return the target state.
 */
export function checkTransitions(
    tree: BlendTree,
    parameters: Record<string, number>
): string | null {
    if (!tree.activeStateId) return null

    for (const transition of tree.transitions) {
        if (transition.fromId !== tree.activeStateId) continue
        if (!transition.condition) continue

        const paramValue = parameters[transition.condition.param] ?? 0
        const targetValue = transition.condition.value
        let conditionMet = false

        switch (transition.condition.op) {
            case '>': conditionMet = paramValue > targetValue; break
            case '<': conditionMet = paramValue < targetValue; break
            case '>=': conditionMet = paramValue >= targetValue; break
            case '<=': conditionMet = paramValue <= targetValue; break
            case '==': conditionMet = Math.abs(paramValue - targetValue) < 0.001; break
            case '!=': conditionMet = Math.abs(paramValue - targetValue) >= 0.001; break
        }

        if (conditionMet) {
            return transition.toId
        }
    }

    return null
}

// ── Preset Blend Trees ──

export interface BlendTreePreset {
    name: string
    description: string
    icon: string
    /** Creates a blend tree with the given clips */
    create: (clips: Record<string, THREE.AnimationClip>) => BlendTree
}

export const BLEND_TREE_PRESETS: BlendTreePreset[] = [
    {
        name: 'Locomotion 1D',
        description: 'Blend idle → walk → run based on speed',
        icon: '🚶',
        create: (clips) => {
            const tree = createDefaultBlendTree()
            tree.name = 'Locomotion 1D'
            tree.parameterX = 'speed'
            tree.nodes = [
                { id: 'idle', name: 'Idle', clip: clips['Idle'] || null, position: 0, weight: 1, speed: 1 },
                { id: 'walk', name: 'Walk', clip: clips['Walk'] || null, position: 0.5, weight: 0, speed: 1 },
                { id: 'run', name: 'Run', clip: clips['Run'] || null, position: 1, weight: 0, speed: 1 },
            ]
            return tree
        },
    },
    {
        name: 'Upper Body Layer',
        description: 'Additive wave/clap on top of base animation',
        icon: '🤚',
        create: (clips) => {
            const tree = createDefaultBlendTree()
            tree.name = 'Upper Body Layer'
            tree.mode = 'additive'
            tree.nodes = [
                { id: 'base', name: 'Base Pose', clip: clips['Idle'] || null, position: 0, weight: 1, speed: 1 },
                { id: 'wave', name: 'Wave', clip: clips['Wave'] || null, position: 1, weight: 0, speed: 1 },
                { id: 'clap', name: 'Clap', clip: clips['Clap'] || null, position: 2, weight: 0, speed: 1 },
            ]
            return tree
        },
    },
    {
        name: 'Action State Machine',
        description: 'State machine: idle → jump → land with conditions',
        icon: '⚡',
        create: (clips) => {
            const tree = createDefaultBlendTree()
            tree.name = 'Action States'
            tree.mode = 'override'
            tree.nodes = [
                { id: 'idle', name: 'Idle', clip: clips['Idle'] || null, position: 0, weight: 1, speed: 1 },
                { id: 'jump', name: 'Jump', clip: clips['Jump'] || null, position: 1, weight: 0, speed: 1 },
            ]
            tree.activeStateId = 'idle'
            tree.transitions = [
                { fromId: 'idle', toId: 'jump', duration: 0.2, condition: { param: 'jump', op: '>', value: 0.5 } },
                { fromId: 'jump', toId: 'idle', duration: 0.3, condition: { param: 'grounded', op: '>', value: 0.5 } },
            ]
            return tree
        },
    },
]

/**
 * Get the effective animation actions to apply, weighted by the blend tree.
 * Returns pairs of {clip, weight} for the animation mixer.
 */
export function getBlendedActions(
    tree: BlendTree
): { clip: THREE.AnimationClip; weight: number; speed: number }[] {
    return tree.nodes
        .filter(n => n.weight > 0.001 && n.clip)
        .map(n => ({
            clip: n.clip!,
            weight: n.weight,
            speed: n.speed,
        }))
}
