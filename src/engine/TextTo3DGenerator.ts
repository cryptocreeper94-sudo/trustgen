/* ====== TrustGen — Self-Contained Text-to-3D Generator ======
 * Natural language → Structured scene graph → Procedural THREE.js geometry.
 * Same pattern as Lume's English Mode: intent parsing → code generation.
 *
 * Pipeline:
 *   1. User types description (max 1000 chars)
 *   2. OpenAI parses into structured SceneGraph JSON
 *   3. Generator builds THREE.js geometry from the scene graph
 *   4. Materials applied based on text descriptors
 *   5. Returns a composed THREE.Group ready to add to the scene
 *
 * NO external 3D services — everything is generated procedurally.
 */
import * as THREE from 'three'

// ── Scene Graph Types (the intermediate representation) ──

export type PrimitiveShape =
    | 'box' | 'sphere' | 'cylinder' | 'cone' | 'torus'
    | 'plane' | 'capsule' | 'ring' | 'dodecahedron'
    | 'octahedron' | 'icosahedron' | 'tetrahedron'

export interface SceneGraphNode {
    /** Shape name */
    name: string
    /** Primitive type */
    shape: PrimitiveShape
    /** Size in model units */
    size: { x: number; y: number; z: number }
    /** Position relative to parent or origin */
    position: { x: number; y: number; z: number }
    /** Rotation in degrees */
    rotation: { x: number; y: number; z: number }
    /** Material descriptor */
    material: {
        color: string       // hex color
        metalness: number   // 0–1
        roughness: number   // 0–1
        emissive?: string   // hex color for glow
        emissiveIntensity?: number
        opacity?: number
        transparent?: boolean
    }
    /** Child objects */
    children?: SceneGraphNode[]
}

export interface SceneGraph {
    /** Root-level objects */
    objects: SceneGraphNode[]
    /** Overall scene description (for metadata) */
    description: string
}

// ── OpenAI Prompt ──

const SYSTEM_PROMPT = `You are a 3D scene composer for a browser-based 3D engine.
Given a text description, output a JSON scene graph that can be procedurally generated using primitive shapes.

Available shapes: box, sphere, cylinder, cone, torus, plane, capsule, ring, dodecahedron, octahedron, icosahedron, tetrahedron

Rules:
- Compose complex objects from multiple primitives (e.g., a table = 1 box top + 4 cylinder legs)
- Use realistic proportions (units are meters)
- Position children relative to parent center
- Colors should be realistic hex values
- metalness 0.0 = matte/wood/plastic, 1.0 = pure metal
- roughness 0.0 = mirror/glass, 1.0 = rough stone
- Keep object count reasonable (max ~20 primitives)
- Rotation is in degrees

Output ONLY valid JSON matching this schema, no explanation:
{
  "description": "brief description",
  "objects": [
    {
      "name": "part name",
      "shape": "box",
      "size": {"x": 1, "y": 0.1, "z": 0.6},
      "position": {"x": 0, "y": 0.75, "z": 0},
      "rotation": {"x": 0, "y": 0, "z": 0},
      "material": {
        "color": "#8B4513",
        "metalness": 0.0,
        "roughness": 0.8
      },
      "children": []
    }
  ]
}`

// ── Parse Text → Scene Graph (via OpenAI) ──

export async function parseDescription(
    description: string,
    apiBaseUrl: string = '/api/ai/text-to-3d'
): Promise<SceneGraph> {
    const res = await fetch(apiBaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: description.slice(0, 1000) }),
    })

    if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Text-to-3D parsing failed (${res.status}): ${errText}`)
    }

    const data = await res.json()
    return data.sceneGraph as SceneGraph
}

// ── Fallback: Local keyword-based parser (no API needed) ──

const MATERIAL_MAP: Record<string, Partial<SceneGraphNode['material']>> = {
    wood: { color: '#8B4513', metalness: 0.0, roughness: 0.85 },
    wooden: { color: '#8B4513', metalness: 0.0, roughness: 0.85 },
    oak: { color: '#B8860B', metalness: 0.0, roughness: 0.8 },
    pine: { color: '#DEB887', metalness: 0.0, roughness: 0.9 },
    metal: { color: '#A8A8A8', metalness: 0.95, roughness: 0.2 },
    steel: { color: '#C0C0C0', metalness: 1.0, roughness: 0.15 },
    iron: { color: '#696969', metalness: 0.9, roughness: 0.4 },
    gold: { color: '#FFD700', metalness: 1.0, roughness: 0.1 },
    silver: { color: '#C0C0C0', metalness: 1.0, roughness: 0.1 },
    bronze: { color: '#CD7F32', metalness: 0.9, roughness: 0.3 },
    copper: { color: '#B87333', metalness: 0.9, roughness: 0.25 },
    glass: { color: '#87CEEB', metalness: 0.0, roughness: 0.0, opacity: 0.3, transparent: true },
    crystal: { color: '#E0E8FF', metalness: 0.1, roughness: 0.0, opacity: 0.5, transparent: true },
    ice: { color: '#E0F0FF', metalness: 0.0, roughness: 0.05, opacity: 0.6, transparent: true },
    stone: { color: '#808080', metalness: 0.0, roughness: 0.95 },
    marble: { color: '#F5F5F5', metalness: 0.1, roughness: 0.3 },
    granite: { color: '#696969', metalness: 0.05, roughness: 0.85 },
    brick: { color: '#A0522D', metalness: 0.0, roughness: 0.95 },
    concrete: { color: '#A9A9A9', metalness: 0.0, roughness: 0.9 },
    plastic: { color: '#FF6347', metalness: 0.0, roughness: 0.5 },
    rubber: { color: '#2F4F4F', metalness: 0.0, roughness: 0.95 },
    leather: { color: '#8B4513', metalness: 0.0, roughness: 0.75 },
    fabric: { color: '#4682B4', metalness: 0.0, roughness: 0.95 },
    clay: { color: '#CD853F', metalness: 0.0, roughness: 0.9 },
    ceramic: { color: '#FAEBD7', metalness: 0.1, roughness: 0.4 },
    porcelain: { color: '#FFFFF0', metalness: 0.1, roughness: 0.2 },
    neon: { color: '#00FFFF', metalness: 0.0, roughness: 0.3, emissive: '#00FFFF', emissiveIntensity: 2 },
    glowing: { color: '#ADFF2F', metalness: 0.0, roughness: 0.3, emissive: '#ADFF2F', emissiveIntensity: 1.5 },
    lava: { color: '#FF4500', metalness: 0.0, roughness: 0.6, emissive: '#FF4500', emissiveIntensity: 3 },
    obsidian: { color: '#1C1C1C', metalness: 0.4, roughness: 0.1 },
    jade: { color: '#00A86B', metalness: 0.1, roughness: 0.3 },
    ruby: { color: '#E0115F', metalness: 0.2, roughness: 0.15, emissive: '#E0115F', emissiveIntensity: 0.3 },
    emerald: { color: '#50C878', metalness: 0.2, roughness: 0.15, emissive: '#50C878', emissiveIntensity: 0.3 },
    diamond: { color: '#B9F2FF', metalness: 0.1, roughness: 0.0, opacity: 0.7, transparent: true },
}

const OBJECT_TEMPLATES: Record<string, () => SceneGraphNode[]> = {
    table: () => [
        { name: 'Tabletop', shape: 'box', size: { x: 1.2, y: 0.06, z: 0.7 }, position: { x: 0, y: 0.74, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.85 } },
        { name: 'Leg FL', shape: 'cylinder', size: { x: 0.04, y: 0.72, z: 0.04 }, position: { x: -0.52, y: 0.37, z: -0.28 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.85 } },
        { name: 'Leg FR', shape: 'cylinder', size: { x: 0.04, y: 0.72, z: 0.04 }, position: { x: 0.52, y: 0.37, z: -0.28 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.85 } },
        { name: 'Leg BL', shape: 'cylinder', size: { x: 0.04, y: 0.72, z: 0.04 }, position: { x: -0.52, y: 0.37, z: 0.28 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.85 } },
        { name: 'Leg BR', shape: 'cylinder', size: { x: 0.04, y: 0.72, z: 0.04 }, position: { x: 0.52, y: 0.37, z: 0.28 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.85 } },
    ],
    desk: () => OBJECT_TEMPLATES.table(), // alias
    chair: () => [
        { name: 'Seat', shape: 'box', size: { x: 0.45, y: 0.05, z: 0.45 }, position: { x: 0, y: 0.45, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.8 } },
        { name: 'Back', shape: 'box', size: { x: 0.45, y: 0.45, z: 0.04 }, position: { x: 0, y: 0.72, z: -0.2 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.8 } },
        { name: 'Leg FL', shape: 'cylinder', size: { x: 0.03, y: 0.44, z: 0.03 }, position: { x: -0.18, y: 0.22, z: 0.18 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.8 } },
        { name: 'Leg FR', shape: 'cylinder', size: { x: 0.03, y: 0.44, z: 0.03 }, position: { x: 0.18, y: 0.22, z: 0.18 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.8 } },
        { name: 'Leg BL', shape: 'cylinder', size: { x: 0.03, y: 0.44, z: 0.03 }, position: { x: -0.18, y: 0.22, z: -0.18 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.8 } },
        { name: 'Leg BR', shape: 'cylinder', size: { x: 0.03, y: 0.44, z: 0.03 }, position: { x: 0.18, y: 0.22, z: -0.18 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.8 } },
    ],
    sword: () => [
        { name: 'Blade', shape: 'box', size: { x: 0.06, y: 0.8, z: 0.015 }, position: { x: 0, y: 0.55, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#C0C0C0', metalness: 1, roughness: 0.15 } },
        { name: 'Guard', shape: 'box', size: { x: 0.2, y: 0.03, z: 0.03 }, position: { x: 0, y: 0.15, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FFD700', metalness: 0.9, roughness: 0.2 } },
        { name: 'Grip', shape: 'cylinder', size: { x: 0.025, y: 0.14, z: 0.025 }, position: { x: 0, y: 0.06, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#654321', metalness: 0, roughness: 0.9 } },
        { name: 'Pommel', shape: 'sphere', size: { x: 0.035, y: 0.035, z: 0.035 }, position: { x: 0, y: -0.02, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FFD700', metalness: 0.9, roughness: 0.2 } },
    ],
    tree: () => [
        { name: 'Trunk', shape: 'cylinder', size: { x: 0.2, y: 1.5, z: 0.2 }, position: { x: 0, y: 0.75, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#654321', metalness: 0, roughness: 0.95 } },
        { name: 'Canopy', shape: 'sphere', size: { x: 1.2, y: 1.0, z: 1.2 }, position: { x: 0, y: 1.8, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#228B22', metalness: 0, roughness: 0.9 } },
    ],
    house: () => [
        { name: 'Walls', shape: 'box', size: { x: 3, y: 2.5, z: 3 }, position: { x: 0, y: 1.25, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#F5F5DC', metalness: 0, roughness: 0.8 } },
        { name: 'Roof', shape: 'cone', size: { x: 2.2, y: 1.0, z: 2.2 }, position: { x: 0, y: 3.0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#A0522D', metalness: 0, roughness: 0.85 } },
        { name: 'Door', shape: 'box', size: { x: 0.6, y: 1.6, z: 0.06 }, position: { x: 0, y: 0.8, z: 1.52 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#654321', metalness: 0, roughness: 0.8 } },
    ],
    car: () => [
        { name: 'Body', shape: 'box', size: { x: 1.8, y: 0.6, z: 4 }, position: { x: 0, y: 0.65, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#CC0000', metalness: 0.7, roughness: 0.3 } },
        { name: 'Cabin', shape: 'box', size: { x: 1.5, y: 0.5, z: 1.5 }, position: { x: 0, y: 1.2, z: -0.3 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#87CEEB', metalness: 0.1, roughness: 0.1, opacity: 0.5, transparent: true } },
        { name: 'Wheel FL', shape: 'torus', size: { x: 0.35, y: 0.12, z: 0.35 }, position: { x: -0.9, y: 0.35, z: 1.3 }, rotation: { x: 0, y: 0, z: 90 }, material: { color: '#1C1C1C', metalness: 0, roughness: 0.9 } },
        { name: 'Wheel FR', shape: 'torus', size: { x: 0.35, y: 0.12, z: 0.35 }, position: { x: 0.9, y: 0.35, z: 1.3 }, rotation: { x: 0, y: 0, z: 90 }, material: { color: '#1C1C1C', metalness: 0, roughness: 0.9 } },
        { name: 'Wheel BL', shape: 'torus', size: { x: 0.35, y: 0.12, z: 0.35 }, position: { x: -0.9, y: 0.35, z: -1.3 }, rotation: { x: 0, y: 0, z: 90 }, material: { color: '#1C1C1C', metalness: 0, roughness: 0.9 } },
        { name: 'Wheel BR', shape: 'torus', size: { x: 0.35, y: 0.12, z: 0.35 }, position: { x: 0.9, y: 0.35, z: -1.3 }, rotation: { x: 0, y: 0, z: 90 }, material: { color: '#1C1C1C', metalness: 0, roughness: 0.9 } },
    ],
    lamp: () => [
        { name: 'Base', shape: 'cylinder', size: { x: 0.15, y: 0.03, z: 0.15 }, position: { x: 0, y: 0.015, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#2F4F4F', metalness: 0.8, roughness: 0.3 } },
        { name: 'Pole', shape: 'cylinder', size: { x: 0.02, y: 0.5, z: 0.02 }, position: { x: 0, y: 0.28, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#2F4F4F', metalness: 0.8, roughness: 0.3 } },
        { name: 'Shade', shape: 'cone', size: { x: 0.2, y: 0.15, z: 0.2 }, position: { x: 0, y: 0.56, z: 0 }, rotation: { x: 180, y: 0, z: 0 }, material: { color: '#FAEBD7', metalness: 0, roughness: 0.7 } },
        { name: 'Bulb', shape: 'sphere', size: { x: 0.04, y: 0.06, z: 0.04 }, position: { x: 0, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FFF8DC', metalness: 0, roughness: 0.3, emissive: '#FFF8DC', emissiveIntensity: 2 } },
    ],
    book: () => [
        { name: 'Cover', shape: 'box', size: { x: 0.18, y: 0.03, z: 0.24 }, position: { x: 0, y: 0.015, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B0000', metalness: 0, roughness: 0.7 } },
        { name: 'Pages', shape: 'box', size: { x: 0.16, y: 0.025, z: 0.22 }, position: { x: 0, y: 0.015, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FFFFF0', metalness: 0, roughness: 0.95 } },
    ],
    shield: () => [
        { name: 'Body', shape: 'sphere', size: { x: 0.5, y: 0.6, z: 0.08 }, position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#A8A8A8', metalness: 0.9, roughness: 0.3 } },
        { name: 'Boss', shape: 'sphere', size: { x: 0.1, y: 0.1, z: 0.1 }, position: { x: 0, y: 0, z: 0.04 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FFD700', metalness: 1, roughness: 0.1 } },
    ],
    barrel: () => [
        { name: 'Body', shape: 'cylinder', size: { x: 0.35, y: 0.6, z: 0.35 }, position: { x: 0, y: 0.3, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.85 } },
        { name: 'Band Top', shape: 'torus', size: { x: 0.36, y: 0.02, z: 0.36 }, position: { x: 0, y: 0.52, z: 0 }, rotation: { x: 90, y: 0, z: 0 }, material: { color: '#696969', metalness: 0.9, roughness: 0.4 } },
        { name: 'Band Bottom', shape: 'torus', size: { x: 0.36, y: 0.02, z: 0.36 }, position: { x: 0, y: 0.08, z: 0 }, rotation: { x: 90, y: 0, z: 0 }, material: { color: '#696969', metalness: 0.9, roughness: 0.4 } },
    ],
    pillar: () => [
        { name: 'Column', shape: 'cylinder', size: { x: 0.25, y: 2.5, z: 0.25 }, position: { x: 0, y: 1.25, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#F5F5F5', metalness: 0.1, roughness: 0.3 } },
        { name: 'Base', shape: 'box', size: { x: 0.5, y: 0.15, z: 0.5 }, position: { x: 0, y: 0.075, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#F5F5F5', metalness: 0.1, roughness: 0.3 } },
        { name: 'Capital', shape: 'box', size: { x: 0.5, y: 0.15, z: 0.5 }, position: { x: 0, y: 2.55, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#F5F5F5', metalness: 0.1, roughness: 0.3 } },
    ],
    sphere: () => [
        { name: 'Sphere', shape: 'sphere', size: { x: 1, y: 1, z: 1 }, position: { x: 0, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#4682B4', metalness: 0.3, roughness: 0.4 } },
    ],
    cube: () => [
        { name: 'Cube', shape: 'box', size: { x: 1, y: 1, z: 1 }, position: { x: 0, y: 0.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#4682B4', metalness: 0.3, roughness: 0.4 } },
    ],
    box: () => OBJECT_TEMPLATES.cube(),
    pyramid: () => [
        { name: 'Pyramid', shape: 'cone', size: { x: 1, y: 1.5, z: 1 }, position: { x: 0, y: 0.75, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#DAA520', metalness: 0.1, roughness: 0.7 } },
    ],
    gem: () => [
        { name: 'Crystal', shape: 'octahedron', size: { x: 0.4, y: 0.6, z: 0.4 }, position: { x: 0, y: 0.3, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#9B59B6', metalness: 0.2, roughness: 0.05, emissive: '#9B59B6', emissiveIntensity: 0.5, opacity: 0.8, transparent: true } },
    ],
    crystal: () => OBJECT_TEMPLATES.gem(),
    chest: () => [
        { name: 'Body', shape: 'box', size: { x: 0.6, y: 0.3, z: 0.35 }, position: { x: 0, y: 0.15, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#8B4513', metalness: 0, roughness: 0.85 } },
        { name: 'Lid', shape: 'cylinder', size: { x: 0.3, y: 0.62, z: 0.35 }, position: { x: 0, y: 0.3, z: 0 }, rotation: { x: 0, y: 0, z: 90 }, material: { color: '#8B4513', metalness: 0, roughness: 0.85 } },
        { name: 'Latch', shape: 'box', size: { x: 0.08, y: 0.06, z: 0.03 }, position: { x: 0, y: 0.25, z: 0.18 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FFD700', metalness: 0.9, roughness: 0.2 } },
    ],
    crown: () => [
        { name: 'Band', shape: 'torus', size: { x: 0.12, y: 0.04, z: 0.12 }, position: { x: 0, y: 0, z: 0 }, rotation: { x: 90, y: 0, z: 0 }, material: { color: '#FFD700', metalness: 1, roughness: 0.1 } },
        { name: 'Point1', shape: 'cone', size: { x: 0.03, y: 0.06, z: 0.03 }, position: { x: 0, y: 0.05, z: 0.12 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FFD700', metalness: 1, roughness: 0.1 } },
        { name: 'Point2', shape: 'cone', size: { x: 0.03, y: 0.06, z: 0.03 }, position: { x: 0.1, y: 0.05, z: 0.06 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FFD700', metalness: 1, roughness: 0.1 } },
        { name: 'Point3', shape: 'cone', size: { x: 0.03, y: 0.06, z: 0.03 }, position: { x: 0.1, y: 0.05, z: -0.06 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FFD700', metalness: 1, roughness: 0.1 } },
        { name: 'Point4', shape: 'cone', size: { x: 0.03, y: 0.06, z: 0.03 }, position: { x: 0, y: 0.05, z: -0.12 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FFD700', metalness: 1, roughness: 0.1 } },
        { name: 'Point5', shape: 'cone', size: { x: 0.03, y: 0.06, z: 0.03 }, position: { x: -0.1, y: 0.05, z: -0.06 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FFD700', metalness: 1, roughness: 0.1 } },
        { name: 'Point6', shape: 'cone', size: { x: 0.03, y: 0.06, z: 0.03 }, position: { x: -0.1, y: 0.05, z: 0.06 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FFD700', metalness: 1, roughness: 0.1 } },
        { name: 'Gem', shape: 'octahedron', size: { x: 0.03, y: 0.04, z: 0.03 }, position: { x: 0, y: 0.02, z: 0.12 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#E0115F', metalness: 0.2, roughness: 0.1, emissive: '#E0115F', emissiveIntensity: 0.5 } },
    ],
    humanoid: () => [
        { name: 'Torso', shape: 'box', size: { x: 0.4, y: 0.5, z: 0.25 }, position: { x: 0, y: 1.15, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#4682B4', metalness: 0, roughness: 0.7 } },
        { name: 'Head', shape: 'sphere', size: { x: 0.22, y: 0.26, z: 0.22 }, position: { x: 0, y: 1.55, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FDBCB4', metalness: 0, roughness: 0.8 } },
        { name: 'L Arm', shape: 'capsule', size: { x: 0.08, y: 0.5, z: 0.08 }, position: { x: -0.3, y: 1.1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FDBCB4', metalness: 0, roughness: 0.8 } },
        { name: 'R Arm', shape: 'capsule', size: { x: 0.08, y: 0.5, z: 0.08 }, position: { x: 0.3, y: 1.1, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#FDBCB4', metalness: 0, roughness: 0.8 } },
        { name: 'L Leg', shape: 'capsule', size: { x: 0.1, y: 0.55, z: 0.1 }, position: { x: -0.12, y: 0.55, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#2F4F4F', metalness: 0, roughness: 0.8 } },
        { name: 'R Leg', shape: 'capsule', size: { x: 0.1, y: 0.55, z: 0.1 }, position: { x: 0.12, y: 0.55, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#2F4F4F', metalness: 0, roughness: 0.8 } },
    ],
    person: () => OBJECT_TEMPLATES.humanoid(),
    character: () => OBJECT_TEMPLATES.humanoid(),
    robot: () => [
        { name: 'Torso', shape: 'box', size: { x: 0.5, y: 0.6, z: 0.3 }, position: { x: 0, y: 1.0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#A8A8A8', metalness: 0.9, roughness: 0.25 } },
        { name: 'Head', shape: 'box', size: { x: 0.3, y: 0.3, z: 0.3 }, position: { x: 0, y: 1.5, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#A8A8A8', metalness: 0.9, roughness: 0.25 } },
        { name: 'Eye L', shape: 'sphere', size: { x: 0.05, y: 0.05, z: 0.05 }, position: { x: -0.08, y: 1.53, z: 0.15 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#00FFFF', metalness: 0, roughness: 0.3, emissive: '#00FFFF', emissiveIntensity: 2 } },
        { name: 'Eye R', shape: 'sphere', size: { x: 0.05, y: 0.05, z: 0.05 }, position: { x: 0.08, y: 1.53, z: 0.15 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#00FFFF', metalness: 0, roughness: 0.3, emissive: '#00FFFF', emissiveIntensity: 2 } },
        { name: 'L Arm', shape: 'cylinder', size: { x: 0.07, y: 0.5, z: 0.07 }, position: { x: -0.35, y: 1.0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#696969', metalness: 0.8, roughness: 0.3 } },
        { name: 'R Arm', shape: 'cylinder', size: { x: 0.07, y: 0.5, z: 0.07 }, position: { x: 0.35, y: 1.0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#696969', metalness: 0.8, roughness: 0.3 } },
        { name: 'L Leg', shape: 'cylinder', size: { x: 0.08, y: 0.5, z: 0.08 }, position: { x: -0.12, y: 0.45, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#696969', metalness: 0.8, roughness: 0.3 } },
        { name: 'R Leg', shape: 'cylinder', size: { x: 0.08, y: 0.5, z: 0.08 }, position: { x: 0.12, y: 0.45, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, material: { color: '#696969', metalness: 0.8, roughness: 0.3 } },
    ],
}

/**
 * Local fallback parser — extracts objects and materials from keywords.
 * No API needed. Works offline.
 */
export function parseDescriptionLocal(description: string): SceneGraph {
    const lower = description.toLowerCase()
    const objects: SceneGraphNode[] = []

    // Find material modifiers
    let materialOverride: Partial<SceneGraphNode['material']> | null = null
    for (const [keyword, mat] of Object.entries(MATERIAL_MAP)) {
        if (lower.includes(keyword)) {
            materialOverride = mat
            break
        }
    }

    // Find known objects
    let foundAny = false
    for (const [keyword, template] of Object.entries(OBJECT_TEMPLATES)) {
        if (lower.includes(keyword)) {
            const nodes = template()
            // Apply material override if found
            if (materialOverride) {
                for (const node of nodes) {
                    node.material = { ...node.material, ...materialOverride }
                }
            }
            objects.push(...nodes)
            foundAny = true
            break // use first match
        }
    }

    // Color keywords
    const COLOR_MAP: Record<string, string> = {
        red: '#CC0000', blue: '#0066CC', green: '#228B22', yellow: '#FFD700',
        purple: '#800080', orange: '#FF8C00', pink: '#FF69B4', black: '#1C1C1C',
        white: '#F5F5F5', cyan: '#00CED1', teal: '#008080',
    }
    let colorOverride: string | null = null
    for (const [name, hex] of Object.entries(COLOR_MAP)) {
        if (lower.includes(name)) { colorOverride = hex; break }
    }

    // If no template matched, create a generic shape from keywords
    if (!foundAny) {
        let shape: PrimitiveShape = 'box'
        if (lower.includes('sphere') || lower.includes('ball') || lower.includes('orb')) shape = 'sphere'
        else if (lower.includes('cylinder') || lower.includes('tube') || lower.includes('pipe')) shape = 'cylinder'
        else if (lower.includes('cone') || lower.includes('peak')) shape = 'cone'
        else if (lower.includes('ring') || lower.includes('donut') || lower.includes('torus')) shape = 'torus'
        else if (lower.includes('diamond')) shape = 'octahedron'
        else if (lower.includes('gem') || lower.includes('crystal')) shape = 'dodecahedron'
        else if (lower.includes('floor') || lower.includes('ground') || lower.includes('wall')) shape = 'plane'

        const mat = materialOverride || { color: colorOverride || '#4682B4', metalness: 0.3, roughness: 0.4 }
        if (colorOverride && !materialOverride) mat.color = colorOverride

        objects.push({
            name: description.slice(0, 30),
            shape,
            size: { x: 1, y: 1, z: 1 },
            position: { x: 0, y: 0.5, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            material: { color: mat.color!, metalness: mat.metalness ?? 0.3, roughness: mat.roughness ?? 0.4, ...mat },
        })
    } else if (colorOverride) {
        // Apply color override to all found objects
        for (const obj of objects) {
            obj.material.color = colorOverride
        }
    }

    return { description, objects }
}

// ── Scene Graph → THREE.js Geometry ──

const DEG = Math.PI / 180

function createGeometry(shape: PrimitiveShape, size: { x: number; y: number; z: number }): THREE.BufferGeometry {
    switch (shape) {
        case 'box': return new THREE.BoxGeometry(size.x, size.y, size.z)
        case 'sphere': return new THREE.SphereGeometry(size.x / 2, 32, 32)
        case 'cylinder': return new THREE.CylinderGeometry(size.x / 2, size.x / 2, size.y, 32)
        case 'cone': return new THREE.ConeGeometry(size.x / 2, size.y, 32)
        case 'torus': return new THREE.TorusGeometry(size.x / 2, size.y / 2, 16, 32)
        case 'plane': return new THREE.PlaneGeometry(size.x, size.z)
        case 'capsule': return new THREE.CapsuleGeometry(size.x / 2, size.y - size.x, 16, 16)
        case 'ring': return new THREE.RingGeometry(size.x / 3, size.x / 2, 32)
        case 'dodecahedron': return new THREE.DodecahedronGeometry(size.x / 2)
        case 'octahedron': return new THREE.OctahedronGeometry(size.x / 2)
        case 'icosahedron': return new THREE.IcosahedronGeometry(size.x / 2)
        case 'tetrahedron': return new THREE.TetrahedronGeometry(size.x / 2)
        default: return new THREE.BoxGeometry(size.x, size.y, size.z)
    }
}

function createMaterial(mat: SceneGraphNode['material']): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color: new THREE.Color(mat.color),
        metalness: mat.metalness,
        roughness: mat.roughness,
        emissive: mat.emissive ? new THREE.Color(mat.emissive) : undefined,
        emissiveIntensity: mat.emissiveIntensity ?? 0,
        opacity: mat.opacity ?? 1,
        transparent: mat.transparent ?? false,
        side: THREE.DoubleSide,
    })
}

/**
 * Convert a SceneGraph into a THREE.Group ready for the viewport.
 */
export function buildSceneGroup(sceneGraph: SceneGraph): THREE.Group {
    const group = new THREE.Group()
    group.name = sceneGraph.description || 'Generated Object'

    for (const node of sceneGraph.objects) {
        const mesh = buildNodeMesh(node)
        group.add(mesh)
    }

    return group
}

function buildNodeMesh(node: SceneGraphNode): THREE.Mesh | THREE.Group {
    const geometry = createGeometry(node.shape, node.size)
    const material = createMaterial(node.material)
    const mesh = new THREE.Mesh(geometry, material)

    mesh.name = node.name
    mesh.position.set(node.position.x, node.position.y, node.position.z)
    mesh.rotation.set(node.rotation.x * DEG, node.rotation.y * DEG, node.rotation.z * DEG)
    mesh.castShadow = true
    mesh.receiveShadow = true

    if (node.children && node.children.length > 0) {
        const group = new THREE.Group()
        group.name = node.name
        group.position.copy(mesh.position)
        group.rotation.copy(mesh.rotation)
        mesh.position.set(0, 0, 0)
        mesh.rotation.set(0, 0, 0)
        group.add(mesh)
        for (const child of node.children) {
            group.add(buildNodeMesh(child))
        }
        return group
    }

    return mesh
}

// ── Full Pipeline ──

export type GenerationMode = 'ai' | 'local'

/**
 * Full text-to-3D pipeline.
 * - 'ai' mode: sends to backend OpenAI endpoint for rich parsing
 * - 'local' mode: uses keyword matching (offline, instant)
 */
export async function generateFrom3DText(
    description: string,
    mode: GenerationMode = 'local'
): Promise<{ group: THREE.Group; sceneGraph: SceneGraph }> {
    let sceneGraph: SceneGraph

    if (mode === 'ai') {
        sceneGraph = await parseDescription(description)
    } else {
        sceneGraph = parseDescriptionLocal(description)
    }

    const group = buildSceneGroup(sceneGraph)
    return { group, sceneGraph }
}

/** Export: system prompt for the server-side endpoint */
export { SYSTEM_PROMPT as TEXT_TO_3D_SYSTEM_PROMPT }
