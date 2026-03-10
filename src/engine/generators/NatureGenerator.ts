/* ====== TrustGen — Procedural Nature Generator ======
 * Generates trees, flowers, plants, and rocks.
 * All procedural, all Three.js, zero imports.
 *
 * Tree pipeline:   L-system branch generation → cylinder meshes → leaf canopy
 * Flower pipeline: stem cylinder → petal ring(s) → center sphere → leaves
 * Plant pipeline:  cluster generation → leaf shapes → ground scatter
 * Rock pipeline:   displaced icosahedron → flatten bottom → material
 */
import * as THREE from 'three'
import type {
    TreeConfig, FlowerConfig, PlantConfig, RockConfig, NatureConfig,
    TreeSpecies, FlowerSpecies, PlantType, GeneratorPreset,
} from './GeneratorTypes'
import {
    generateBranches, branchesToMesh,
    createLeafShape, createPetalRing,
    createTaperedLimb, createRockGeometry,
    createSplineLatheGeometry, displaceGeometry,
    mat, mulberry32, noise3D, fbm,
} from './MeshUtils'

const DEG = Math.PI / 180

// ══════════════════════════════════════════
//  TREE GENERATOR
// ══════════════════════════════════════════

/** Species-specific defaults that modify the base TreeConfig */
const SPECIES_PARAMS: Record<TreeSpecies, Partial<TreeConfig>> = {
    oak: { branchLevels: 4, branchesPerLevel: 3, branchAngle: 40, trunkColor: '#5C4033', leafColor: '#2D6B22', canopyDensity: 0.8 },
    pine: { branchLevels: 5, branchesPerLevel: 4, branchAngle: 70, trunkColor: '#4A3728', leafColor: '#1B4D1B', canopyDensity: 0.9 },
    palm: { branchLevels: 1, branchesPerLevel: 8, branchAngle: 30, trunkColor: '#8B7D6B', leafColor: '#3D7A2A', canopyDensity: 0.5 },
    birch: { branchLevels: 4, branchesPerLevel: 2, branchAngle: 25, trunkColor: '#E8E0D0', leafColor: '#6B8E23', canopyDensity: 0.6 },
    willow: { branchLevels: 3, branchesPerLevel: 5, branchAngle: 15, trunkColor: '#6B5B3E', leafColor: '#4A6C2F', canopyDensity: 0.7 },
    cherry: { branchLevels: 3, branchesPerLevel: 3, branchAngle: 45, trunkColor: '#5C4033', leafColor: '#FFB7C5', canopyDensity: 0.7 },
    baobab: { branchLevels: 2, branchesPerLevel: 5, branchAngle: 50, trunkColor: '#8B7D6B', leafColor: '#5B8A2E', canopyDensity: 0.4, trunkDiameter: 0.8 },
    cypress: { branchLevels: 5, branchesPerLevel: 3, branchAngle: 12, trunkColor: '#5C4033', leafColor: '#2E5930', canopyDensity: 0.9 },
    maple: { branchLevels: 4, branchesPerLevel: 3, branchAngle: 45, trunkColor: '#5C4033', leafColor: '#CC4400', canopyDensity: 0.8 },
    dead: { branchLevels: 3, branchesPerLevel: 2, branchAngle: 55, trunkColor: '#5C4840', leafColor: '#5C4840', canopyDensity: 0.0 },
}

export function buildTree(config: TreeConfig): THREE.Group {
    const group = new THREE.Group()
    group.name = `Tree_${config.species}`

    const sp = { ...config, ...SPECIES_PARAMS[config.species] }
    const rng = mulberry32(config.seed)

    // ── Trunk ──
    const trunkProfile = [
        { x: sp.trunkDiameter / 2, y: 0 },
        { x: sp.trunkDiameter / 2 * 0.95, y: sp.height * 0.1 },
        { x: sp.trunkDiameter / 2 * 0.85, y: sp.height * 0.3 },
        { x: sp.trunkDiameter / 2 * 0.6, y: sp.height * 0.7 },
        { x: sp.trunkDiameter / 2 * 0.35, y: sp.height * 0.95 },
        { x: sp.trunkDiameter / 2 * 0.2, y: sp.height },
    ]

    // Palm trees have a different trunk shape — constant diameter, slight curve
    if (config.species === 'palm') {
        trunkProfile.length = 0
        for (let i = 0; i <= 12; i++) {
            const t = i / 12
            const curveX = Math.sin(t * 0.3) * sp.trunkDiameter * 0.5
            trunkProfile.push({
                x: sp.trunkDiameter / 2 * (0.8 + Math.sin(t * Math.PI * 6) * 0.1),
                y: t * sp.height,
            })
        }
    }

    // Baobab trunk — thick and bulbous
    if (config.species === 'baobab') {
        trunkProfile.length = 0
        trunkProfile.push(
            { x: sp.trunkDiameter * 0.45, y: 0 },
            { x: sp.trunkDiameter * 0.55, y: sp.height * 0.1 },
            { x: sp.trunkDiameter * 0.6, y: sp.height * 0.25 },
            { x: sp.trunkDiameter * 0.55, y: sp.height * 0.5 },
            { x: sp.trunkDiameter * 0.35, y: sp.height * 0.7 },
            { x: sp.trunkDiameter * 0.2, y: sp.height * 0.85 },
            { x: sp.trunkDiameter * 0.15, y: sp.height },
        )
    }

    const trunkGeo = createSplineLatheGeometry(trunkProfile, 16, 8)
    const trunkMat = mat(sp.trunkColor, 0, 0.9)
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.castShadow = true
    trunk.receiveShadow = true
    trunk.name = 'Trunk'
    group.add(trunk)

    // ── Branches ──
    const branchOrigin = new THREE.Vector3(0, sp.height * 0.7, 0)
    const branchDir = new THREE.Vector3(0, 1, 0)

    const segments = generateBranches(
        branchOrigin, branchDir,
        sp.height * 0.4,
        sp.trunkDiameter / 2 * 0.4,
        0, sp.branchLevels,
        sp.branchesPerLevel,
        sp.branchAngle,
        0.65, 0.55,
        config.seed,
    )

    const branchMat = mat(sp.trunkColor, 0, 0.85)
    const branches = branchesToMesh(segments, branchMat)
    branches.name = 'Branches'
    group.add(branches)

    // ── Canopy / Leaves ──
    if (sp.canopyDensity > 0) {
        const leafMat = mat(sp.leafColor, 0, 0.85)
        leafMat.side = THREE.DoubleSide

        if (config.species === 'palm') {
            // Palm fronds — large leaf shapes from top
            const frondCount = sp.branchesPerLevel
            for (let i = 0; i < frondCount; i++) {
                const angle = (i / frondCount) * Math.PI * 2 + rng() * 0.3
                const frondGeo = createLeafShape(sp.height * 0.5, sp.leafSize * 2, 0.8, 10)
                const frond = new THREE.Mesh(frondGeo, leafMat)
                frond.position.set(0, sp.height, 0)
                frond.rotation.set(-Math.PI / 2 + 0.6, angle, 0)
                frond.castShadow = true
                group.add(frond)
            }
        } else if (config.species === 'pine' || config.species === 'cypress') {
            // Conical canopy — stacked cone layers
            const layers = 4 + Math.floor(sp.canopyDensity * 3)
            for (let i = 0; i < layers; i++) {
                const t = i / layers
                const y = sp.height * (0.3 + t * 0.7)
                const radius = sp.height * 0.35 * (1 - t * 0.7) * sp.canopyDensity
                const coneGeo = new THREE.ConeGeometry(radius, sp.height * 0.2, 8)
                const cone = new THREE.Mesh(coneGeo, leafMat)
                cone.position.set(0, y, 0)
                cone.castShadow = true
                group.add(cone)
            }
        } else {
            // Standard canopy — clustered spheres at branch endpoints
            const canopyPositions: THREE.Vector3[] = []

            // Place leaf clusters at branch tips
            for (const seg of segments) {
                if (seg.depth >= sp.branchLevels - 1) {
                    canopyPositions.push(seg.end.clone())
                }
            }

            // Also add clusters near upper trunk
            for (let i = 0; i < Math.floor(sp.canopyDensity * 5); i++) {
                canopyPositions.push(new THREE.Vector3(
                    (rng() - 0.5) * sp.height * 0.3,
                    sp.height * (0.7 + rng() * 0.3),
                    (rng() - 0.5) * sp.height * 0.3,
                ))
            }

            // Create canopy clusters
            const clusterSize = sp.leafSize * (1 + sp.canopyDensity)
            for (const pos of canopyPositions) {
                const clusterGeo = new THREE.DodecahedronGeometry(clusterSize, 1)
                displaceGeometry(clusterGeo, clusterSize * 0.2, 3, 2, rng() * 100)
                const cluster = new THREE.Mesh(clusterGeo, leafMat)
                cluster.position.copy(pos)
                cluster.castShadow = true
                cluster.receiveShadow = true
                group.add(cluster)
            }

            // Willow: add drooping strands
            if (config.species === 'willow') {
                const strandMat = mat(sp.leafColor, 0, 0.9)
                for (const pos of canopyPositions) {
                    for (let s = 0; s < 3; s++) {
                        const strandLength = sp.height * 0.3 * (0.5 + rng() * 0.5)
                        const strandGeo = new THREE.CylinderGeometry(0.005, 0.002, strandLength, 4)
                        const strand = new THREE.Mesh(strandGeo, strandMat)
                        strand.position.set(
                            pos.x + (rng() - 0.5) * 0.2,
                            pos.y - strandLength / 2,
                            pos.z + (rng() - 0.5) * 0.2,
                        )
                        group.add(strand)
                    }
                }
            }
        }
    }

    // Add exposed roots for large trees
    if (sp.trunkDiameter > 0.4) {
        const rootMat = mat(sp.trunkColor, 0, 0.85)
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2 + rng() * 0.5
            const rootLen = sp.trunkDiameter * (1 + rng() * 0.5)
            const rootGeo = createTaperedLimb(rootLen, sp.trunkDiameter * 0.1, 0.02, 0.05, 6, 5)
            const root = new THREE.Mesh(rootGeo, rootMat)
            root.position.set(0, 0, 0)
            root.rotation.set(Math.PI / 2 + 0.3, angle, 0)
            group.add(root)
        }
    }

    return group
}

// ══════════════════════════════════════════
//  FLOWER GENERATOR
// ══════════════════════════════════════════

const SPECIES_FLOWER_PARAMS: Record<FlowerSpecies, Partial<FlowerConfig>> = {
    rose: { petalCount: 20, petalSize: 0.04, petalCurl: 0.6, petalColor: '#CC0033', centerColor: '#FFD700' },
    sunflower: { petalCount: 24, petalSize: 0.08, petalCurl: 0.1, petalColor: '#FFD700', centerColor: '#4A2E00' },
    daisy: { petalCount: 16, petalSize: 0.04, petalCurl: 0.15, petalColor: '#FFFFFF', centerColor: '#FFD700' },
    tulip: { petalCount: 6, petalSize: 0.06, petalCurl: 0.7, petalColor: '#FF4444', centerColor: '#FFFF00' },
    lily: { petalCount: 6, petalSize: 0.08, petalCurl: 0.4, petalColor: '#FFFFFF', centerColor: '#FFD700' },
    orchid: { petalCount: 5, petalSize: 0.06, petalCurl: 0.3, petalColor: '#9B59B6', centerColor: '#FFD700' },
    lavender: { petalCount: 8, petalSize: 0.02, petalCurl: 0.1, petalColor: '#9B59B6', centerColor: '#6B3FA0' },
    poppy: { petalCount: 5, petalSize: 0.05, petalCurl: 0.2, petalColor: '#FF3333', centerColor: '#1a1a1a' },
    dandelion: { petalCount: 40, petalSize: 0.02, petalCurl: 0, petalColor: '#FFD700', centerColor: '#FFD700' },
}

export function buildFlower(config: FlowerConfig): THREE.Group {
    const group = new THREE.Group()
    group.name = `Flower_${config.species}`

    const sp = { ...config, ...SPECIES_FLOWER_PARAMS[config.species] }
    const rng = mulberry32(config.seed)

    // ── Stem ──
    const stemGeo = createTaperedLimb(sp.stemHeight, 0.008, 0.005, 0.002, 8, 6)
    const stemMat = mat(sp.stemColor, 0, 0.9)
    const stem = new THREE.Mesh(stemGeo, stemMat)
    stem.castShadow = true
    stem.name = 'Stem'
    group.add(stem)

    // ── Leaves ──
    const leafMat = mat(sp.stemColor, 0, 0.85)
    leafMat.side = THREE.DoubleSide
    for (let i = 0; i < sp.leafCount; i++) {
        const leafT = (i + 1) / (sp.leafCount + 1) * 0.6 + 0.1
        const leafGeo = createLeafShape(sp.stemHeight * 0.25, sp.stemHeight * 0.08, 0.3, 6)
        const leaf = new THREE.Mesh(leafGeo, leafMat)
        const side = i % 2 === 0 ? 1 : -1
        leaf.position.set(0, sp.stemHeight * leafT, 0)
        leaf.rotation.set(0, 0, side * 0.8)
        leaf.castShadow = true
        group.add(leaf)
    }

    // ── Flower head ──
    const headGroup = new THREE.Group()
    headGroup.position.set(0, sp.stemHeight, 0)
    headGroup.name = 'FlowerHead'

    // Center
    const centerSize = sp.petalSize * 0.6
    const centerGeo = new THREE.SphereGeometry(centerSize, 12, 12)
    const centerMat = mat(sp.centerColor, 0, 0.6)
    const center = new THREE.Mesh(centerGeo, centerMat)
    center.name = 'Center'
    headGroup.add(center)

    // Petals
    const petalMat = mat(sp.petalColor, 0, 0.7)
    petalMat.side = THREE.DoubleSide

    if (config.species === 'rose') {
        // Rose: multiple layers of petals with increasing curl
        for (let layer = 0; layer < 3; layer++) {
            const layerPetals = Math.floor(sp.petalCount / 3)
            const curl = 0.3 + layer * 0.3
            const ring = createPetalRing(layerPetals, sp.petalSize * (0.7 + layer * 0.15), sp.petalSize * 0.5, curl, petalMat, 20 + layer * 15)
            ring.rotation.y = layer * 0.3
            headGroup.add(ring)
        }
    } else if (config.species === 'tulip') {
        // Tulip: cup-shaped petals
        const ring = createPetalRing(sp.petalCount, sp.petalSize, sp.petalSize * 0.4, sp.petalCurl, petalMat, 10)
        headGroup.add(ring)
    } else if (config.species === 'dandelion') {
        // Dandelion: tiny petals in a dense sphere
        for (let i = 0; i < sp.petalCount; i++) {
            const phi = Math.acos(1 - 2 * (i + 0.5) / sp.petalCount)
            const theta = Math.PI * (1 + Math.sqrt(5)) * i
            const petalGeo = createLeafShape(sp.petalSize, sp.petalSize * 0.15, 0, 4)
            const petal = new THREE.Mesh(petalGeo, petalMat)
            petal.position.set(
                Math.sin(phi) * Math.cos(theta) * centerSize,
                Math.sin(phi) * Math.sin(theta) * centerSize + centerSize,
                Math.cos(phi) * centerSize,
            )
            petal.lookAt(petal.position.clone().multiplyScalar(2))
            headGroup.add(petal)
        }
    } else if (config.species === 'lavender') {
        // Lavender: tiny clusters along the stem top
        for (let i = 0; i < 8; i++) {
            const t = i / 8
            const clusterGeo = new THREE.SphereGeometry(0.008, 6, 6)
            const cluster = new THREE.Mesh(clusterGeo, petalMat)
            cluster.position.set(
                (rng() - 0.5) * 0.01,
                t * sp.petalSize * 3,
                (rng() - 0.5) * 0.01,
            )
            headGroup.add(cluster)
        }
    } else {
        // Standard flat petal ring
        const ring = createPetalRing(sp.petalCount, sp.petalSize, sp.petalSize * 0.4, sp.petalCurl, petalMat, 30)
        headGroup.add(ring)
    }

    group.add(headGroup)
    return group
}

// ══════════════════════════════════════════
//  PLANT GENERATOR
// ══════════════════════════════════════════

export function buildPlant(config: PlantConfig): THREE.Group {
    const group = new THREE.Group()
    group.name = `Plant_${config.plantType}`
    const rng = mulberry32(config.seed)
    const { size, density } = config

    switch (config.plantType) {
        case 'bush': {
            const leafMat = mat(config.color, 0, 0.85)
            const clusterCount = Math.floor(5 + density * 10)
            for (let i = 0; i < clusterCount; i++) {
                const cSize = size * (0.15 + rng() * 0.2)
                const geo = new THREE.DodecahedronGeometry(cSize, 1)
                displaceGeometry(geo, cSize * 0.15, 3, 2, rng() * 100)
                const cluster = new THREE.Mesh(geo, leafMat)
                cluster.position.set(
                    (rng() - 0.5) * size * 0.8,
                    cSize * 0.5 + rng() * size * 0.3,
                    (rng() - 0.5) * size * 0.8,
                )
                cluster.castShadow = true
                group.add(cluster)
            }
            break
        }

        case 'fern': {
            const fernMat = mat(config.color, 0, 0.85)
            fernMat.side = THREE.DoubleSide
            const frondCount = Math.floor(4 + density * 6)
            for (let i = 0; i < frondCount; i++) {
                const angle = (i / frondCount) * Math.PI * 2 + rng() * 0.3
                const frondLen = size * (0.6 + rng() * 0.4)
                const frondGeo = createLeafShape(frondLen, frondLen * 0.15, 0.4, 10)
                const frond = new THREE.Mesh(frondGeo, fernMat)
                frond.rotation.set(-0.3 - rng() * 0.5, angle, 0)
                frond.position.y = size * 0.05
                frond.castShadow = true
                group.add(frond)
            }
            break
        }

        case 'grass': {
            const grassMat = mat(config.color, 0, 0.95)
            grassMat.side = THREE.DoubleSide
            const bladeCount = Math.floor(20 + density * 40)
            for (let i = 0; i < bladeCount; i++) {
                const bladeHeight = size * (0.5 + rng() * 0.5)
                const bladeWidth = 0.01 + rng() * 0.01
                const bladeGeo = createLeafShape(bladeHeight, bladeWidth, 0.2 + rng() * 0.3, 4)
                const blade = new THREE.Mesh(bladeGeo, grassMat)
                blade.position.set(
                    (rng() - 0.5) * size * 1.5,
                    0,
                    (rng() - 0.5) * size * 1.5,
                )
                blade.rotation.y = rng() * Math.PI * 2
                blade.rotation.x = -0.1 + rng() * 0.2
                group.add(blade)
            }
            break
        }

        case 'cactus': {
            const cactusMat = mat(config.color, 0, 0.7)
            // Main body — tall cylinder with slight taper
            const bodyGeo = createTaperedLimb(size, size * 0.12, size * 0.1, 0.3, 8, 8)
            const body = new THREE.Mesh(bodyGeo, cactusMat)
            body.castShadow = true
            group.add(body)

            // Arms
            if (size > 0.4) {
                for (let i = 0; i < 2; i++) {
                    const armHeight = size * (0.3 + rng() * 0.3)
                    const armGeo = createTaperedLimb(armHeight, size * 0.08, size * 0.06, 0.15, 6, 6)
                    const arm = new THREE.Mesh(armGeo, cactusMat)
                    const side = i === 0 ? 1 : -1
                    arm.position.set(side * size * 0.12, size * (0.4 + rng() * 0.2), 0)
                    arm.rotation.z = side * 0.5
                    arm.castShadow = true
                    group.add(arm)
                }
            }

            // Flower on top
            if (rng() > 0.5) {
                const flowerMat = mat(config.accentColor, 0, 0.6)
                const flowerGeo = new THREE.SphereGeometry(size * 0.06, 8, 8)
                const flower = new THREE.Mesh(flowerGeo, flowerMat)
                flower.position.set(0, size, 0)
                group.add(flower)
            }
            break
        }

        case 'mushroom': {
            const stemMat = mat('#F5F0E0', 0, 0.7)
            const capMat = mat(config.color, 0, 0.6)
            const capCount = Math.floor(1 + density * 3)

            for (let i = 0; i < capCount; i++) {
                const mSize = size * (0.3 + rng() * 0.7)
                const mushGroup = new THREE.Group()

                // Stem
                const stemGeo = createTaperedLimb(mSize * 0.6, mSize * 0.08, mSize * 0.05, 0.05, 6, 6)
                mushGroup.add(new THREE.Mesh(stemGeo, stemMat))

                // Cap
                const capGeo = new THREE.SphereGeometry(mSize * 0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55)
                const cap = new THREE.Mesh(capGeo, capMat)
                cap.position.y = mSize * 0.6
                cap.castShadow = true
                mushGroup.add(cap)

                mushGroup.position.set(
                    (rng() - 0.5) * size * 0.5,
                    0,
                    (rng() - 0.5) * size * 0.5,
                )
                group.add(mushGroup)
            }
            break
        }

        case 'bamboo': {
            const bambooMat = mat(config.color, 0.1, 0.6)
            const stalkCount = Math.floor(3 + density * 8)
            for (let i = 0; i < stalkCount; i++) {
                const stalkHeight = size * (0.7 + rng() * 0.3)
                const segmentCount = Math.floor(stalkHeight / (size * 0.15))
                const stalkGroup = new THREE.Group()

                for (let s = 0; s < segmentCount; s++) {
                    const segH = stalkHeight / segmentCount
                    const segGeo = new THREE.CylinderGeometry(size * 0.03, size * 0.035, segH * 0.95, 6)
                    const seg = new THREE.Mesh(segGeo, bambooMat)
                    seg.position.y = s * segH + segH / 2
                    stalkGroup.add(seg)

                    // Joint ring
                    const jointGeo = new THREE.TorusGeometry(size * 0.04, 0.005, 4, 8)
                    const joint = new THREE.Mesh(jointGeo, bambooMat)
                    joint.position.y = s * segH
                    joint.rotation.x = Math.PI / 2
                    stalkGroup.add(joint)
                }

                stalkGroup.position.set(
                    (rng() - 0.5) * size * 0.4,
                    0,
                    (rng() - 0.5) * size * 0.4,
                )
                stalkGroup.castShadow = true
                group.add(stalkGroup)
            }
            break
        }

        case 'vine': {
            const vineMat = mat(config.color, 0, 0.9)
            vineMat.side = THREE.DoubleSide
            const vineCount = Math.floor(2 + density * 4)
            for (let v = 0; v < vineCount; v++) {
                const vineGroup = new THREE.Group()
                const vLength = size * (0.8 + rng() * 0.4)
                const segments = 8
                let px = 0, py = 0, pz = 0

                for (let s = 0; s < segments; s++) {
                    const segLen = vLength / segments
                    const stemGeo = new THREE.CylinderGeometry(0.005, 0.007, segLen, 4)
                    const seg = new THREE.Mesh(stemGeo, vineMat)
                    const angle = rng() * 0.6 - 0.3
                    seg.position.set(px, py + segLen / 2, pz)
                    seg.rotation.z = angle
                    vineGroup.add(seg)

                    py += segLen * Math.cos(angle)
                    px += segLen * Math.sin(angle)

                    // Small leaf at each node
                    if (s > 0 && rng() > 0.3) {
                        const leafGeo = createLeafShape(size * 0.1, size * 0.05, 0.2, 4)
                        const leaf = new THREE.Mesh(leafGeo, vineMat)
                        leaf.position.set(px, py, pz)
                        leaf.rotation.set(0, rng() * Math.PI, (rng() - 0.5) * 0.5)
                        vineGroup.add(leaf)
                    }
                }

                vineGroup.position.set(
                    (rng() - 0.5) * size * 0.3,
                    0,
                    (rng() - 0.5) * size * 0.3,
                )
                group.add(vineGroup)
            }
            break
        }

        case 'reed': {
            const reedMat = mat(config.color, 0, 0.9)
            reedMat.side = THREE.DoubleSide
            const reedCount = Math.floor(5 + density * 15)
            for (let i = 0; i < reedCount; i++) {
                const reedHeight = size * (0.6 + rng() * 0.4)
                const reedGeo = createLeafShape(reedHeight, 0.015, 0.15 + rng() * 0.1, 6)
                const reed = new THREE.Mesh(reedGeo, reedMat)
                reed.position.set(
                    (rng() - 0.5) * size * 0.8,
                    0,
                    (rng() - 0.5) * size * 0.8,
                )
                reed.rotation.y = rng() * Math.PI * 2
                group.add(reed)

                // Cattail top on some
                if (rng() > 0.6) {
                    const catGeo = new THREE.CylinderGeometry(0.015, 0.015, reedHeight * 0.15, 6)
                    const catMat = mat(config.accentColor, 0, 0.8)
                    const cat = new THREE.Mesh(catGeo, catMat)
                    cat.position.copy(reed.position)
                    cat.position.y = reedHeight * 0.9
                    group.add(cat)
                }
            }
            break
        }
    }

    return group
}

// ══════════════════════════════════════════
//  ROCK GENERATOR
// ══════════════════════════════════════════

export function buildRock(config: RockConfig): THREE.Group {
    const group = new THREE.Group()
    group.name = `Rock_${config.sizeCategory}`

    const detail = config.sizeCategory === 'pebble' ? 1
        : config.sizeCategory === 'stone' ? 2
            : config.sizeCategory === 'boulder' ? 2
                : 3 // cliff

    const rockGeo = createRockGeometry(config.size, config.roughness, config.jaggedness, config.seed, detail)
    const rockMat = mat(config.color, 0.05, 0.85)
    const rock = new THREE.Mesh(rockGeo, rockMat)
    rock.castShadow = true
    rock.receiveShadow = true
    rock.name = 'RockBody'
    group.add(rock)

    // Add moss patches
    if (config.mossy) {
        const mossMat = mat('#2D5A1B', 0, 0.95)
        const patchCount = Math.floor(2 + config.size * 3)
        const rng = mulberry32(config.seed + 999)

        for (let i = 0; i < patchCount; i++) {
            const phi = rng() * Math.PI
            const theta = rng() * Math.PI * 2
            const patchSize = config.size * (0.1 + rng() * 0.15)

            const patchGeo = new THREE.SphereGeometry(patchSize, 6, 6, 0, Math.PI * 2, 0, Math.PI * 0.4)
            const patch = new THREE.Mesh(patchGeo, mossMat)
            patch.position.set(
                Math.sin(phi) * Math.cos(theta) * config.size * 0.85,
                Math.cos(phi) * config.size * 0.85,
                Math.sin(phi) * Math.sin(theta) * config.size * 0.85,
            )
            patch.lookAt(0, 0, 0)
            patch.rotateX(Math.PI)
            group.add(patch)
        }
    }

    return group
}

// ══════════════════════════════════════════
//  UNIFIED BUILD FUNCTION
// ══════════════════════════════════════════

export function buildNature(config: NatureConfig): THREE.Group {
    switch (config.type) {
        case 'tree': return buildTree(config)
        case 'flower': return buildFlower(config)
        case 'plant': return buildPlant(config)
        case 'rock': return buildRock(config)
    }
}

// ══════════════════════════════════════════
//  PRESETS
// ══════════════════════════════════════════

export const TREE_PRESETS: GeneratorPreset<TreeConfig>[] = [
    { id: 'oak', name: 'Oak Tree', icon: '🌳', category: 'tree', description: 'Classic spreading oak with dense canopy', config: { type: 'tree', species: 'oak', height: 6, trunkDiameter: 0.35, branchLevels: 4, branchesPerLevel: 3, branchAngle: 40, canopyDensity: 0.8, leafSize: 0.35, trunkColor: '#5C4033', leafColor: '#2D6B22', seed: 42 } },
    { id: 'pine', name: 'Pine Tree', icon: '🌲', category: 'tree', description: 'Tall conical pine with layered canopy', config: { type: 'tree', species: 'pine', height: 8, trunkDiameter: 0.25, branchLevels: 5, branchesPerLevel: 4, branchAngle: 70, canopyDensity: 0.9, leafSize: 0.3, trunkColor: '#4A3728', leafColor: '#1B4D1B', seed: 42 } },
    { id: 'palm', name: 'Palm Tree', icon: '🌴', category: 'tree', description: 'Tropical palm with frond canopy', config: { type: 'tree', species: 'palm', height: 7, trunkDiameter: 0.2, branchLevels: 1, branchesPerLevel: 8, branchAngle: 30, canopyDensity: 0.5, leafSize: 0.4, trunkColor: '#8B7D6B', leafColor: '#3D7A2A', seed: 42 } },
    { id: 'birch', name: 'Birch Tree', icon: '🌿', category: 'tree', description: 'Slender white-bark birch', config: { type: 'tree', species: 'birch', height: 7, trunkDiameter: 0.15, branchLevels: 4, branchesPerLevel: 2, branchAngle: 25, canopyDensity: 0.6, leafSize: 0.25, trunkColor: '#E8E0D0', leafColor: '#6B8E23', seed: 42 } },
    { id: 'willow', name: 'Weeping Willow', icon: '🌾', category: 'tree', description: 'Drooping willow with hanging branches', config: { type: 'tree', species: 'willow', height: 6, trunkDiameter: 0.3, branchLevels: 3, branchesPerLevel: 5, branchAngle: 15, canopyDensity: 0.7, leafSize: 0.3, trunkColor: '#6B5B3E', leafColor: '#4A6C2F', seed: 42 } },
    { id: 'cherry', name: 'Cherry Blossom', icon: '🌸', category: 'tree', description: 'Cherry tree with pink blossoms', config: { type: 'tree', species: 'cherry', height: 4, trunkDiameter: 0.2, branchLevels: 3, branchesPerLevel: 3, branchAngle: 45, canopyDensity: 0.7, leafSize: 0.3, trunkColor: '#5C4033', leafColor: '#FFB7C5', seed: 42 } },
    { id: 'dead', name: 'Dead Tree', icon: '🥀', category: 'tree', description: 'Bare dead tree with twisted branches', config: { type: 'tree', species: 'dead', height: 5, trunkDiameter: 0.25, branchLevels: 3, branchesPerLevel: 2, branchAngle: 55, canopyDensity: 0, leafSize: 0, trunkColor: '#5C4840', leafColor: '#5C4840', seed: 42 } },
]

export const FLOWER_PRESETS: GeneratorPreset<FlowerConfig>[] = [
    { id: 'rose', name: 'Rose', icon: '🌹', category: 'flower', description: 'Layered red rose with thorns', config: { type: 'flower', species: 'rose', stemHeight: 0.35, petalCount: 20, petalSize: 0.04, petalCurl: 0.6, petalColor: '#CC0033', stemColor: '#3A5F0B', centerColor: '#FFD700', leafCount: 3, seed: 42 } },
    { id: 'sunflower', name: 'Sunflower', icon: '🌻', category: 'flower', description: 'Tall sunflower with large face', config: { type: 'flower', species: 'sunflower', stemHeight: 0.6, petalCount: 24, petalSize: 0.08, petalCurl: 0.1, petalColor: '#FFD700', stemColor: '#3A5F0B', centerColor: '#4A2E00', leafCount: 4, seed: 42 } },
    { id: 'daisy', name: 'Daisy', icon: '🌼', category: 'flower', description: 'White daisy with golden center', config: { type: 'flower', species: 'daisy', stemHeight: 0.25, petalCount: 16, petalSize: 0.035, petalCurl: 0.15, petalColor: '#FFFFFF', stemColor: '#3A5F0B', centerColor: '#FFD700', leafCount: 2, seed: 42 } },
    { id: 'tulip', name: 'Tulip', icon: '🌷', category: 'flower', description: 'Cup-shaped tulip bloom', config: { type: 'flower', species: 'tulip', stemHeight: 0.3, petalCount: 6, petalSize: 0.06, petalCurl: 0.7, petalColor: '#FF4444', stemColor: '#3A5F0B', centerColor: '#FFFF00', leafCount: 2, seed: 42 } },
    { id: 'lavender', name: 'Lavender', icon: '💜', category: 'flower', description: 'Fragrant purple lavender sprig', config: { type: 'flower', species: 'lavender', stemHeight: 0.3, petalCount: 8, petalSize: 0.02, petalCurl: 0.1, petalColor: '#9B59B6', stemColor: '#3A5F0B', centerColor: '#6B3FA0', leafCount: 2, seed: 42 } },
]

export const PLANT_PRESETS: GeneratorPreset<PlantConfig>[] = [
    { id: 'bush', name: 'Bush', icon: '🌿', category: 'plant', description: 'Dense green bush', config: { type: 'plant', plantType: 'bush', size: 0.8, density: 0.7, color: '#2D6B22', accentColor: '#3A5F0B', seed: 42 } },
    { id: 'fern', name: 'Fern', icon: '🌿', category: 'plant', description: 'Spreading fern fronds', config: { type: 'plant', plantType: 'fern', size: 0.5, density: 0.6, color: '#2E7D32', accentColor: '#1B5E20', seed: 42 } },
    { id: 'grass', name: 'Grass Patch', icon: '🌱', category: 'plant', description: 'Patch of meadow grass', config: { type: 'plant', plantType: 'grass', size: 0.3, density: 0.8, color: '#4CAF50', accentColor: '#2E7D32', seed: 42 } },
    { id: 'cactus', name: 'Cactus', icon: '🌵', category: 'plant', description: 'Desert saguaro cactus', config: { type: 'plant', plantType: 'cactus', size: 1.0, density: 0.5, color: '#2D6B22', accentColor: '#FF69B4', seed: 42 } },
    { id: 'mushroom', name: 'Mushroom Cluster', icon: '🍄', category: 'plant', description: 'Group of wild mushrooms', config: { type: 'plant', plantType: 'mushroom', size: 0.3, density: 0.7, color: '#8B0000', accentColor: '#FFFFFF', seed: 42 } },
    { id: 'bamboo', name: 'Bamboo', icon: '🎋', category: 'plant', description: 'Bamboo stalk cluster', config: { type: 'plant', plantType: 'bamboo', size: 2.0, density: 0.6, color: '#6B8E23', accentColor: '#556B2F', seed: 42 } },
]

export const ROCK_PRESETS: GeneratorPreset<RockConfig>[] = [
    { id: 'pebble', name: 'Pebble', icon: '🪨', category: 'rock', description: 'Small river pebble', config: { type: 'rock', sizeCategory: 'pebble', size: 0.05, roughness: 0.2, jaggedness: 0.1, color: '#808080', mossy: false, seed: 42 } },
    { id: 'stone', name: 'Stone', icon: '🪨', category: 'rock', description: 'Medium landscape stone', config: { type: 'rock', sizeCategory: 'stone', size: 0.2, roughness: 0.4, jaggedness: 0.3, color: '#6B6B6B', mossy: false, seed: 42 } },
    { id: 'boulder', name: 'Boulder', icon: '🪨', category: 'rock', description: 'Large moss-covered boulder', config: { type: 'rock', sizeCategory: 'boulder', size: 0.8, roughness: 0.6, jaggedness: 0.5, color: '#5A5A5A', mossy: true, seed: 42 } },
    { id: 'cliff', name: 'Cliff Face', icon: '⛰️', category: 'rock', description: 'Jagged cliff section', config: { type: 'rock', sizeCategory: 'cliff', size: 3.0, roughness: 0.8, jaggedness: 0.8, color: '#4A4A4A', mossy: true, seed: 42 } },
]

/** All nature presets combined */
export const ALL_NATURE_PRESETS = [...TREE_PRESETS, ...FLOWER_PRESETS, ...PLANT_PRESETS, ...ROCK_PRESETS]
