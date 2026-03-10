/* ====== TrustGen — Procedural Composer ====== */
/* Builds Three.js scene graphs from PropRecipe definitions */
import * as THREE from 'three'
import { MATERIAL_PRESETS } from '../types'
import type { PropRecipe, PropNode, PrimKind } from './propTypes'

// ── Geometry factory ──
function createGeometry(kind: PrimKind): THREE.BufferGeometry {
    switch (kind) {
        case 'box': return new THREE.BoxGeometry(1, 1, 1)
        case 'sphere': return new THREE.SphereGeometry(0.5, 24, 24)
        case 'cylinder': return new THREE.CylinderGeometry(0.5, 0.5, 1, 24)
        case 'cone': return new THREE.ConeGeometry(0.5, 1, 24)
        case 'torus': return new THREE.TorusGeometry(0.4, 0.15, 12, 36)
        case 'plane': return new THREE.PlaneGeometry(1, 1)
        case 'ring': return new THREE.RingGeometry(0.3, 0.5, 24)
        case 'dodecahedron': return new THREE.DodecahedronGeometry(0.5, 0)
        default: return new THREE.BoxGeometry(1, 1, 1)
    }
}

// ── Material factory ──
function createMaterial(node: PropNode): THREE.MeshStandardMaterial {
    const preset = MATERIAL_PRESETS[node.material] ?? MATERIAL_PRESETS.default
    const color = node.color ?? preset.color

    return new THREE.MeshStandardMaterial({
        color,
        metalness: preset.metalness,
        roughness: preset.roughness,
        emissive: new THREE.Color(preset.emissive),
        emissiveIntensity: preset.emissiveIntensity,
        opacity: preset.opacity,
        transparent: preset.transparent,
        wireframe: preset.wireframe,
        side: THREE.DoubleSide,
    })
}

// ── Build a single PropNode into a Three.js mesh ──
function buildNode(node: PropNode): THREE.Object3D {
    const geometry = createGeometry(node.primitive)
    const material = createMaterial(node)
    const mesh = new THREE.Mesh(geometry, material)

    mesh.name = node.label
    mesh.position.set(...node.position)
    mesh.scale.set(...node.scale)

    if (node.rotation) {
        const [rx, ry, rz] = node.rotation
        mesh.rotation.set(
            rx * Math.PI / 180,
            ry * Math.PI / 180,
            rz * Math.PI / 180,
        )
    }

    mesh.castShadow = true
    mesh.receiveShadow = true

    // Recursively build children
    if (node.children) {
        for (const child of node.children) {
            mesh.add(buildNode(child))
        }
    }

    return mesh
}

// ── Build a complete prop from recipe ──
export function composeFromRecipe(recipe: PropRecipe): THREE.Group {
    const group = new THREE.Group()
    group.name = recipe.name

    for (const node of recipe.nodes) {
        group.add(buildNode(node))
    }

    return group
}

// ── Build a full scene with ground, lighting, and the prop ──
export function composeScene(recipe: PropRecipe): THREE.Scene {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#111111')

    // Add the prop
    const prop = composeFromRecipe(recipe)
    scene.add(prop)

    // Add ground plane
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 20),
        new THREE.MeshStandardMaterial({ color: '#222222' }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Add lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.4)
    scene.add(ambient)

    const directional = new THREE.DirectionalLight(0xffffff, 0.8)
    directional.position.set(5, 10, 5)
    directional.castShadow = true
    directional.shadow.mapSize.set(2048, 2048)
    scene.add(directional)

    // Add a fill light
    const fill = new THREE.DirectionalLight(0x8888ff, 0.3)
    fill.position.set(-5, 5, -5)
    scene.add(fill)

    return scene
}

// ── Batch compose all recipes from an array ──
export function batchCompose(recipes: PropRecipe[]): Map<string, THREE.Group> {
    const results = new Map<string, THREE.Group>()
    for (const recipe of recipes) {
        results.set(recipe.id, composeFromRecipe(recipe))
    }
    return results
}
