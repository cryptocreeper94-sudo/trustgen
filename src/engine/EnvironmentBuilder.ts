/* ====== TrustGen — Procedural Environment Builder ======
 * Generate 3D rooms, landscapes, and sets from templates.
 * No imports needed — everything generated from primitives.
 *
 * Environments:
 *   - Indoor: Studio, Office, Living Room, Classroom, Warehouse
 *   - Outdoor: Park, Street, Rooftop, Beach, Forest
 *   - Stage: Podium, Interview Set, Presentation, Theater
 *   - Abstract: Void, Grid, Gradient, Particles
 */
import * as THREE from 'three'

// ── Types ──

export type EnvironmentCategory = 'indoor' | 'outdoor' | 'stage' | 'abstract'

export interface EnvironmentProp {
    name: string
    geometry: THREE.BufferGeometry
    material: THREE.MeshStandardMaterial
    position: THREE.Vector3
    rotation: THREE.Euler
    scale: THREE.Vector3
    castShadow: boolean
    receiveShadow: boolean
}

export interface EnvironmentPresetDef {
    id: string
    name: string
    icon: string
    category: EnvironmentCategory
    description: string
    /** Floor dimensions (width, depth) */
    floorSize: [number, number]
    /** Ambient light color & intensity */
    ambient: { color: string; intensity: number }
    /** Main directional light */
    mainLight: { color: string; intensity: number; position: [number, number, number] }
    /** Background/sky color */
    skyColor: string
    /** Fog settings */
    fog?: { color: string; near: number; far: number }
    /** Build function — returns meshes to compose the scene */
    build: () => THREE.Group
}

// ── Utility ──

function box(w: number, h: number, d: number, color: string, met = 0, rough = 0.8) {
    const geo = new THREE.BoxGeometry(w, h, d)
    const mat = new THREE.MeshStandardMaterial({ color, metalness: met, roughness: rough, side: THREE.DoubleSide })
    return new THREE.Mesh(geo, mat)
}

function cyl(r: number, h: number, color: string, met = 0, rough = 0.5) {
    const geo = new THREE.CylinderGeometry(r, r, h, 32)
    const mat = new THREE.MeshStandardMaterial({ color, metalness: met, roughness: rough })
    return new THREE.Mesh(geo, mat)
}

function plane(w: number, d: number, color: string, rough = 0.9) {
    const geo = new THREE.PlaneGeometry(w, d)
    const mat = new THREE.MeshStandardMaterial({ color, roughness: rough, side: THREE.DoubleSide })
    return new THREE.Mesh(geo, mat)
}

function sphere(r: number, color: string, met = 0, rough = 0.5) {
    const geo = new THREE.SphereGeometry(r, 32, 32)
    const mat = new THREE.MeshStandardMaterial({ color, metalness: met, roughness: rough })
    return new THREE.Mesh(geo, mat)
}

function addShadows(group: THREE.Group) {
    group.traverse(obj => {
        if ((obj as THREE.Mesh).isMesh) {
            obj.castShadow = true
            obj.receiveShadow = true
        }
    })
}

// ── Environment Presets ──

export const ENVIRONMENT_PRESETS: EnvironmentPresetDef[] = [
    // ── Indoor ──
    {
        id: 'studio', name: 'Photo Studio', icon: '📸', category: 'indoor',
        description: 'Clean white cyclorama with studio lights',
        floorSize: [12, 12], skyColor: '#f0f0f0',
        ambient: { color: '#ffffff', intensity: 0.6 },
        mainLight: { color: '#ffffff', intensity: 1.2, position: [3, 6, 3] },
        build: () => {
            const g = new THREE.Group(); g.name = 'Studio'
            // Cyc wall — floor + back + curve
            const floor = plane(12, 12, '#f0f0f0'); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor)
            const backWall = plane(12, 5, '#eeeeee'); backWall.position.set(0, 2.5, -6); backWall.receiveShadow = true; g.add(backWall)
            // Soft lights
            const softbox1 = box(0.5, 0.7, 0.1, '#1a1a1a', 0.5, 0.3); softbox1.position.set(-3, 3, 2); g.add(softbox1)
            const softbox2 = box(0.5, 0.7, 0.1, '#1a1a1a', 0.5, 0.3); softbox2.position.set(3, 3, 2); g.add(softbox2)
            addShadows(g); return g
        }
    },
    {
        id: 'office', name: 'Modern Office', icon: '🏢', category: 'indoor',
        description: 'Sleek office with desk and chair',
        floorSize: [8, 8], skyColor: '#1a1a2e',
        ambient: { color: '#c8d8e8', intensity: 0.4 },
        mainLight: { color: '#ffffff', intensity: 1.0, position: [2, 5, 3] },
        build: () => {
            const g = new THREE.Group(); g.name = 'Office'
            const floor = plane(8, 8, '#3a3a3a', 0.6); floor.rotation.x = -Math.PI / 2; g.add(floor)
            const wall1 = plane(8, 3.5, '#2a2a3a'); wall1.position.set(0, 1.75, -4); g.add(wall1)
            const wall2 = plane(8, 3.5, '#2a2a3a'); wall2.position.set(-4, 1.75, 0); wall2.rotation.y = Math.PI / 2; g.add(wall2)
            // Desk
            const deskTop = box(1.4, 0.04, 0.7, '#4a3a2a'); deskTop.position.set(0, 0.74, -2.5); g.add(deskTop)
            for (const x of [-0.6, 0.6]) {
                const leg = cyl(0.025, 0.72, '#333333', 0.8, 0.3); leg.position.set(x, 0.36, -2.5); g.add(leg)
            }
            // Monitor
            const monitor = box(0.6, 0.35, 0.02, '#111111', 0.5, 0.2); monitor.position.set(0, 0.97, -2.8); g.add(monitor)
            const screen = box(0.55, 0.31, 0.005, '#06b6d4', 0, 0.1); screen.position.set(0, 0.97, -2.79); g.add(screen)
            addShadows(g); return g
        }
    },
    {
        id: 'living-room', name: 'Living Room', icon: '🛋️', category: 'indoor',
        description: 'Cozy living room with sofa and coffee table',
        floorSize: [8, 8], skyColor: '#1a1520',
        ambient: { color: '#ffeedd', intensity: 0.3 },
        mainLight: { color: '#fff5e0', intensity: 0.8, position: [0, 4, 0] },
        build: () => {
            const g = new THREE.Group(); g.name = 'Living Room'
            const floor = plane(8, 8, '#8B7355', 0.85); floor.rotation.x = -Math.PI / 2; g.add(floor)
            const wall = plane(8, 3, '#F5F0E8'); wall.position.set(0, 1.5, -4); g.add(wall)
            // Sofa
            const seat = box(2, 0.35, 0.8, '#4a6741'); seat.position.set(0, 0.4, -3); g.add(seat)
            const seatBack = box(2, 0.5, 0.15, '#4a6741'); seatBack.position.set(0, 0.72, -3.35); g.add(seatBack)
            const armL = box(0.15, 0.4, 0.8, '#4a6741'); armL.position.set(-1.05, 0.55, -3); g.add(armL)
            const armR = box(0.15, 0.4, 0.8, '#4a6741'); armR.position.set(1.05, 0.55, -3); g.add(armR)
            // Coffee table
            const ct = box(0.8, 0.04, 0.5, '#8B4513'); ct.position.set(0, 0.35, -1.8); g.add(ct)
            for (const [x, z] of [[-0.3, -1.6], [0.3, -1.6], [-0.3, -2.0], [0.3, -2.0]]) {
                const l = cyl(0.02, 0.33, '#654321'); l.position.set(x, 0.17, z); g.add(l)
            }
            // Rug
            const rug = plane(3, 2, '#8B0000', 0.95); rug.rotation.x = -Math.PI / 2; rug.position.set(0, 0.005, -2); g.add(rug)
            addShadows(g); return g
        }
    },
    // ── Stage ──
    {
        id: 'interview', name: 'Interview Set', icon: '🎙️', category: 'stage',
        description: 'Two chairs facing each other, talk show style',
        floorSize: [10, 10], skyColor: '#0a0a15',
        ambient: { color: '#334455', intensity: 0.3 },
        mainLight: { color: '#ffffff', intensity: 1.5, position: [0, 5, 3] },
        fog: { color: '#0a0a15', near: 8, far: 20 },
        build: () => {
            const g = new THREE.Group(); g.name = 'Interview Set'
            const floor = plane(10, 10, '#1a1a2e', 0.7); floor.rotation.x = -Math.PI / 2; g.add(floor)
            // Stage platform
            const stage = box(6, 0.08, 4, '#222233', 0.6, 0.4); stage.position.set(0, 0.04, 0); g.add(stage)
            // Two chairs
            for (const side of [-1.2, 1.2]) {
                const s = box(0.5, 0.05, 0.5, '#2a2a2a'); s.position.set(side, 0.48, 0); g.add(s)
                const b = box(0.5, 0.5, 0.04, '#2a2a2a'); b.position.set(side, 0.72, -0.22); g.add(b)
                for (const [lx, lz] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) {
                    const leg = cyl(0.02, 0.44, '#333333', 0.8); leg.position.set(side + lx, 0.24, lz); g.add(leg)
                }
            }
            // Small table between
            const t = box(0.5, 0.04, 0.4, '#333344', 0.7, 0.3); t.position.set(0, 0.52, 0); g.add(t)
            const tleg = cyl(0.04, 0.5, '#333344', 0.7); tleg.position.set(0, 0.27, 0); g.add(tleg)
            // Backdrop
            const backdrop = plane(8, 3, '#111122'); backdrop.position.set(0, 1.5, -3); g.add(backdrop)
            addShadows(g); return g
        }
    },
    {
        id: 'podium', name: 'Presentation Stage', icon: '🎤', category: 'stage',
        description: 'Conference/keynote stage with podium and screen',
        floorSize: [14, 10], skyColor: '#050510',
        ambient: { color: '#223344', intensity: 0.2 },
        mainLight: { color: '#ffffff', intensity: 1.8, position: [0, 6, 3] },
        fog: { color: '#050510', near: 10, far: 25 },
        build: () => {
            const g = new THREE.Group(); g.name = 'Presentation Stage'
            const floor = plane(14, 10, '#111118', 0.8); floor.rotation.x = -Math.PI / 2; g.add(floor)
            const stage = box(10, 0.3, 5, '#1a1a28', 0.3, 0.6); stage.position.set(0, 0.15, -1); g.add(stage)
            // Podium
            const podium = box(0.6, 1.1, 0.4, '#2a2a3a', 0.5, 0.4); podium.position.set(-2, 0.85, 0); g.add(podium)
            const podiumTop = box(0.7, 0.03, 0.5, '#3a3a4a', 0.6, 0.3); podiumTop.position.set(-2, 1.42, 0); g.add(podiumTop)
            // Screen
            const screenFrame = box(5, 2.8, 0.08, '#111111', 0.5, 0.2); screenFrame.position.set(1, 2.1, -3.2); g.add(screenFrame)
            const screenSurface = box(4.8, 2.6, 0.01, '#06b6d4', 0, 0.1); screenSurface.position.set(1, 2.1, -3.15); g.add(screenSurface)
            // Audience rows (abstract)
            for (let row = 0; row < 3; row++) {
                for (let col = -3; col <= 3; col++) {
                    const chairSeat = box(0.4, 0.3, 0.4, '#1a1a1a'); chairSeat.position.set(col * 0.8, 0.15, 3 + row * 1.2); g.add(chairSeat)
                }
            }
            addShadows(g); return g
        }
    },
    // ── Outdoor ──
    {
        id: 'park', name: 'City Park', icon: '🌳', category: 'outdoor',
        description: 'Green park with bench and trees',
        floorSize: [20, 20], skyColor: '#87CEEB',
        ambient: { color: '#88aacc', intensity: 0.5 },
        mainLight: { color: '#fff5e0', intensity: 1.5, position: [5, 8, 5] },
        build: () => {
            const g = new THREE.Group(); g.name = 'City Park'
            const grass = plane(20, 20, '#3a7d2a', 0.95); grass.rotation.x = -Math.PI / 2; g.add(grass)
            // Path
            const path = plane(2, 20, '#c8b898', 0.9); path.rotation.x = -Math.PI / 2; path.position.y = 0.005; g.add(path)
            // Bench
            const benchSeat = box(1.2, 0.04, 0.35, '#8B4513'); benchSeat.position.set(1.5, 0.45, 0); g.add(benchSeat)
            const benchBack = box(1.2, 0.3, 0.03, '#8B4513'); benchBack.position.set(1.5, 0.65, -0.16); g.add(benchBack)
            for (const x of [1.0, 2.0]) { const l = cyl(0.03, 0.44, '#555555', 0.8); l.position.set(x, 0.22, 0); g.add(l) }
            // Trees
            for (const [tx, tz] of [[-3, -4], [4, -2], [-2, 5], [6, 4], [-5, -1]]) {
                const trunk = cyl(0.15, 1.5, '#654321'); trunk.position.set(tx, 0.75, tz); g.add(trunk)
                const canopy = sphere(1.0, '#228B22'); canopy.position.set(tx, 2.0, tz); g.add(canopy)
            }
            // Lamp post
            const post = cyl(0.04, 2.5, '#333333', 0.8); post.position.set(-1.3, 1.25, 0); g.add(post)
            const lamp = sphere(0.1, '#FFE4B5'); lamp.position.set(-1.3, 2.55, 0); g.add(lamp)
            addShadows(g); return g
        }
    },
    {
        id: 'beach', name: 'Beach', icon: '🏖️', category: 'outdoor',
        description: 'Sandy beach with ocean horizon',
        floorSize: [30, 30], skyColor: '#5BC0EB',
        ambient: { color: '#aaddff', intensity: 0.6 },
        mainLight: { color: '#FFE4B5', intensity: 1.8, position: [8, 10, 5] },
        fog: { color: '#5BC0EB', near: 15, far: 40 },
        build: () => {
            const g = new THREE.Group(); g.name = 'Beach'
            const sand = plane(30, 15, '#F4D08F', 0.95); sand.rotation.x = -Math.PI / 2; sand.position.z = 7; g.add(sand)
            const ocean = plane(30, 15, '#1E90FF', 0.2); ocean.rotation.x = -Math.PI / 2; ocean.position.set(0, -0.05, -7); g.add(ocean)
            // Umbrella
            const pole = cyl(0.03, 2, '#8B4513'); pole.position.set(2, 1, 5); g.add(pole)
            const shade = new THREE.Mesh(new THREE.ConeGeometry(1, 0.3, 8), new THREE.MeshStandardMaterial({ color: '#FF6347', side: THREE.DoubleSide }))
            shade.position.set(2, 2.1, 5); shade.rotation.x = Math.PI; g.add(shade)
            // Palm tree
            const palm = cyl(0.12, 3, '#CD853F'); palm.position.set(-4, 1.5, 4); g.add(palm)
            const frond = sphere(1.5, '#228B22'); frond.position.set(-4, 3.2, 4); frond.scale.set(1, 0.3, 1); g.add(frond)
            addShadows(g); return g
        }
    },
    // ── Abstract ──
    {
        id: 'void', name: 'Void', icon: '🌑', category: 'abstract',
        description: 'Dark void with subtle floor grid',
        floorSize: [50, 50], skyColor: '#000000',
        ambient: { color: '#222244', intensity: 0.15 },
        mainLight: { color: '#06b6d4', intensity: 0.5, position: [0, 10, 0] },
        fog: { color: '#000000', near: 5, far: 30 },
        build: () => {
            const g = new THREE.Group(); g.name = 'Void'
            const grid = new THREE.GridHelper(50, 50, 0x06b6d4, 0x111133)
            g.add(grid)
            // Accent sphere
            const orb = sphere(0.3, '#06b6d4', 0.2, 0.1)
            const orbMat = orb.material as THREE.MeshStandardMaterial
            orbMat.emissive = new THREE.Color('#06b6d4')
            orbMat.emissiveIntensity = 2
            orb.position.set(0, 2, -3)
            g.add(orb)
            return g
        }
    },
    {
        id: 'gradient', name: 'Gradient Stage', icon: '🎨', category: 'abstract',
        description: 'Clean gradient floor with colored accent lights',
        floorSize: [20, 20], skyColor: '#0a0a15',
        ambient: { color: '#334455', intensity: 0.3 },
        mainLight: { color: '#ffffff', intensity: 1.0, position: [0, 5, 3] },
        build: () => {
            const g = new THREE.Group(); g.name = 'Gradient Stage'
            const floor = plane(20, 20, '#0f0f1a', 0.6); floor.rotation.x = -Math.PI / 2; g.add(floor)
            // Accent pillars
            const colors = ['#06b6d4', '#a855f7', '#ec4899', '#22d3ee']
            for (let i = 0; i < 4; i++) {
                const pillar = cyl(0.08, 3, colors[i], 0.3, 0.2)
                const mat = pillar.material as THREE.MeshStandardMaterial
                mat.emissive = new THREE.Color(colors[i])
                mat.emissiveIntensity = 1.5
                const angle = (i / 4) * Math.PI * 2
                pillar.position.set(Math.cos(angle) * 4, 1.5, Math.sin(angle) * 4)
                g.add(pillar)
            }
            addShadows(g); return g
        }
    },
]

/**
 * Build an environment by preset ID.
 */
export function buildEnvironment(presetId: string): { group: THREE.Group; preset: EnvironmentPresetDef } | null {
    const preset = ENVIRONMENT_PRESETS.find(p => p.id === presetId)
    if (!preset) return null
    return { group: preset.build(), preset }
}

/**
 * Get all presets grouped by category.
 */
export function getPresetsGrouped(): Record<EnvironmentCategory, EnvironmentPresetDef[]> {
    const grouped: Record<EnvironmentCategory, EnvironmentPresetDef[]> = {
        indoor: [], outdoor: [], stage: [], abstract: []
    }
    for (const p of ENVIRONMENT_PRESETS) {
        grouped[p.category].push(p)
    }
    return grouped
}
