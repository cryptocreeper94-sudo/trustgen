/* ====== TrustGen — Procedural Prop Composition Types ====== */
import type { MaterialPreset } from '../types'

export type PrimKind = 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus' | 'plane' | 'ring' | 'dodecahedron'

/** A single primitive node in a prop recipe */
export interface PropNode {
    /** Display name for the node */
    label: string
    /** Primitive geometry type */
    primitive: PrimKind
    /** Position offset [x, y, z] relative to parent group */
    position: [number, number, number]
    /** Scale [x, y, z] — geometry is unit-sized, so scale = world dimensions */
    scale: [number, number, number]
    /** Rotation in degrees [x, y, z] */
    rotation?: [number, number, number]
    /** Material preset name */
    material: MaterialPreset
    /** Override color (hex) — if omitted uses preset default */
    color?: string
    /** Child nodes grouped under this one */
    children?: PropNode[]
}

/** Complete recipe for one prop asset */
export interface PropRecipe {
    /** Must match a ChroniclesAsset.id */
    id: string
    /** Readable name */
    name: string
    /** Era for output path grouping */
    era: 'modern' | 'medieval' | 'wild-west'
    /** Category */
    category: 'environment' | 'storefront' | 'character' | 'pet'
    /** Root nodes composing the prop */
    nodes: PropNode[]
}
