/* ====== TrustGen — Weight Painting Engine ======
 * Automatic and manual vertex weight painting for skeletal deformation.
 *
 * Supports:
 * - Envelope-based auto-weighting (distance from bone)
 * - Heat-map vertex weight visualization
 * - Per-bone weight adjustment with blend radius
 * - Weight normalization (ensures weights sum to 1.0)
 * - Max influences per vertex (typically 4)
 */
import * as THREE from 'three'

// ── Types ──

export interface VertexWeight {
    /** Bone index in the skeleton */
    boneIndex: number
    /** Bone name for display */
    boneName: string
    /** Weight value (0–1) */
    weight: number
}

export interface WeightPaintConfig {
    /** Maximum bone influences per vertex */
    maxInfluences: number
    /** Whether to auto-normalize weights */
    autoNormalize: boolean
    /** Envelope multiplier for auto-weighting */
    envelopeScale: number
    /** Falloff function for distance weighting */
    falloff: 'linear' | 'smooth' | 'sharp' | 'constant'
    /** Brush radius (in model units) */
    brushRadius: number
    /** Brush strength (0–1) */
    brushStrength: number
    /** Paint mode */
    mode: 'add' | 'subtract' | 'smooth' | 'normalize'
}

export const DEFAULT_WEIGHT_CONFIG: WeightPaintConfig = {
    maxInfluences: 4,
    autoNormalize: true,
    envelopeScale: 1.0,
    falloff: 'smooth',
    brushRadius: 0.1,
    brushStrength: 0.5,
    mode: 'add',
}

// ── Heat-map Colors ──

const HEAT_COLORS: [number, THREE.Color][] = [
    [0.0, new THREE.Color(0x000066)],   // dark blue  — no influence
    [0.2, new THREE.Color(0x0000ff)],   // blue
    [0.4, new THREE.Color(0x00ffff)],   // cyan
    [0.6, new THREE.Color(0x00ff00)],   // green
    [0.8, new THREE.Color(0xffff00)],   // yellow
    [1.0, new THREE.Color(0xff0000)],   // red — full influence
]

/**
 * Get heat-map color for a weight value.
 */
export function weightToColor(weight: number): THREE.Color {
    const w = THREE.MathUtils.clamp(weight, 0, 1)
    const color = new THREE.Color()

    for (let i = 0; i < HEAT_COLORS.length - 1; i++) {
        const [t0, c0] = HEAT_COLORS[i]
        const [t1, c1] = HEAT_COLORS[i + 1]
        if (w >= t0 && w <= t1) {
            const t = (w - t0) / (t1 - t0)
            color.copy(c0).lerp(c1, t)
            return color
        }
    }
    return color.copy(HEAT_COLORS[HEAT_COLORS.length - 1][1])
}

// ── Falloff Functions ──

function linearFalloff(distance: number, radius: number): number {
    return Math.max(0, 1.0 - distance / radius)
}

function smoothFalloff(distance: number, radius: number): number {
    const t = Math.max(0, 1.0 - distance / radius)
    return t * t * (3 - 2 * t) // smoothstep
}

function sharpFalloff(distance: number, radius: number): number {
    const t = Math.max(0, 1.0 - distance / radius)
    return t * t * t
}

function constantFalloff(distance: number, radius: number): number {
    return distance <= radius ? 1.0 : 0.0
}

const FALLOFF_FNS: Record<WeightPaintConfig['falloff'], (d: number, r: number) => number> = {
    linear: linearFalloff,
    smooth: smoothFalloff,
    sharp: sharpFalloff,
    constant: constantFalloff,
}

// ── Auto-Weighting ──

/**
 * Auto-weight a skinned mesh using envelope distance-based painting.
 * Each vertex gets weights proportional to its distance from nearby bones.
 */
export function autoWeight(
    geometry: THREE.BufferGeometry,
    skeleton: THREE.Skeleton,
    config: WeightPaintConfig = DEFAULT_WEIGHT_CONFIG
): { skinIndices: Uint16Array; skinWeights: Float32Array } {
    const positionAttr = geometry.getAttribute('position')
    const vertexCount = positionAttr.count
    const boneCount = skeleton.bones.length
    const maxInf = config.maxInfluences

    const skinIndices = new Uint16Array(vertexCount * 4)
    const skinWeights = new Float32Array(vertexCount * 4)

    // Pre-compute bone world positions
    const bonePositions: THREE.Vector3[] = skeleton.bones.map(bone => {
        const pos = new THREE.Vector3()
        bone.getWorldPosition(pos)
        return pos
    })

    // Get bone envelope radii (use length as approximation)
    const boneRadii: number[] = skeleton.bones.map((bone, i) => {
        // Find children to compute bone length
        const children = skeleton.bones.filter(b => b.parent === bone)
        if (children.length > 0) {
            const childPos = new THREE.Vector3()
            children[0].getWorldPosition(childPos)
            return bonePositions[i].distanceTo(childPos) * config.envelopeScale
        }
        // Leaf bone — use parent's length as fallback
        if (bone.parent && (bone.parent as THREE.Bone).isBone) {
            const parentIdx = skeleton.bones.indexOf(bone.parent as THREE.Bone)
            if (parentIdx >= 0) {
                return bonePositions[parentIdx].distanceTo(bonePositions[i]) * config.envelopeScale
            }
        }
        return 0.5 * config.envelopeScale
    })

    const falloffFn = FALLOFF_FNS[config.falloff]
    const vertexPos = new THREE.Vector3()

    for (let v = 0; v < vertexCount; v++) {
        vertexPos.fromBufferAttribute(positionAttr, v)

        // Compute influence from each bone
        const influences: { boneIndex: number; weight: number }[] = []

        for (let b = 0; b < boneCount; b++) {
            const dist = vertexPos.distanceTo(bonePositions[b])
            const radius = boneRadii[b]
            if (radius <= 0) continue
            const w = falloffFn(dist, radius)
            if (w > 0) {
                influences.push({ boneIndex: b, weight: w })
            }
        }

        // Sort by weight (highest first)
        influences.sort((a, b) => b.weight - a.weight)

        // Clamp to max influences
        const topInfluences = influences.slice(0, maxInf)

        // Normalize
        const totalWeight = topInfluences.reduce((sum, inf) => sum + inf.weight, 0)
        if (totalWeight > 0) {
            for (const inf of topInfluences) {
                inf.weight /= totalWeight
            }
        }

        // Write to arrays
        for (let i = 0; i < 4; i++) {
            const offset = v * 4 + i
            if (i < topInfluences.length) {
                skinIndices[offset] = topInfluences[i].boneIndex
                skinWeights[offset] = topInfluences[i].weight
            } else {
                skinIndices[offset] = 0
                skinWeights[offset] = 0
            }
        }
    }

    return { skinIndices, skinWeights }
}

/**
 * Apply auto-computed weights to a skinned mesh.
 */
export function applyWeights(
    mesh: THREE.SkinnedMesh,
    skinIndices: Uint16Array,
    skinWeights: Float32Array
): void {
    const geometry = mesh.geometry
    geometry.setAttribute(
        'skinIndex',
        new THREE.BufferAttribute(skinIndices, 4)
    )
    geometry.setAttribute(
        'skinWeight',
        new THREE.BufferAttribute(skinWeights, 4)
    )
    geometry.attributes.skinIndex.needsUpdate = true
    geometry.attributes.skinWeight.needsUpdate = true
}

/**
 * Create a weight visualization overlay.
 * Returns vertex colors representing the selected bone's influence.
 */
export function createWeightVisualization(
    geometry: THREE.BufferGeometry,
    boneIndex: number
): Float32Array {
    const vertexCount = geometry.getAttribute('position').count
    const skinWeightAttr = geometry.getAttribute('skinWeight') as THREE.BufferAttribute
    const skinIndexAttr = geometry.getAttribute('skinIndex') as THREE.BufferAttribute

    const colors = new Float32Array(vertexCount * 3)

    if (!skinWeightAttr || !skinIndexAttr) {
        // No weights assigned yet — all blue
        for (let v = 0; v < vertexCount; v++) {
            const color = weightToColor(0)
            colors[v * 3] = color.r
            colors[v * 3 + 1] = color.g
            colors[v * 3 + 2] = color.b
        }
        return colors
    }

    for (let v = 0; v < vertexCount; v++) {
        let weight = 0
        for (let i = 0; i < 4; i++) {
            const idx = skinIndexAttr.getComponent(v * 4 + i)
            if (idx === boneIndex) {
                weight = skinWeightAttr.getComponent(v * 4 + i)
                break
            }
        }
        const color = weightToColor(weight)
        colors[v * 3] = color.r
        colors[v * 3 + 1] = color.g
        colors[v * 3 + 2] = color.b
    }

    return colors
}

/**
 * Paint weights at a specific point on the mesh.
 * Used for manual weight painting with the brush tool.
 */
export function paintWeightsAtPoint(
    geometry: THREE.BufferGeometry,
    point: THREE.Vector3,
    boneIndex: number,
    config: WeightPaintConfig
): void {
    const positionAttr = geometry.getAttribute('position')
    const skinWeightAttr = geometry.getAttribute('skinWeight') as THREE.BufferAttribute
    const skinIndexAttr = geometry.getAttribute('skinIndex') as THREE.BufferAttribute

    if (!skinWeightAttr || !skinIndexAttr) return

    const vertexCount = positionAttr.count
    const falloffFn = FALLOFF_FNS[config.falloff]
    const vertexPos = new THREE.Vector3()

    for (let v = 0; v < vertexCount; v++) {
        vertexPos.fromBufferAttribute(positionAttr, v)
        const dist = vertexPos.distanceTo(point)

        if (dist > config.brushRadius) continue

        const influence = falloffFn(dist, config.brushRadius) * config.brushStrength

        // Find if this bone already influences this vertex
        let existingSlot = -1
        let minWeight = Infinity
        let minSlot = 0

        for (let i = 0; i < 4; i++) {
            const offset = v * 4 + i
            if (skinIndexAttr.array[offset] === boneIndex) {
                existingSlot = i
                break
            }
            const w = skinWeightAttr.array[offset]
            if (w < minWeight) {
                minWeight = w
                minSlot = i
            }
        }

        const slot = existingSlot >= 0 ? existingSlot : minSlot
        const offset = v * 4 + slot

        if (existingSlot < 0) {
            ; (skinIndexAttr.array as Uint16Array)[offset] = boneIndex
        }

        const currentWeight = skinWeightAttr.array[offset]

        switch (config.mode) {
            case 'add':
                (skinWeightAttr.array as Float32Array)[offset] = Math.min(1, currentWeight + influence)
                break
            case 'subtract':
                (skinWeightAttr.array as Float32Array)[offset] = Math.max(0, currentWeight - influence)
                break
            case 'smooth': {
                // Average with neighbors (simplified)
                let sum = currentWeight
                let count = 1
                for (let i = 0; i < 4; i++) {
                    const w = skinWeightAttr.array[v * 4 + i]
                    if (w > 0) { sum += w; count++ }
                }
                (skinWeightAttr.array as Float32Array)[offset] = currentWeight + (sum / count - currentWeight) * influence
                break
            }
        }

        // Auto-normalize
        if (config.autoNormalize) {
            let total = 0
            for (let i = 0; i < 4; i++) {
                total += skinWeightAttr.array[v * 4 + i]
            }
            if (total > 0) {
                for (let i = 0; i < 4; i++) {
                    (skinWeightAttr.array as Float32Array)[v * 4 + i] /= total
                }
            }
        }
    }

    skinWeightAttr.needsUpdate = true
    skinIndexAttr.needsUpdate = true
}
