/* ====== TrustGen — Procedural Creature Generator ======
 * Parametric animal bodies built from spine-based loft geometry.
 * Supports quadrupeds, birds, fish, and insects.
 *
 * Architecture:
 *   1. Define a spine path (body centerline)
 *   2. Place cross-sections along the spine (varying radius)
 *   3. Loft the cross-sections to create body surface
 *   4. Attach appendages (legs, wings, ears, tail)
 *   5. Optionally auto-bind to quadruped rig
 */
import * as THREE from 'three'
import type {
    QuadrupedConfig, BirdConfig, FishConfig, InsectConfig,
    CreatureConfig, CrossSection, Point3, GeneratorPreset,
} from './GeneratorTypes'
import {
    createLoftGeometry, createTaperedLimb, createLeafShape,
    createSplineLatheGeometry, mat, mulberry32, displaceGeometry,
} from './MeshUtils'

// ══════════════════════════════════════════
//  QUADRUPED GENERATOR
// ══════════════════════════════════════════

export function buildQuadruped(config: QuadrupedConfig): THREE.Group {
    const group = new THREE.Group()
    group.name = `Creature_${config.species}`
    const rng = mulberry32(config.species.length * 7 + config.bodyLength * 100)
    const { bodyLength, height, bulk, headSize, neckLength, legLength, snoutLength } = config

    const bodyMat = mat(config.bodyColor, 0, 0.75 + config.furRoughness * 0.2)
    const secondaryMat = mat(config.secondaryColor, 0, 0.8)

    // ── Body — loft along spine ──
    const halfLen = bodyLength / 2
    const bodyRadius = bodyLength * 0.15 * (0.5 + bulk * 0.5)

    const spinePath: Point3[] = [
        { x: 0, y: height * 0.7, z: -halfLen * 0.1 },
        { x: 0, y: height * 0.72, z: 0 },
        { x: 0, y: height * 0.73, z: halfLen * 0.3 },
        { x: 0, y: height * 0.71, z: halfLen * 0.6 },
        { x: 0, y: height * 0.68, z: halfLen * 0.9 },
    ]

    const bodySections: CrossSection[] = [
        { t: 0.0, radius: bodyRadius * 0.6 },
        { t: 0.15, radius: bodyRadius * 0.9 },
        { t: 0.35, radius: bodyRadius },
        { t: 0.55, radius: bodyRadius * 0.95, squash: { x: 1, y: 1.1 + bulk * 0.2 } },
        { t: 0.75, radius: bodyRadius * 0.8 },
        { t: 1.0, radius: bodyRadius * 0.3 },
    ]

    const bodyGeo = createLoftGeometry(spinePath, bodySections, 24, 12)
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    body.receiveShadow = true
    body.name = 'Body'
    group.add(body)

    // ── Belly (secondary color strip) ──
    const bellyGeo = new THREE.SphereGeometry(bodyRadius * 0.85, 12, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.35)
    const belly = new THREE.Mesh(bellyGeo, secondaryMat)
    belly.position.set(0, height * 0.62, halfLen * 0.3)
    belly.scale.set(1, 0.6, bodyLength * 0.4 / (bodyRadius * 0.85))
    belly.name = 'Belly'
    group.add(belly)

    // ── Neck ──
    if (neckLength > 0.05) {
        const neckLen = bodyLength * neckLength * 0.4
        const neckGeo = createTaperedLimb(neckLen, bodyRadius * 0.5, bodyRadius * 0.35, 0.1, 8, 8)
        const neck = new THREE.Mesh(neckGeo, bodyMat)
        neck.position.set(0, height * 0.7, -halfLen * 0.1)
        neck.rotation.x = -0.4 - neckLength * 0.3
        neck.castShadow = true
        neck.name = 'Neck'
        group.add(neck)
    }

    // ── Head ──
    const headR = bodyLength * headSize * 0.15
    const headY = height * 0.7 + bodyLength * neckLength * 0.35
    const headZ = -halfLen * 0.1 - bodyLength * neckLength * 0.3

    const headGeo = new THREE.SphereGeometry(headR, 16, 12)
    headGeo.scale(1, 0.85, 1 + snoutLength * 0.4)
    const head = new THREE.Mesh(headGeo, bodyMat)
    head.position.set(0, headY, headZ)
    head.castShadow = true
    head.name = 'Head'
    group.add(head)

    // Snout
    if (snoutLength > 0.1) {
        const snoutLen = headR * snoutLength * 1.5
        const snoutGeo = createTaperedLimb(snoutLen, headR * 0.4, headR * 0.2, 0.1, 6, 6)
        const snout = new THREE.Mesh(snoutGeo, bodyMat)
        snout.position.set(0, headY - headR * 0.15, headZ - headR * 0.6)
        snout.rotation.x = -Math.PI / 2 + 0.2
        snout.name = 'Snout'
        group.add(snout)

        // Nose
        const noseGeo = new THREE.SphereGeometry(headR * 0.12, 8, 8)
        const nose = new THREE.Mesh(noseGeo, mat('#1a1a1a', 0, 0.3))
        nose.position.set(0, headY - headR * 0.1, headZ - headR * 0.7 - snoutLen * 0.8)
        nose.name = 'Nose'
        group.add(nose)
    }

    // Eyes
    const eyeMat = mat('#F5F5F0', 0.1, 0.1)
    const pupilMat = mat('#1a1a1a', 0, 0.1)
    for (const side of [-1, 1]) {
        const eyeGeo = new THREE.SphereGeometry(headR * 0.15, 10, 10)
        const eye = new THREE.Mesh(eyeGeo, eyeMat)
        eye.position.set(side * headR * 0.55, headY + headR * 0.15, headZ - headR * 0.5)
        eye.name = side === -1 ? 'Eye_L' : 'Eye_R'
        group.add(eye)

        const pupilGeo = new THREE.SphereGeometry(headR * 0.08, 8, 8)
        const pupil = new THREE.Mesh(pupilGeo, pupilMat)
        pupil.position.set(side * headR * 0.55, headY + headR * 0.15, headZ - headR * 0.65)
        group.add(pupil)
    }

    // ── Ears ──
    if (config.earStyle !== 'none' && config.earSize > 0) {
        const earScale = config.earSize
        for (const side of [-1, 1]) {
            let earMesh: THREE.Mesh

            if (config.earStyle === 'pointed') {
                const earGeo = new THREE.ConeGeometry(headR * 0.2 * earScale, headR * 0.5 * earScale, 6)
                earMesh = new THREE.Mesh(earGeo, bodyMat)
                earMesh.rotation.z = side * 0.3
            } else if (config.earStyle === 'floppy') {
                const earGeo = createLeafShape(headR * 0.5 * earScale, headR * 0.25 * earScale, 0.6, 6)
                earMesh = new THREE.Mesh(earGeo, bodyMat)
                earMesh.rotation.set(0, 0, side * 0.8)
            } else {
                const earGeo = new THREE.SphereGeometry(headR * 0.2 * earScale, 8, 8, 0, Math.PI)
                earMesh = new THREE.Mesh(earGeo, bodyMat)
            }

            earMesh.position.set(side * headR * 0.6, headY + headR * 0.6, headZ)
            earMesh.name = side === -1 ? 'Ear_L' : 'Ear_R'
            earMesh.castShadow = true
            group.add(earMesh)
        }
    }

    // ── Legs ──
    const legR = bodyLength * 0.04 * (0.5 + bulk * 0.5)
    const legH = height * legLength * 0.55
    const legPositions = [
        { x: -bodyRadius * 0.6, z: -halfLen * 0.05, name: 'Leg_FL' },
        { x: bodyRadius * 0.6, z: -halfLen * 0.05, name: 'Leg_FR' },
        { x: -bodyRadius * 0.6, z: halfLen * 0.65, name: 'Leg_BL' },
        { x: bodyRadius * 0.6, z: halfLen * 0.65, name: 'Leg_BR' },
    ]

    for (const lp of legPositions) {
        // Upper leg
        const upperGeo = createTaperedLimb(legH * 0.55, legR * 1.2, legR * 0.9, 0.15, 6, 6)
        const upper = new THREE.Mesh(upperGeo, bodyMat)
        upper.position.set(lp.x, height * 0.65 - legH * 0.275, lp.z)
        upper.castShadow = true
        upper.name = lp.name + '_Upper'
        group.add(upper)

        // Lower leg
        const lowerGeo = createTaperedLimb(legH * 0.5, legR * 0.9, legR * 0.5, 0, 6, 6)
        const lower = new THREE.Mesh(lowerGeo, bodyMat)
        lower.position.set(lp.x, legH * 0.25, lp.z)
        lower.castShadow = true
        lower.name = lp.name + '_Lower'
        group.add(lower)

        // Paw/hoof
        const pawGeo = new THREE.SphereGeometry(legR * 1.2, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.6)
        const paw = new THREE.Mesh(pawGeo, secondaryMat)
        paw.position.set(lp.x, legR * 0.5, lp.z)
        paw.name = lp.name + '_Paw'
        group.add(paw)
    }

    // ── Tail ──
    if (config.tailLength > 0.05) {
        const tailLen = bodyLength * config.tailLength * 0.5
        const tailR = bodyRadius * 0.15
        const tailGeo = createTaperedLimb(tailLen, tailR, tailR * 0.3 * (1 - config.tailBushiness * 0.5), config.tailBushiness * 0.3, 8, 6)
        const tail = new THREE.Mesh(tailGeo, bodyMat)
        tail.position.set(0, height * 0.68, halfLen * 0.9)
        tail.rotation.x = 0.6 + rng() * 0.5
        tail.castShadow = true
        tail.name = 'Tail'
        group.add(tail)

        // Bushy tail end
        if (config.tailBushiness > 0.5) {
            const fluffGeo = new THREE.SphereGeometry(tailR * 2, 8, 8)
            displaceGeometry(fluffGeo, tailR * 0.5, 3, 2, 42)
            const fluff = new THREE.Mesh(fluffGeo, bodyMat)
            fluff.position.set(0, height * 0.68 + Math.sin(0.6) * tailLen, halfLen * 0.9 + Math.cos(0.6) * tailLen)
            fluff.name = 'TailFluff'
            group.add(fluff)
        }
    }

    return group
}

// ══════════════════════════════════════════
//  BIRD GENERATOR
// ══════════════════════════════════════════

export function buildBird(config: BirdConfig): THREE.Group {
    const group = new THREE.Group()
    group.name = `Bird_${config.species}`

    const bodyMat = mat(config.bodyColor, 0, 0.7)
    const wingMat = mat(config.wingColor, 0, 0.7)
    wingMat.side = THREE.DoubleSide
    const beakMat = mat(config.beakColor, 0, 0.5)

    const bs = config.bodySize

    // ── Body ──
    const bodyGeo = new THREE.SphereGeometry(bs * 0.15, 16, 12)
    bodyGeo.scale(1, 0.8, 1.3)
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.set(0, bs * 0.5, 0)
    body.castShadow = true
    body.name = 'Body'
    group.add(body)

    // ── Head ──
    const headR = bs * 0.08
    const headGeo = new THREE.SphereGeometry(headR, 12, 12)
    const head = new THREE.Mesh(headGeo, bodyMat)
    head.position.set(0, bs * 0.62, -bs * 0.12)
    head.castShadow = true
    head.name = 'Head'
    group.add(head)

    // Eyes
    const eyeMat = mat('#1a1a1a', 0, 0.1)
    for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(headR * 0.2, 8, 8), eyeMat)
        eye.position.set(side * headR * 0.7, bs * 0.64, -bs * 0.16)
        group.add(eye)
    }

    // ── Beak ──
    const beakLen = bs * config.beakLength * 0.2
    if (config.beakCurve > 0.5) {
        // Curved/hooked beak
        const beakGeo = createTaperedLimb(beakLen, headR * 0.2, headR * 0.05, 0.1, 6, 5)
        const beak = new THREE.Mesh(beakGeo, beakMat)
        beak.position.set(0, bs * 0.59, -bs * 0.18)
        beak.rotation.x = -Math.PI / 2 - 0.3
        beak.name = 'Beak'
        group.add(beak)
    } else {
        const beakGeo = new THREE.ConeGeometry(headR * 0.12, beakLen, 6)
        const beak = new THREE.Mesh(beakGeo, beakMat)
        beak.position.set(0, bs * 0.6, -bs * 0.18 - beakLen / 2)
        beak.rotation.x = -Math.PI / 2
        beak.name = 'Beak'
        group.add(beak)
    }

    // ── Wings ──
    const wingSpan = config.wingSpan * bs
    for (const side of [-1, 1]) {
        const wingGeo = createLeafShape(wingSpan * 0.45, wingSpan * 0.12 * (1 - config.wingShape * 0.3), 0.1, 8)
        const wing = new THREE.Mesh(wingGeo, wingMat)
        wing.position.set(side * bs * 0.12, bs * 0.52, bs * 0.02)
        wing.rotation.set(-0.2, side * 0.2, side * 0.8)
        wing.castShadow = true
        wing.name = side === -1 ? 'Wing_L' : 'Wing_R'
        group.add(wing)
    }

    // ── Tail feathers ──
    if (config.tailLength > 0.1) {
        const tailMat = mat(config.bodyColor, 0, 0.7)
        tailMat.side = THREE.DoubleSide
        const fanCount = Math.floor(3 + config.tailSpread * 4)
        for (let i = 0; i < fanCount; i++) {
            const angle = ((i / (fanCount - 1)) - 0.5) * config.tailSpread * Math.PI * 0.3
            const tailLen = bs * config.tailLength * 0.3
            const tailGeo = createLeafShape(tailLen, tailLen * 0.15, 0.1, 6)
            const feather = new THREE.Mesh(tailGeo, tailMat)
            feather.position.set(0, bs * 0.45, bs * 0.15)
            feather.rotation.set(Math.PI / 2 + 0.3, angle, 0)
            feather.castShadow = true
            group.add(feather)
        }
    }

    // ── Legs ──
    const legMat = mat(config.beakColor, 0, 0.6)
    for (const side of [-1, 1]) {
        const legH = bs * config.legLength * 0.3
        const legGeo = new THREE.CylinderGeometry(bs * 0.01, bs * 0.012, legH, 4)
        const leg = new THREE.Mesh(legGeo, legMat)
        leg.position.set(side * bs * 0.05, bs * 0.5 - bs * 0.15 - legH / 2, bs * 0.03)
        leg.name = side === -1 ? 'Leg_L' : 'Leg_R'
        group.add(leg)

        // Foot: three forward toes + one back
        for (let t = -1; t <= 1; t++) {
            const toeGeo = new THREE.CylinderGeometry(bs * 0.005, bs * 0.003, bs * 0.04, 3)
            const toe = new THREE.Mesh(toeGeo, legMat)
            toe.position.set(
                side * bs * 0.05 + t * bs * 0.015,
                bs * 0.5 - bs * 0.15 - legH - bs * 0.01,
                bs * 0.03 - bs * 0.02,
            )
            toe.rotation.x = -Math.PI / 2 + 0.2
            group.add(toe)
        }
    }

    return group
}

// ══════════════════════════════════════════
//  FISH GENERATOR
// ══════════════════════════════════════════

export function buildFish(config: FishConfig): THREE.Group {
    const group = new THREE.Group()
    group.name = `Fish_${config.species}`

    const bodyMat = mat(config.bodyColor, 0.2, 0.3)
    const finMat = mat(config.finColor, 0.1, 0.4)
    finMat.side = THREE.DoubleSide

    const halfLen = config.bodyLength / 2

    // ── Body — lofted ellipsoidal shape ──
    const spinePath: Point3[] = [
        { x: 0, y: 0, z: -halfLen },
        { x: 0, y: 0, z: -halfLen * 0.5 },
        { x: 0, y: 0, z: 0 },
        { x: 0, y: 0, z: halfLen * 0.5 },
        { x: 0, y: 0, z: halfLen },
    ]

    const sections: CrossSection[] = [
        { t: 0, radius: 0.01 },
        { t: 0.15, radius: config.bodyDepth * 0.3, squash: { x: config.bodyWidth / config.bodyDepth, y: 1 } },
        { t: 0.35, radius: config.bodyDepth * 0.45, squash: { x: config.bodyWidth / config.bodyDepth, y: 1 } },
        { t: 0.5, radius: config.bodyDepth * 0.5, squash: { x: config.bodyWidth / config.bodyDepth, y: 1 } },
        { t: 0.7, radius: config.bodyDepth * 0.35, squash: { x: config.bodyWidth / config.bodyDepth, y: 1 } },
        { t: 0.85, radius: config.bodyDepth * 0.15 },
        { t: 1, radius: 0.01 },
    ]

    const bodyGeo = createLoftGeometry(spinePath, sections, 20, 12)
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.castShadow = true
    body.name = 'Body'
    group.add(body)

    // ── Eyes ──
    const eyeMat = mat('#F5F5F0', 0.2, 0.1)
    const eyeR = config.bodyDepth * 0.08
    for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 8, 8), eyeMat)
        eye.position.set(side * config.bodyWidth * 0.35, config.bodyDepth * 0.1, -halfLen * 0.6)
        group.add(eye)
        const pupil = new THREE.Mesh(new THREE.SphereGeometry(eyeR * 0.5, 6, 6), mat('#1a1a1a'))
        pupil.position.set(side * config.bodyWidth * 0.4, config.bodyDepth * 0.1, -halfLen * 0.65)
        group.add(pupil)
    }

    // ── Dorsal fin ──
    if (config.dorsalHeight > 0) {
        const dorsalGeo = createLeafShape(config.dorsalHeight, config.bodyLength * 0.2, 0.1, 6)
        const dorsal = new THREE.Mesh(dorsalGeo, finMat)
        dorsal.position.set(0, config.bodyDepth * 0.4, -halfLen * 0.1)
        dorsal.rotation.x = -0.1
        dorsal.name = 'DorsalFin'
        group.add(dorsal)
    }

    // ── Side fins (pectoral) ──
    for (const side of [-1, 1]) {
        const finGeo = createLeafShape(config.bodyLength * 0.15, config.bodyLength * 0.06, 0.2, 5)
        const fin = new THREE.Mesh(finGeo, finMat)
        fin.position.set(side * config.bodyWidth * 0.35, -config.bodyDepth * 0.1, -halfLen * 0.3)
        fin.rotation.set(-0.3, side * 0.5, side * 0.8)
        fin.name = side === -1 ? 'Fin_L' : 'Fin_R'
        group.add(fin)
    }

    // ── Tail fin ──
    const tailH = config.bodyDepth * (0.5 + config.tailFork * 0.5)
    for (const vSide of [-1, 1]) {
        const tailGeo = createLeafShape(tailH * 0.5, tailH * 0.3, 0.2, 6)
        const tail = new THREE.Mesh(tailGeo, finMat)
        tail.position.set(0, vSide * tailH * 0.15, halfLen * 0.9)
        tail.rotation.set(vSide * (0.3 + config.tailFork * 0.4), 0, Math.PI / 2)
        tail.name = vSide === -1 ? 'TailFin_Lower' : 'TailFin_Upper'
        group.add(tail)
    }

    // Mouth
    const mouthGeo = new THREE.RingGeometry(config.bodyDepth * 0.03, config.bodyDepth * 0.06, 8)
    const mouth = new THREE.Mesh(mouthGeo, mat('#3a2020', 0, 0.5))
    mouth.position.set(0, 0, -halfLen * 0.98)
    mouth.name = 'Mouth'
    group.add(mouth)

    return group
}

// ══════════════════════════════════════════
//  INSECT GENERATOR
// ══════════════════════════════════════════

export function buildInsect(config: InsectConfig): THREE.Group {
    const group = new THREE.Group()
    group.name = `Insect_${config.species}`

    const bodyMat = mat(config.bodyColor, 0.3, 0.4)
    const legMat = mat(config.bodyColor, 0.2, 0.5)

    const segLen = config.bodyLength / config.segmentCount

    // ── Body segments ──
    for (let i = 0; i < config.segmentCount; i++) {
        const t = i / (config.segmentCount - 1)
        // Head segment smaller, thorax biggest, abdomen tapers
        let radius: number
        if (i === 0) radius = segLen * 0.35 // head
        else if (i === 1) radius = segLen * 0.5 // thorax
        else radius = segLen * (0.5 - (t - 0.5) * 0.6) // abdomen

        const segGeo = new THREE.SphereGeometry(Math.max(0.005, radius), 10, 8)
        segGeo.scale(1, 0.8, 1.2)
        const seg = new THREE.Mesh(segGeo, bodyMat)
        seg.position.set(0, config.bodyLength * 0.1, (i - config.segmentCount / 2 + 0.5) * segLen * 1.1)
        seg.castShadow = true
        seg.name = `Segment_${i}`
        group.add(seg)
    }

    // ── Eyes (on head segment) ──
    const headZ = -(config.segmentCount / 2 - 0.5) * segLen * 1.1
    const eyeR = segLen * 0.15
    const eyeMat = mat('#990000', 0.3, 0.2)
    for (const side of [-1, 1]) {
        const eye = new THREE.Mesh(new THREE.SphereGeometry(eyeR, 8, 8), eyeMat)
        eye.position.set(side * segLen * 0.2, config.bodyLength * 0.15, headZ - segLen * 0.2)
        group.add(eye)
    }

    // ── Antennae ──
    if (config.antennaLength > 0) {
        const antMat = mat(config.bodyColor, 0, 0.7)
        for (const side of [-1, 1]) {
            const antLen = config.bodyLength * config.antennaLength * 0.4
            const antGeo = new THREE.CylinderGeometry(0.003, 0.002, antLen, 4)
            const ant = new THREE.Mesh(antGeo, antMat)
            ant.position.set(side * segLen * 0.1, config.bodyLength * 0.2, headZ - antLen * 0.3)
            ant.rotation.x = -0.8
            ant.rotation.z = side * 0.3
            ant.name = side === -1 ? 'Antenna_L' : 'Antenna_R'
            group.add(ant)
        }
    }

    // ── Legs ──
    // Legs attach to thorax segment (index 1)
    const thoraxZ = -(config.segmentCount / 2 - 1.5) * segLen * 1.1
    for (let pair = 0; pair < config.legPairs; pair++) {
        const legZ = thoraxZ + (pair - config.legPairs / 2 + 0.5) * segLen * 0.5
        for (const side of [-1, 1]) {
            const legH = config.legLength * config.bodyLength * 0.3
            const upperGeo = new THREE.CylinderGeometry(0.004, 0.003, legH, 4)
            const upper = new THREE.Mesh(upperGeo, legMat)
            upper.position.set(side * segLen * 0.3, config.bodyLength * 0.05, legZ)
            upper.rotation.z = side * 0.6
            upper.name = `Leg_${pair}_${side === -1 ? 'L' : 'R'}`
            group.add(upper)

            const lowerGeo = new THREE.CylinderGeometry(0.003, 0.002, legH * 0.8, 4)
            const lower = new THREE.Mesh(lowerGeo, legMat)
            lower.position.set(
                side * (segLen * 0.3 + Math.sin(0.6) * legH),
                config.bodyLength * 0.05 - Math.cos(0.6) * legH * 0.5,
                legZ,
            )
            lower.rotation.z = side * -0.3
            group.add(lower)
        }
    }

    // ── Wings ──
    if (config.wingPairs > 0) {
        const wingMaterial = mat(config.wingColor, 0.1, 0.2)
        wingMaterial.transparent = true
        wingMaterial.opacity = config.wingOpacity
        wingMaterial.side = THREE.DoubleSide

        for (let wp = 0; wp < config.wingPairs; wp++) {
            const wingZ = thoraxZ + (wp - 0.5) * segLen * 0.4
            for (const side of [-1, 1]) {
                const wingGeo = createLeafShape(
                    config.wingSize * config.bodyLength * 0.6,
                    config.wingSize * config.bodyLength * 0.2,
                    0.05,
                    6,
                )
                const wing = new THREE.Mesh(wingGeo, wingMaterial)
                wing.position.set(side * segLen * 0.2, config.bodyLength * 0.18, wingZ)
                wing.rotation.set(-0.1, side * 0.1, side * 0.8)
                wing.name = `Wing_${wp}_${side === -1 ? 'L' : 'R'}`
                group.add(wing)
            }
        }
    }

    return group
}

// ══════════════════════════════════════════
//  UNIFIED BUILD FUNCTION
// ══════════════════════════════════════════

export function buildCreature(config: CreatureConfig): THREE.Group {
    switch (config.family) {
        case 'quadruped': return buildQuadruped(config)
        case 'bird': return buildBird(config)
        case 'fish': return buildFish(config)
        case 'insect': return buildInsect(config)
    }
}

// ══════════════════════════════════════════
//  PRESETS
// ══════════════════════════════════════════

export const QUADRUPED_PRESETS: GeneratorPreset<QuadrupedConfig>[] = [
    { id: 'dog', name: 'Dog', icon: '🐕', category: 'quadruped', description: 'Friendly medium-sized dog', config: { family: 'quadruped', species: 'dog', bodyLength: 0.8, height: 0.5, bulk: 0.4, legLength: 0.7, headSize: 0.7, neckLength: 0.3, tailLength: 0.6, tailBushiness: 0.4, earStyle: 'floppy', earSize: 0.7, snoutLength: 0.6, bodyColor: '#B8860B', secondaryColor: '#F5E6C8', furRoughness: 0.6, autoRig: true } },
    { id: 'cat', name: 'Cat', icon: '🐱', category: 'quadruped', description: 'Sleek domestic cat', config: { family: 'quadruped', species: 'cat', bodyLength: 0.5, height: 0.3, bulk: 0.2, legLength: 0.6, headSize: 0.8, neckLength: 0.2, tailLength: 0.8, tailBushiness: 0.3, earStyle: 'pointed', earSize: 0.8, snoutLength: 0.2, bodyColor: '#4A4A4A', secondaryColor: '#C0C0C0', furRoughness: 0.4, autoRig: true } },
    { id: 'horse', name: 'Horse', icon: '🐴', category: 'quadruped', description: 'Majestic horse', config: { family: 'quadruped', species: 'horse', bodyLength: 2.0, height: 1.5, bulk: 0.6, legLength: 0.85, headSize: 0.5, neckLength: 0.7, tailLength: 0.7, tailBushiness: 0.8, earStyle: 'pointed', earSize: 0.5, snoutLength: 0.8, bodyColor: '#8B4513', secondaryColor: '#6B3A1A', furRoughness: 0.3, autoRig: true } },
    { id: 'wolf', name: 'Wolf', icon: '🐺', category: 'quadruped', description: 'Lean grey wolf', config: { family: 'quadruped', species: 'wolf', bodyLength: 1.2, height: 0.75, bulk: 0.4, legLength: 0.8, headSize: 0.6, neckLength: 0.3, tailLength: 0.6, tailBushiness: 0.7, earStyle: 'pointed', earSize: 0.7, snoutLength: 0.7, bodyColor: '#808080', secondaryColor: '#C0C0C0', furRoughness: 0.7, autoRig: true } },
    { id: 'bear', name: 'Bear', icon: '🐻', category: 'quadruped', description: 'Large brown bear', config: { family: 'quadruped', species: 'bear', bodyLength: 2.0, height: 1.2, bulk: 0.9, legLength: 0.5, headSize: 0.5, neckLength: 0.2, tailLength: 0.1, tailBushiness: 0.2, earStyle: 'round', earSize: 0.5, snoutLength: 0.5, bodyColor: '#5C4033', secondaryColor: '#8B7D6B', furRoughness: 0.8, autoRig: true } },
    { id: 'deer', name: 'Deer', icon: '🦌', category: 'quadruped', description: 'Graceful deer', config: { family: 'quadruped', species: 'deer', bodyLength: 1.5, height: 1.2, bulk: 0.3, legLength: 0.9, headSize: 0.5, neckLength: 0.6, tailLength: 0.2, tailBushiness: 0.3, earStyle: 'pointed', earSize: 0.8, snoutLength: 0.4, bodyColor: '#C68642', secondaryColor: '#F5E6C8', furRoughness: 0.3, autoRig: true } },
    { id: 'rabbit', name: 'Rabbit', icon: '🐰', category: 'quadruped', description: 'Cute fluffy rabbit', config: { family: 'quadruped', species: 'rabbit', bodyLength: 0.3, height: 0.2, bulk: 0.5, legLength: 0.5, headSize: 0.9, neckLength: 0.1, tailLength: 0.15, tailBushiness: 0.9, earStyle: 'pointed', earSize: 1.0, snoutLength: 0.15, bodyColor: '#D2B48C', secondaryColor: '#FFFFFF', furRoughness: 0.5, autoRig: true } },
    { id: 'elephant', name: 'Elephant', icon: '🐘', category: 'quadruped', description: 'Massive elephant', config: { family: 'quadruped', species: 'elephant', bodyLength: 4.0, height: 3.0, bulk: 1.0, legLength: 0.6, headSize: 0.6, neckLength: 0.1, tailLength: 0.4, tailBushiness: 0.1, earStyle: 'floppy', earSize: 1.0, snoutLength: 0.3, bodyColor: '#808080', secondaryColor: '#696969', furRoughness: 0.2, autoRig: true } },
]

export const BIRD_PRESETS: GeneratorPreset<BirdConfig>[] = [
    { id: 'eagle', name: 'Eagle', icon: '🦅', category: 'bird', description: 'Majestic bald eagle', config: { family: 'bird', species: 'eagle', bodySize: 0.6, wingSpan: 2.0, wingShape: 0.7, beakLength: 0.7, beakCurve: 0.8, legLength: 0.5, tailSpread: 0.6, tailLength: 0.6, bodyColor: '#3D2B1F', wingColor: '#3D2B1F', beakColor: '#FFD700', autoRig: true } },
    { id: 'sparrow', name: 'Sparrow', icon: '🐦', category: 'bird', description: 'Small brown sparrow', config: { family: 'bird', species: 'sparrow', bodySize: 0.12, wingSpan: 0.6, wingShape: 0.3, beakLength: 0.4, beakCurve: 0.1, legLength: 0.4, tailSpread: 0.3, tailLength: 0.3, bodyColor: '#8B6914', wingColor: '#5C4033', beakColor: '#4A3728', autoRig: true } },
    { id: 'penguin', name: 'Penguin', icon: '🐧', category: 'bird', description: 'Tuxedo penguin', config: { family: 'bird', species: 'penguin', bodySize: 0.4, wingSpan: 0.3, wingShape: 0.2, beakLength: 0.3, beakCurve: 0.1, legLength: 0.3, tailSpread: 0.2, tailLength: 0.1, bodyColor: '#1a1a1a', wingColor: '#1a1a1a', beakColor: '#FF8C00', autoRig: true } },
]

export const FISH_PRESETS: GeneratorPreset<FishConfig>[] = [
    { id: 'tropical', name: 'Tropical Fish', icon: '🐠', category: 'fish', description: 'Colorful tropical fish', config: { family: 'fish', species: 'tropical', bodyLength: 0.15, bodyDepth: 0.08, bodyWidth: 0.03, dorsalHeight: 0.04, tailFork: 0.4, finCount: 2, bodyColor: '#FF6347', finColor: '#FFD700', autoRig: true } },
    { id: 'shark', name: 'Shark', icon: '🦈', category: 'fish', description: 'Sleek great white shark', config: { family: 'fish', species: 'shark', bodyLength: 3.0, bodyDepth: 0.6, bodyWidth: 0.4, dorsalHeight: 0.4, tailFork: 0.7, finCount: 2, bodyColor: '#607080', finColor: '#506070', autoRig: true } },
    { id: 'goldfish', name: 'Goldfish', icon: '🐟', category: 'fish', description: 'Fancy goldfish', config: { family: 'fish', species: 'goldfish', bodyLength: 0.1, bodyDepth: 0.06, bodyWidth: 0.04, dorsalHeight: 0.03, tailFork: 0.6, finCount: 2, bodyColor: '#FF8C00', finColor: '#FFD700', autoRig: true } },
]

export const INSECT_PRESETS: GeneratorPreset<InsectConfig>[] = [
    { id: 'butterfly', name: 'Butterfly', icon: '🦋', category: 'insect', description: 'Colorful butterfly', config: { family: 'insect', species: 'butterfly', segmentCount: 2, bodyLength: 0.04, legPairs: 3, legLength: 0.3, wingPairs: 2, wingSize: 1.5, antennaLength: 0.8, bodyColor: '#1a1a1a', wingColor: '#FF6347', wingOpacity: 0.8, autoRig: true } },
    { id: 'beetle', name: 'Beetle', icon: '🪲', category: 'insect', description: 'Shiny beetle', config: { family: 'insect', species: 'beetle', segmentCount: 3, bodyLength: 0.03, legPairs: 3, legLength: 0.5, wingPairs: 0, wingSize: 0, antennaLength: 0.5, bodyColor: '#2F4F4F', wingColor: '#2F4F4F', wingOpacity: 1, autoRig: true } },
    { id: 'dragonfly', name: 'Dragonfly', icon: '🪰', category: 'insect', description: 'Shimmering dragonfly', config: { family: 'insect', species: 'dragonfly', segmentCount: 3, bodyLength: 0.06, legPairs: 3, legLength: 0.3, wingPairs: 2, wingSize: 1.0, antennaLength: 0.2, bodyColor: '#228B22', wingColor: '#87CEEB', wingOpacity: 0.4, autoRig: true } },
]

export const ALL_CREATURE_PRESETS = [...QUADRUPED_PRESETS, ...BIRD_PRESETS, ...FISH_PRESETS, ...INSECT_PRESETS]
