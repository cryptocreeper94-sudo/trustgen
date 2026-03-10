/* ====== TrustGen — Character Creator v2 ======
 * Procedural humanoid character generation using subdivided mesh geometry.
 * Uses spline-lathe body profiles, proper facial features, hair geometry,
 * offset-surface clothing, and articulated hands/feet.
 *
 * Plugs directly into the existing auto-rig / IK / motion pipeline.
 * No external models, no Mixamo, no Meshy — everything generated in-engine.
 */
import * as THREE from 'three'
import type { CharacterGenConfig, BodyBuild, Gender, GeneratorPreset } from './generators/GeneratorTypes'
import { DEFAULT_CHARACTER } from './generators/GeneratorTypes'
import {
    createSplineLatheGeometry, createTaperedLimb,
    mat, displaceGeometry,
} from './generators/MeshUtils'
import type { Point2 } from './generators/GeneratorTypes'

// Re-export types for backward compatibility
export type { CharacterGenConfig as CharacterConfig }
export { DEFAULT_CHARACTER }

// ══════════════════════════════════════════
//  SKIN TONE PRESETS
// ══════════════════════════════════════════

export const SKIN_TONE_PRESETS: { name: string; hex: string }[] = [
    { name: 'Porcelain', hex: '#FFE0BD' },
    { name: 'Light', hex: '#FDBCB4' },
    { name: 'Warm Beige', hex: '#E8B88A' },
    { name: 'Tan', hex: '#C68642' },
    { name: 'Brown', hex: '#8D5524' },
    { name: 'Dark Brown', hex: '#6B3A2A' },
    { name: 'Deep', hex: '#4A2912' },
    { name: 'Olive', hex: '#C4A882' },
    { name: 'Robot Silver', hex: '#B0B0B0' },
    { name: 'Stylized Blue', hex: '#5B9BD5' },
]

// ══════════════════════════════════════════
//  BODY PROPORTIONS BY BUILD + GENDER
// ══════════════════════════════════════════

interface BodyProportions {
    /** Total height in model units (before height multiplier) */
    totalHeight: number
    /** Torso profile control points (radius, height) for lathe */
    torsoProfile: Point2[]
    /** Head radius */
    headRadius: number
    /** Shoulder width (center-to-arm distance) */
    shoulderWidth: number
    /** Hip width */
    hipWidth: number
    /** Upper arm length */
    upperArmLength: number
    /** Lower arm length */
    lowerArmLength: number
    /** Upper arm radius */
    armRadius: number
    /** Upper leg length */
    upperLegLength: number
    /** Lower leg length */
    lowerLegLength: number
    /** Leg radius */
    legRadius: number
    /** Neck height */
    neckHeight: number
    /** Neck radius */
    neckRadius: number
}

function getProportions(build: BodyBuild, gender: Gender, muscularity: number, bodyFat: number): BodyProportions {
    // Base proportions (7.5 heads tall adult)
    const headR = 0.11
    const baseHeight = headR * 15 // ~1.65m

    // Build multipliers
    const buildMods: Record<BodyBuild, { widthMul: number; heightMul: number; bulkMul: number }> = {
        slim: { widthMul: 0.85, heightMul: 1.02, bulkMul: 0.7 },
        average: { widthMul: 1.0, heightMul: 1.0, bulkMul: 1.0 },
        athletic: { widthMul: 1.05, heightMul: 1.0, bulkMul: 1.15 },
        stocky: { widthMul: 1.15, heightMul: 0.95, bulkMul: 1.3 },
        heavy: { widthMul: 1.25, heightMul: 0.98, bulkMul: 1.5 },
        child: { widthMul: 0.75, heightMul: 0.55, bulkMul: 0.8 },
        stylized: { widthMul: 0.9, heightMul: 1.0, bulkMul: 0.85 },
    }

    const bm = buildMods[build]
    const h = baseHeight * bm.heightMul

    // Gender influences
    const genderShoulderMul = gender === 'masculine' ? 1.1 : gender === 'feminine' ? 0.9 : 1.0
    const genderHipMul = gender === 'feminine' ? 1.1 : gender === 'masculine' ? 0.9 : 1.0
    const genderWaistMul = gender === 'feminine' ? 0.85 : 1.0

    const shoulderW = 0.22 * bm.widthMul * genderShoulderMul * (1 + muscularity * 0.15)
    const hipW = 0.17 * bm.widthMul * genderHipMul
    const waist = 0.14 * bm.widthMul * genderWaistMul * (1 + bodyFat * 0.3)
    const chest = 0.16 * bm.widthMul * bm.bulkMul * (1 + muscularity * 0.1)

    // Torso profile: (radius, height) — lathe around Y axis
    const legH = h * 0.46
    const torsoBottom = legH
    const torsoTop = h * 0.81

    const torsoProfile: Point2[] = [
        { x: hipW, y: torsoBottom },
        { x: hipW * 0.98, y: torsoBottom + (torsoTop - torsoBottom) * 0.1 },
        { x: waist, y: torsoBottom + (torsoTop - torsoBottom) * 0.35 },
        { x: waist * 0.98, y: torsoBottom + (torsoTop - torsoBottom) * 0.45 },
        { x: chest, y: torsoBottom + (torsoTop - torsoBottom) * 0.65 },
        { x: chest * 1.02, y: torsoBottom + (torsoTop - torsoBottom) * 0.8 },
        { x: shoulderW * 0.7, y: torsoBottom + (torsoTop - torsoBottom) * 0.95 },
        { x: 0.06, y: torsoTop }, // neck base
    ]

    const armR = 0.035 * bm.bulkMul * (1 + muscularity * 0.3)
    const legR = 0.05 * bm.bulkMul * (1 + muscularity * 0.15 + bodyFat * 0.15)

    return {
        totalHeight: h,
        torsoProfile,
        headRadius: headR * (build === 'child' ? 1.3 : build === 'stylized' ? 1.2 : 1.0),
        shoulderWidth: shoulderW,
        hipWidth: hipW,
        upperArmLength: h * 0.18,
        lowerArmLength: h * 0.16,
        armRadius: armR,
        upperLegLength: h * 0.24,
        lowerLegLength: h * 0.22,
        legRadius: legR,
        neckHeight: h * 0.05,
        neckRadius: 0.055 * bm.widthMul,
    }
}

// ══════════════════════════════════════════
//  BUILD CHARACTER
// ══════════════════════════════════════════

export function buildCharacter(config: CharacterGenConfig = DEFAULT_CHARACTER): THREE.Group {
    const group = new THREE.Group()
    group.name = config.name || 'Character'
    const scale = config.height
    const bp = getProportions(config.build, config.gender, config.muscularity, config.bodyFat)

    const skinMat = mat(config.skinTone, 0, 0.75)

    // ══════════════════════════════════════
    //  TORSO — Spline-lathe body
    // ══════════════════════════════════════

    const torsoGeo = createSplineLatheGeometry(bp.torsoProfile, 20, 16)
    const torsoColor = config.clothing.top !== 'none' ? config.clothing.topColor : config.skinTone
    const torsoMat = config.clothing.top !== 'none' ? mat(torsoColor, 0, 0.6) : skinMat
    const torso = new THREE.Mesh(torsoGeo, torsoMat)
    torso.castShadow = true
    torso.receiveShadow = true
    torso.name = 'Torso'
    group.add(torso)

    // Clothing details on torso
    if (config.clothing.top === 'suit' || config.clothing.top === 'jacket' || config.clothing.top === 'coat') {
        // Lapel V
        const lapelGeo = new THREE.BoxGeometry(bp.shoulderWidth * 0.5, bp.totalHeight * 0.12, 0.01)
        const lapelMat = mat('#111111', 0.2, 0.5)
        const lapel = new THREE.Mesh(lapelGeo, lapelMat)
        lapel.position.set(0, bp.totalHeight * 0.65, bp.shoulderWidth * 0.55)
        lapel.name = 'Lapel'
        group.add(lapel)
    }

    if (config.clothing.top === 'hoodie') {
        // Hood
        const hoodGeo = new THREE.SphereGeometry(bp.headRadius * 1.2, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.5)
        const hood = new THREE.Mesh(hoodGeo, torsoMat)
        hood.position.set(0, bp.totalHeight * 0.83, -bp.headRadius * 0.5)
        hood.name = 'Hood'
        group.add(hood)
    }

    // ══════════════════════════════════════
    //  NECK
    // ══════════════════════════════════════

    const neckGeo = createTaperedLimb(bp.neckHeight, bp.neckRadius, bp.neckRadius * 0.85, 0, 6, 8)
    const neck = new THREE.Mesh(neckGeo, skinMat)
    neck.position.set(0, bp.totalHeight * 0.81, 0)
    neck.name = 'Neck'
    group.add(neck)

    // ══════════════════════════════════════
    //  HEAD + FACE
    // ══════════════════════════════════════

    const headY = bp.totalHeight * 0.81 + bp.neckHeight + bp.headRadius * 0.85
    const fc = config.face

    // Head shape — deformed sphere
    const headGeo = new THREE.SphereGeometry(bp.headRadius, 20, 16)
    // Apply face config as vertex displacement
    const headPos = headGeo.getAttribute('position')
    for (let i = 0; i < headPos.count; i++) {
        const x = headPos.getX(i)
        const y = headPos.getY(i)
        const z = headPos.getZ(i)

        // Widen/narrow head
        const widthFactor = 1.0 + (fc.headWidth - 0.5) * 0.3
        headPos.setX(i, x * widthFactor)

        // Jaw: widen lower face
        if (y < -bp.headRadius * 0.2) {
            const jawFactor = 1.0 + (fc.jawWidth - 0.5) * 0.3
            headPos.setX(i, headPos.getX(i) * jawFactor)
            headPos.setZ(i, z * jawFactor)
        }

        // Forehead: extend top-front
        if (y > bp.headRadius * 0.3 && z > 0) {
            headPos.setY(i, y + (fc.foreheadHeight - 0.5) * bp.headRadius * 0.15)
        }

        // Chin: extend bottom
        if (y < -bp.headRadius * 0.5 && z > 0) {
            headPos.setY(i, y - (1 - fc.jawWidth) * bp.headRadius * 0.1)
        }
    }
    headPos.needsUpdate = true
    headGeo.computeVertexNormals()

    const head = new THREE.Mesh(headGeo, skinMat)
    head.position.set(0, headY, 0)
    head.castShadow = true
    head.name = 'Head'
    group.add(head)

    // ── Eyes ──
    const eyeSpacing = bp.headRadius * (0.25 + fc.eyeSpacing * 0.2)
    const eyeY = headY + bp.headRadius * 0.08
    const eyeZ = bp.headRadius * 0.82
    const eyeR = bp.headRadius * (0.06 + fc.eyeSize * 0.04)

    const eyeWhiteMat = mat('#F5F5F0', 0.1, 0.05)
    const irisMat = mat(fc.eyeColor, 0.1, 0.15)
    const pupilMat = mat('#0a0a0a', 0, 0.05)

    for (const side of [-1, 1]) {
        // Eyeball
        const eyeGeo = new THREE.SphereGeometry(eyeR, 12, 12)
        const eye = new THREE.Mesh(eyeGeo, eyeWhiteMat)
        eye.position.set(side * eyeSpacing, eyeY, eyeZ)
        eye.name = side === -1 ? 'Eye_L' : 'Eye_R'
        group.add(eye)

        // Iris
        const irisGeo = new THREE.SphereGeometry(eyeR * 0.55, 10, 10)
        const iris = new THREE.Mesh(irisGeo, irisMat)
        iris.position.set(side * eyeSpacing, eyeY, eyeZ + eyeR * 0.5)
        group.add(iris)

        // Pupil
        const pupilGeo = new THREE.SphereGeometry(eyeR * 0.3, 8, 8)
        const pupil = new THREE.Mesh(pupilGeo, pupilMat)
        pupil.position.set(side * eyeSpacing, eyeY, eyeZ + eyeR * 0.7)
        group.add(pupil)

        // Eyelid (subtle)
        const lidGeo = new THREE.SphereGeometry(eyeR * 1.1, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.35)
        const lid = new THREE.Mesh(lidGeo, skinMat)
        lid.position.set(side * eyeSpacing, eyeY + eyeR * 0.2, eyeZ)
        lid.rotation.x = -0.2
        group.add(lid)
    }

    // ── Nose ──
    const noseLen = bp.headRadius * (0.1 + fc.noseLength * 0.15)
    const noseW = bp.headRadius * (0.04 + fc.noseWidth * 0.05)
    const noseProfile: Point2[] = [
        { x: noseW, y: 0 },
        { x: noseW * 0.8, y: noseLen * 0.3 },
        { x: noseW * 0.5, y: noseLen * 0.7 },
        { x: noseW * 0.3, y: noseLen },
        { x: 0.001, y: noseLen * 1.05 },
    ]
    const noseGeo = createSplineLatheGeometry(noseProfile, 10, 8, 0, Math.PI)
    const nose = new THREE.Mesh(noseGeo, skinMat)
    nose.position.set(0, headY - bp.headRadius * 0.05, bp.headRadius * 0.75)
    nose.rotation.x = -Math.PI / 2 - 0.1
    nose.name = 'Nose'
    group.add(nose)

    // ── Mouth ──
    const mouthW = bp.headRadius * (0.15 + fc.lipFullness * 0.1)
    const lipH = bp.headRadius * (0.015 + fc.lipFullness * 0.02)

    // Upper lip
    const upperLipGeo = new THREE.BoxGeometry(mouthW, lipH, lipH * 0.5)
    const lipMat = mat(config.skinTone, 0, 0.5)
    // Darken slightly for lip color
    lipMat.color.multiplyScalar(0.85)
    const upperLip = new THREE.Mesh(upperLipGeo, lipMat)
    upperLip.position.set(0, headY - bp.headRadius * 0.3, bp.headRadius * 0.85)
    upperLip.name = 'UpperLip'
    group.add(upperLip)

    // Lower lip
    const lowerLipGeo = new THREE.BoxGeometry(mouthW * 0.9, lipH * 1.2, lipH * 0.5)
    const lowerLip = new THREE.Mesh(lowerLipGeo, lipMat)
    lowerLip.position.set(0, headY - bp.headRadius * 0.33, bp.headRadius * 0.84)
    lowerLip.name = 'LowerLip'
    group.add(lowerLip)

    // ── Ears ──
    const earR = bp.headRadius * (0.08 + fc.earSize * 0.06)
    for (const side of [-1, 1]) {
        const earGeo = new THREE.SphereGeometry(earR, 8, 8, 0, Math.PI)
        const ear = new THREE.Mesh(earGeo, skinMat)
        ear.position.set(side * bp.headRadius * 1.0, headY - bp.headRadius * 0.05, 0)
        ear.rotation.y = side * Math.PI / 2
        ear.name = side === -1 ? 'Ear_L' : 'Ear_R'
        group.add(ear)
    }

    // ══════════════════════════════════════
    //  HAIR
    // ══════════════════════════════════════

    if (config.hair.style !== 'none') {
        const hairMat = mat(config.hair.color, 0, 0.9)
        const hairLen = config.hair.length
        const hairY = headY

        switch (config.hair.style) {
            case 'buzz': {
                const buzzGeo = new THREE.SphereGeometry(bp.headRadius * 1.02, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.52)
                const buzz = new THREE.Mesh(buzzGeo, hairMat)
                buzz.position.set(0, hairY + bp.headRadius * 0.03, 0)
                buzz.name = 'Hair'
                group.add(buzz)
                break
            }
            case 'short': {
                const shortGeo = new THREE.SphereGeometry(bp.headRadius * 1.06, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.55)
                const short = new THREE.Mesh(shortGeo, hairMat)
                short.position.set(0, hairY + bp.headRadius * 0.04, 0)
                short.name = 'Hair'
                group.add(short)
                break
            }
            case 'medium': {
                const topGeo = new THREE.SphereGeometry(bp.headRadius * 1.1, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6)
                const top = new THREE.Mesh(topGeo, hairMat)
                top.position.set(0, hairY + bp.headRadius * 0.04, 0)
                group.add(top)
                // Side/back volume
                const backGeo = new THREE.BoxGeometry(bp.headRadius * 1.8, bp.headRadius * 1.0 * hairLen, bp.headRadius * 0.5)
                const back = new THREE.Mesh(backGeo, hairMat)
                back.position.set(0, hairY - bp.headRadius * 0.3, -bp.headRadius * 0.6)
                back.name = 'Hair'
                group.add(back)
                break
            }
            case 'long': {
                const topGeo = new THREE.SphereGeometry(bp.headRadius * 1.12, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.6)
                const top = new THREE.Mesh(topGeo, hairMat)
                top.position.set(0, hairY + bp.headRadius * 0.03, 0)
                group.add(top)
                // Long flowing back
                const flowLen = bp.headRadius * 2.5 * hairLen
                const flowGeo = new THREE.BoxGeometry(bp.headRadius * 2.0, flowLen, bp.headRadius * 0.4)
                const flow = new THREE.Mesh(flowGeo, hairMat)
                flow.position.set(0, hairY - flowLen * 0.4, -bp.headRadius * 0.65)
                flow.name = 'Hair'
                group.add(flow)
                break
            }
            case 'afro': {
                const afroGeo = new THREE.SphereGeometry(bp.headRadius * 1.6 * (0.8 + hairLen * 0.2), 20, 16)
                displaceGeometry(afroGeo, bp.headRadius * 0.08, 4, 2, 42)
                const afro = new THREE.Mesh(afroGeo, hairMat)
                afro.position.set(0, hairY + bp.headRadius * 0.15, 0)
                afro.name = 'Hair'
                group.add(afro)
                break
            }
            case 'mohawk': {
                const spikeCount = 5 + Math.floor(hairLen * 3)
                for (let i = 0; i < spikeCount; i++) {
                    const t = i / (spikeCount - 1)
                    const spikeH = bp.headRadius * (0.3 + hairLen * 0.4) * (1 - Math.abs(t - 0.5) * 0.5)
                    const spikeGeo = new THREE.ConeGeometry(bp.headRadius * 0.12, spikeH, 6)
                    const spike = new THREE.Mesh(spikeGeo, hairMat)
                    spike.position.set(0, hairY + bp.headRadius * 0.7 + spikeH * 0.3, bp.headRadius * (0.4 - t * 0.8))
                    group.add(spike)
                }
                break
            }
            case 'bun': {
                const capGeo = new THREE.SphereGeometry(bp.headRadius * 1.05, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55)
                const cap = new THREE.Mesh(capGeo, hairMat)
                cap.position.set(0, hairY + bp.headRadius * 0.03, 0)
                group.add(cap)
                const bunGeo = new THREE.SphereGeometry(bp.headRadius * 0.35, 12, 12)
                const bun = new THREE.Mesh(bunGeo, hairMat)
                bun.position.set(0, hairY + bp.headRadius * 0.8, -bp.headRadius * 0.3)
                bun.name = 'Hair'
                group.add(bun)
                break
            }
            case 'ponytail': {
                const capGeo = new THREE.SphereGeometry(bp.headRadius * 1.05, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55)
                const cap = new THREE.Mesh(capGeo, hairMat)
                cap.position.set(0, hairY + bp.headRadius * 0.03, 0)
                group.add(cap)
                const tailLen = bp.headRadius * 1.5 * hairLen
                const tailGeo = createTaperedLimb(tailLen, bp.headRadius * 0.12, bp.headRadius * 0.06, 0.1, 8, 6)
                const tail = new THREE.Mesh(tailGeo, hairMat)
                tail.position.set(0, hairY - bp.headRadius * 0.1, -bp.headRadius * 0.8)
                tail.rotation.x = 0.4
                tail.name = 'Hair'
                group.add(tail)
                break
            }
            case 'braids': {
                const capGeo = new THREE.SphereGeometry(bp.headRadius * 1.05, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55)
                const cap = new THREE.Mesh(capGeo, hairMat)
                cap.position.set(0, hairY + bp.headRadius * 0.03, 0)
                group.add(cap)
                const braidLen = bp.headRadius * 2.0 * hairLen
                for (const side of [-1, 1]) {
                    const braidGeo = createTaperedLimb(braidLen, bp.headRadius * 0.08, bp.headRadius * 0.04, 0.15, 10, 5)
                    const braid = new THREE.Mesh(braidGeo, hairMat)
                    braid.position.set(side * bp.headRadius * 0.7, hairY - bp.headRadius * 0.3, -bp.headRadius * 0.3)
                    braid.rotation.x = 0.2
                    braid.rotation.z = side * 0.15
                    group.add(braid)
                }
                break
            }
            case 'curly': {
                const curlyGeo = new THREE.SphereGeometry(bp.headRadius * 1.3 * (0.8 + hairLen * 0.2), 20, 16)
                displaceGeometry(curlyGeo, bp.headRadius * 0.12, 6, 3, 77)
                const curly = new THREE.Mesh(curlyGeo, hairMat)
                curly.position.set(0, hairY + bp.headRadius * 0.1, 0)
                curly.name = 'Hair'
                group.add(curly)
                break
            }
        }
    }

    // ══════════════════════════════════════
    //  ARMS + HANDS
    // ══════════════════════════════════════

    const armMat = (config.clothing.top !== 'none' && config.clothing.top !== 'tank-top') ? torsoMat : skinMat
    const shoulderY = bp.totalHeight * 0.78

    for (const side of [-1, 1]) {
        // Shoulder (smooth transition sphere)
        const shoulderGeo = new THREE.SphereGeometry(bp.armRadius * 1.5, 10, 10)
        const shoulder = new THREE.Mesh(shoulderGeo, armMat)
        shoulder.position.set(side * bp.shoulderWidth, shoulderY, 0)
        shoulder.name = side === -1 ? 'Shoulder_L' : 'Shoulder_R'
        group.add(shoulder)

        // Upper arm
        const upperArmGeo = createTaperedLimb(bp.upperArmLength, bp.armRadius * 1.2, bp.armRadius * 0.9, config.muscularity * 0.15, 8, 8)
        const upperArm = new THREE.Mesh(upperArmGeo, armMat)
        upperArm.position.set(side * bp.shoulderWidth, shoulderY - bp.upperArmLength / 2, 0)
        upperArm.castShadow = true
        upperArm.name = side === -1 ? 'UpperArm_L' : 'UpperArm_R'
        group.add(upperArm)

        // Elbow
        const elbowY = shoulderY - bp.upperArmLength
        const elbowGeo = new THREE.SphereGeometry(bp.armRadius * 1.0, 8, 8)
        const elbow = new THREE.Mesh(elbowGeo, skinMat)
        elbow.position.set(side * bp.shoulderWidth, elbowY, 0)
        group.add(elbow)

        // Lower arm (forearm)
        const lowerArmGeo = createTaperedLimb(bp.lowerArmLength, bp.armRadius * 0.95, bp.armRadius * 0.65, 0.05, 8, 8)
        const lowerArm = new THREE.Mesh(lowerArmGeo, skinMat)
        lowerArm.position.set(side * bp.shoulderWidth, elbowY - bp.lowerArmLength / 2, 0)
        lowerArm.castShadow = true
        lowerArm.name = side === -1 ? 'LowerArm_L' : 'LowerArm_R'
        group.add(lowerArm)

        // Hand — palm + finger stubs
        const wristY = elbowY - bp.lowerArmLength
        const handW = bp.armRadius * 1.8
        const handH = bp.armRadius * 2.2
        const palmGeo = new THREE.BoxGeometry(handW, handH, bp.armRadius * 0.8)
        const palm = new THREE.Mesh(palmGeo, skinMat)
        palm.position.set(side * bp.shoulderWidth, wristY - handH / 2, 0)
        palm.name = side === -1 ? 'Hand_L' : 'Hand_R'
        group.add(palm)

        // Fingers (4 + thumb)
        const fingerLen = handH * 0.6
        for (let f = 0; f < 4; f++) {
            const fx = side * bp.shoulderWidth + (f - 1.5) * handW * 0.22
            const fingerGeo = new THREE.CylinderGeometry(bp.armRadius * 0.12, bp.armRadius * 0.09, fingerLen, 4)
            const finger = new THREE.Mesh(fingerGeo, skinMat)
            finger.position.set(fx, wristY - handH - fingerLen / 2, 0)
            group.add(finger)
        }
        // Thumb
        const thumbGeo = new THREE.CylinderGeometry(bp.armRadius * 0.14, bp.armRadius * 0.10, fingerLen * 0.7, 4)
        const thumb = new THREE.Mesh(thumbGeo, skinMat)
        thumb.position.set(side * (bp.shoulderWidth + handW * 0.4), wristY - handH * 0.3, bp.armRadius * 0.3)
        thumb.rotation.z = -side * 0.5
        group.add(thumb)
    }

    // ══════════════════════════════════════
    //  LEGS + FEET
    // ══════════════════════════════════════

    const legColor = config.clothing.bottom !== 'none' ? config.clothing.bottomColor : config.skinTone
    const legMat = config.clothing.bottom !== 'none' ? mat(legColor, 0, 0.7) : skinMat
    const legTopY = bp.totalHeight * 0.46

    for (const side of [-1, 1]) {
        // Upper leg (thigh)
        const upperLegGeo = createTaperedLimb(bp.upperLegLength, bp.legRadius * 1.3, bp.legRadius * 0.95, config.muscularity * 0.1, 8, 8)
        const upperLeg = new THREE.Mesh(upperLegGeo, legMat)
        upperLeg.position.set(side * bp.hipWidth * 0.6, legTopY - bp.upperLegLength / 2, 0)
        upperLeg.castShadow = true
        upperLeg.name = side === -1 ? 'UpperLeg_L' : 'UpperLeg_R'
        group.add(upperLeg)

        // Knee
        const kneeY = legTopY - bp.upperLegLength
        const kneeGeo = new THREE.SphereGeometry(bp.legRadius * 0.9, 8, 8)
        const knee = new THREE.Mesh(kneeGeo, legMat)
        knee.position.set(side * bp.hipWidth * 0.6, kneeY, 0)
        group.add(knee)

        // Lower leg (calf)
        const lowerLegGeo = createTaperedLimb(bp.lowerLegLength, bp.legRadius * 0.95, bp.legRadius * 0.55, 0.08, 8, 8)
        const lowerLeg = new THREE.Mesh(lowerLegGeo, legMat)
        lowerLeg.position.set(side * bp.hipWidth * 0.6, kneeY - bp.lowerLegLength / 2, 0)
        lowerLeg.castShadow = true
        lowerLeg.name = side === -1 ? 'LowerLeg_L' : 'LowerLeg_R'
        group.add(lowerLeg)

        // Foot
        const ankleY = kneeY - bp.lowerLegLength
        if (config.clothing.footwear !== 'none') {
            const shoeMat = mat(config.clothing.footwearColor, 0.15, 0.6)
            const shoeGeo = new THREE.BoxGeometry(bp.legRadius * 2, bp.legRadius * 1.2, bp.legRadius * 3.2)
            const shoe = new THREE.Mesh(shoeGeo, shoeMat)
            shoe.position.set(side * bp.hipWidth * 0.6, ankleY - bp.legRadius * 0.2, bp.legRadius * 0.6)
            shoe.castShadow = true
            shoe.name = side === -1 ? 'Shoe_L' : 'Shoe_R'
            group.add(shoe)

            // Sole
            const soleGeo = new THREE.BoxGeometry(bp.legRadius * 2.1, bp.legRadius * 0.3, bp.legRadius * 3.3)
            const soleMat = mat('#1a1a1a', 0, 0.9)
            const sole = new THREE.Mesh(soleGeo, soleMat)
            sole.position.set(side * bp.hipWidth * 0.6, ankleY - bp.legRadius * 0.75, bp.legRadius * 0.6)
            group.add(sole)
        } else {
            // Bare foot
            const footGeo = new THREE.BoxGeometry(bp.legRadius * 1.6, bp.legRadius * 0.6, bp.legRadius * 2.5)
            const foot = new THREE.Mesh(footGeo, skinMat)
            foot.position.set(side * bp.hipWidth * 0.6, ankleY - bp.legRadius * 0.1, bp.legRadius * 0.5)
            foot.name = side === -1 ? 'Foot_L' : 'Foot_R'
            group.add(foot)
        }
    }

    // ══════════════════════════════════════
    //  ACCESSORIES
    // ══════════════════════════════════════

    for (const acc of config.accessories) {
        switch (acc) {
            case 'glasses':
            case 'sunglasses': {
                const frameMat = mat('#333333', 0.6, 0.2)
                const lensColor = acc === 'sunglasses' ? '#1a1a2a' : '#C8E8FF'
                const lensMat = mat(lensColor, 0.1, 0.05)
                if (acc === 'sunglasses') { lensMat.transparent = true; lensMat.opacity = 0.6 }

                const bridge = new THREE.Mesh(new THREE.BoxGeometry(eyeR * 3, 0.004, 0.006), frameMat)
                bridge.position.set(0, headY + bp.headRadius * 0.08, bp.headRadius * 0.88)
                group.add(bridge)

                for (const s of [-1, 1]) {
                    const lensGeo = new THREE.RingGeometry(eyeR * 0.5, eyeR * 1.0, 12)
                    const lens = new THREE.Mesh(lensGeo, lensMat)
                    lens.position.set(s * eyeR * 2, headY + bp.headRadius * 0.08, bp.headRadius * 0.89)
                    group.add(lens)
                    // Arm
                    const armGeo = new THREE.CylinderGeometry(0.002, 0.002, bp.headRadius * 1.5, 4)
                    const arm = new THREE.Mesh(armGeo, frameMat)
                    arm.position.set(s * bp.headRadius * 0.85, headY + bp.headRadius * 0.08, 0)
                    arm.rotation.x = Math.PI / 2
                    group.add(arm)
                }
                break
            }
            case 'hat':
            case 'cap': {
                const hatMat = mat('#2F4F4F', 0, 0.7)
                if (acc === 'hat') {
                    const crownGeo = new THREE.CylinderGeometry(bp.headRadius * 0.85, bp.headRadius * 0.75, bp.headRadius * 0.6, 16)
                    const crown = new THREE.Mesh(crownGeo, hatMat)
                    crown.position.set(0, headY + bp.headRadius * 0.9, 0)
                    group.add(crown)
                    const brim = new THREE.Mesh(new THREE.CylinderGeometry(bp.headRadius * 1.3, bp.headRadius * 1.3, 0.012, 20), hatMat)
                    brim.position.set(0, headY + bp.headRadius * 0.62, 0)
                    group.add(brim)
                } else {
                    const capGeo = new THREE.SphereGeometry(bp.headRadius * 1.08, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.45)
                    const cap = new THREE.Mesh(capGeo, hatMat)
                    cap.position.set(0, headY + bp.headRadius * 0.15, 0)
                    group.add(cap)
                    const visor = new THREE.Mesh(new THREE.BoxGeometry(bp.headRadius * 1.2, 0.008, bp.headRadius * 0.5), hatMat)
                    visor.position.set(0, headY + bp.headRadius * 0.2, bp.headRadius * 0.95)
                    visor.rotation.x = -0.15
                    group.add(visor)
                }
                break
            }
            case 'headphones': {
                const hpMat = mat('#1a1a1a', 0.5, 0.3)
                const bandGeo = new THREE.TorusGeometry(bp.headRadius * 1.05, 0.01, 6, 14, Math.PI)
                const band = new THREE.Mesh(bandGeo, hpMat)
                band.position.set(0, headY + bp.headRadius * 0.8, 0)
                group.add(band)
                for (const s of [-1, 1]) {
                    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.018, 12), hpMat)
                    cup.position.set(s * bp.headRadius * 1.08, headY, 0)
                    cup.rotation.z = Math.PI / 2
                    group.add(cup)
                }
                break
            }
            case 'tie':
            case 'bowtie': {
                const tieMat = mat('#8B0000', 0.1, 0.5)
                if (acc === 'tie') {
                    const tieGeo = new THREE.BoxGeometry(0.035, bp.totalHeight * 0.15, 0.008)
                    const tie = new THREE.Mesh(tieGeo, tieMat)
                    tie.position.set(0, bp.totalHeight * 0.68, bp.shoulderWidth * 0.6)
                    group.add(tie)
                } else {
                    const bowGeo = new THREE.BoxGeometry(0.06, 0.025, 0.01)
                    const bow = new THREE.Mesh(bowGeo, tieMat)
                    bow.position.set(0, bp.totalHeight * 0.8, bp.shoulderWidth * 0.55)
                    group.add(bow)
                }
                break
            }
            case 'scarf': {
                const scarfMat = mat('#CC4444', 0, 0.8)
                const scarfGeo = new THREE.TorusGeometry(bp.neckRadius * 1.5, bp.neckRadius * 0.4, 8, 16)
                const scarf = new THREE.Mesh(scarfGeo, scarfMat)
                scarf.position.set(0, bp.totalHeight * 0.82, 0)
                scarf.rotation.x = Math.PI / 2
                group.add(scarf)
                break
            }
            case 'helmet': {
                const helmetMat = mat('#4A4A4A', 0.8, 0.3)
                const helmetGeo = new THREE.SphereGeometry(bp.headRadius * 1.15, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6)
                const helmet = new THREE.Mesh(helmetGeo, helmetMat)
                helmet.position.set(0, headY + bp.headRadius * 0.1, 0)
                group.add(helmet)
                break
            }
            case 'crown': {
                const crownMat = mat('#FFD700', 0.9, 0.15)
                const crownGeo = new THREE.CylinderGeometry(bp.headRadius * 0.85, bp.headRadius * 0.9, bp.headRadius * 0.4, 8)
                const crown = new THREE.Mesh(crownGeo, crownMat)
                crown.position.set(0, headY + bp.headRadius * 0.75, 0)
                group.add(crown)
                for (let i = 0; i < 5; i++) {
                    const angle = (i / 5) * Math.PI * 2
                    const pointGeo = new THREE.ConeGeometry(bp.headRadius * 0.06, bp.headRadius * 0.15, 4)
                    const point = new THREE.Mesh(pointGeo, crownMat)
                    point.position.set(
                        Math.cos(angle) * bp.headRadius * 0.8,
                        headY + bp.headRadius * 1.05,
                        Math.sin(angle) * bp.headRadius * 0.8,
                    )
                    group.add(point)
                }
                break
            }
        }
    }

    // Scale by height multiplier
    group.scale.setScalar(scale)
    return group
}

// ══════════════════════════════════════════
//  PRESETS
// ══════════════════════════════════════════

export const CHARACTER_PRESETS: GeneratorPreset<CharacterGenConfig>[] = [
    { id: 'narrator', name: 'Narrator', icon: '🎙️', category: 'character', description: 'Professional narrator in a dark suit', config: { ...DEFAULT_CHARACTER, name: 'Narrator', build: 'average', gender: 'masculine', clothing: { top: 'suit', topColor: '#1a1a2e', bottom: 'slacks', bottomColor: '#1a1a2e', footwear: 'shoes', footwearColor: '#1a1a1a' }, accessories: ['tie'], hair: { style: 'short', color: '#2C1810', length: 1 } } },
    { id: 'presenter', name: 'Presenter', icon: '📺', category: 'character', description: 'Friendly presenter in blue', config: { ...DEFAULT_CHARACTER, name: 'Presenter', build: 'average', gender: 'feminine', clothing: { top: 'button-shirt', topColor: '#4169E1', bottom: 'slacks', bottomColor: '#2F2F2F', footwear: 'shoes', footwearColor: '#333' }, accessories: ['glasses'], hair: { style: 'medium', color: '#4a3728', length: 1 } } },
    { id: 'scientist', name: 'Scientist', icon: '🔬', category: 'character', description: 'Lab coat scientist', config: { ...DEFAULT_CHARACTER, name: 'Scientist', build: 'slim', gender: 'androgynous', clothing: { top: 'coat', topColor: '#FFFFFF', bottom: 'slacks', bottomColor: '#333333', footwear: 'shoes', footwearColor: '#333' }, accessories: ['glasses'], hair: { style: 'bun', color: '#8B4513', length: 1 } } },
    { id: 'athlete', name: 'Athlete', icon: '🏃', category: 'character', description: 'Athletic build in sportswear', config: { ...DEFAULT_CHARACTER, name: 'Athlete', build: 'athletic', gender: 'masculine', muscularity: 0.7, bodyFat: 0.15, clothing: { top: 'tank-top', topColor: '#CC0000', bottom: 'shorts', bottomColor: '#1a1a1a', footwear: 'sneakers', footwearColor: '#FFFFFF' }, hair: { style: 'buzz', color: '#1a1a1a', length: 1 }, skinTone: '#C68642' } },
    { id: 'executive', name: 'Executive', icon: '💼', category: 'character', description: 'Polished executive', config: { ...DEFAULT_CHARACTER, name: 'Executive', build: 'average', gender: 'masculine', clothing: { top: 'suit', topColor: '#0a0a15', bottom: 'slacks', bottomColor: '#0a0a15', footwear: 'shoes', footwearColor: '#1a1a1a' }, accessories: ['tie', 'watch'], hair: { style: 'short', color: '#2C1810', length: 1 }, skinTone: '#C68642' } },
    { id: 'casual', name: 'Casual', icon: '👕', category: 'character', description: 'Casual everyday look', config: { ...DEFAULT_CHARACTER, name: 'Casual', build: 'average', gender: 'androgynous', clothing: { top: 'hoodie', topColor: '#2E8B57', bottom: 'jeans', bottomColor: '#2F4F6F', footwear: 'sneakers', footwearColor: '#FFFFFF' }, accessories: ['headphones'], hair: { style: 'curly', color: '#1a1a1a', length: 1 } } },
    { id: 'child', name: 'Child', icon: '👦', category: 'character', description: 'Young child', config: { ...DEFAULT_CHARACTER, name: 'Kid', build: 'child', gender: 'androgynous', height: 0.6, clothing: { top: 'tshirt', topColor: '#FF6347', bottom: 'shorts', bottomColor: '#4682B4', footwear: 'sneakers', footwearColor: '#FF69B4' }, hair: { style: 'short', color: '#FFD700', length: 1 } } },
    { id: 'warrior', name: 'Warrior', icon: '⚔️', category: 'character', description: 'Armored warrior', config: { ...DEFAULT_CHARACTER, name: 'Warrior', build: 'athletic', gender: 'masculine', muscularity: 0.8, clothing: { top: 'armor', topColor: '#696969', bottom: 'armor-legs', bottomColor: '#555555', footwear: 'armor-boots', footwearColor: '#4A4A4A' }, accessories: ['helmet'], hair: { style: 'none', color: '#1a1a1a', length: 1 } } },
]
