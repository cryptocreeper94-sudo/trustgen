/* ====== TrustGen — Procedural Motion Library ======
 * Generates THREE.AnimationClip objects for common motions
 * without requiring Mixamo or any external service.
 * 
 * Uses the humanoid rig defined in rigTypes.ts:
 * Hips, Spine, Chest, Neck, Head, L/R Shoulder/Elbow/Wrist,
 * L/R Hip/Knee/Ankle/Toe, L/R Thumb/FingerTip
 */
import * as THREE from 'three'

// ── Types ──
export interface MotionPreset {
    name: string
    category: 'locomotion' | 'gesture' | 'idle' | 'action'
    description: string
    icon: string
    /** Parameters the user can tweak */
    params: MotionParam[]
    /** Generate the clip with given param values */
    generate: (paramValues: Record<string, number>) => THREE.AnimationClip
}

export interface MotionParam {
    name: string
    label: string
    min: number
    max: number
    default: number
    step: number
}

// ── Helpers ──
const DEG = Math.PI / 180

/** Create a quaternion keyframe track for a bone */
function quatTrack(
    boneName: string,
    times: number[],
    rotations: THREE.Euler[]
): THREE.QuaternionKeyframeTrack {
    const q = new THREE.Quaternion()
    const values: number[] = []
    for (const euler of rotations) {
        q.setFromEuler(euler)
        values.push(q.x, q.y, q.z, q.w)
    }
    return new THREE.QuaternionKeyframeTrack(
        `${boneName}.quaternion`,
        times,
        values,
        THREE.InterpolateSmooth
    )
}

/** Create a position keyframe track for a bone */
function posTrack(
    boneName: string,
    times: number[],
    positions: THREE.Vector3[]
): THREE.VectorKeyframeTrack {
    const values: number[] = []
    for (const p of positions) {
        values.push(p.x, p.y, p.z)
    }
    return new THREE.VectorKeyframeTrack(
        `${boneName}.position`,
        times,
        values,
        THREE.InterpolateSmooth
    )
}

// ═══════════════════════════════════════════════════════════════
//  WALK CYCLE
// ═══════════════════════════════════════════════════════════════
function generateWalkCycle(params: Record<string, number>): THREE.AnimationClip {
    const speed = params.speed ?? 1
    const stride = params.stride ?? 1
    const armSwing = params.armSwing ?? 1
    const duration = 1.0 / speed
    const halfDur = duration / 2

    // Key times: 0 (left contact) → half (passing) → full (right contact)
    const t = [0, halfDur * 0.5, halfDur, halfDur * 1.5, duration]

    const tracks: THREE.KeyframeTrack[] = []

    // ── Hips: subtle vertical bob + forward tilt ──
    const bobHeight = 0.015 * stride
    tracks.push(posTrack('Hips', t, [
        new THREE.Vector3(0, -bobHeight, 0),
        new THREE.Vector3(0, bobHeight, 0),
        new THREE.Vector3(0, -bobHeight, 0),
        new THREE.Vector3(0, bobHeight, 0),
        new THREE.Vector3(0, -bobHeight, 0),
    ]))

    // Hips rotation: slight lateral sway
    tracks.push(quatTrack('Hips', t, [
        new THREE.Euler(0, 0, 2 * DEG * stride),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(0, 0, -2 * DEG * stride),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(0, 0, 2 * DEG * stride),
    ]))

    // ── Spine: counter-rotate to hips ──
    tracks.push(quatTrack('Spine', t, [
        new THREE.Euler(2 * DEG, 0, -1 * DEG * stride),
        new THREE.Euler(3 * DEG, 0, 0),
        new THREE.Euler(2 * DEG, 0, 1 * DEG * stride),
        new THREE.Euler(3 * DEG, 0, 0),
        new THREE.Euler(2 * DEG, 0, -1 * DEG * stride),
    ]))

    // ── Left Leg ──
    const legSwing = 25 * DEG * stride
    tracks.push(quatTrack('L_Hip', t, [
        new THREE.Euler(-legSwing, 0, 0),   // forward
        new THREE.Euler(-legSwing * 0.3, 0, 0),
        new THREE.Euler(legSwing * 0.6, 0, 0),   // backward
        new THREE.Euler(legSwing * 0.3, 0, 0),
        new THREE.Euler(-legSwing, 0, 0),
    ]))
    tracks.push(quatTrack('L_Knee', t, [
        new THREE.Euler(5 * DEG, 0, 0),
        new THREE.Euler(40 * DEG * stride, 0, 0),
        new THREE.Euler(5 * DEG, 0, 0),
        new THREE.Euler(15 * DEG * stride, 0, 0),
        new THREE.Euler(5 * DEG, 0, 0),
    ]))

    // ── Right Leg (opposite phase) ──
    tracks.push(quatTrack('R_Hip', t, [
        new THREE.Euler(legSwing * 0.6, 0, 0),
        new THREE.Euler(legSwing * 0.3, 0, 0),
        new THREE.Euler(-legSwing, 0, 0),
        new THREE.Euler(-legSwing * 0.3, 0, 0),
        new THREE.Euler(legSwing * 0.6, 0, 0),
    ]))
    tracks.push(quatTrack('R_Knee', t, [
        new THREE.Euler(5 * DEG, 0, 0),
        new THREE.Euler(15 * DEG * stride, 0, 0),
        new THREE.Euler(5 * DEG, 0, 0),
        new THREE.Euler(40 * DEG * stride, 0, 0),
        new THREE.Euler(5 * DEG, 0, 0),
    ]))

    // ── Left Arm (opposite to left leg) ──
    const armAngle = 20 * DEG * armSwing
    tracks.push(quatTrack('L_Shoulder', t, [
        new THREE.Euler(armAngle, 0, 0),
        new THREE.Euler(armAngle * 0.3, 0, 0),
        new THREE.Euler(-armAngle, 0, 0),
        new THREE.Euler(-armAngle * 0.3, 0, 0),
        new THREE.Euler(armAngle, 0, 0),
    ]))
    tracks.push(quatTrack('L_Elbow', t, [
        new THREE.Euler(-10 * DEG * armSwing, 0, 0),
        new THREE.Euler(-25 * DEG * armSwing, 0, 0),
        new THREE.Euler(-10 * DEG * armSwing, 0, 0),
        new THREE.Euler(-20 * DEG * armSwing, 0, 0),
        new THREE.Euler(-10 * DEG * armSwing, 0, 0),
    ]))

    // ── Right Arm (opposite to right leg) ──
    tracks.push(quatTrack('R_Shoulder', t, [
        new THREE.Euler(-armAngle, 0, 0),
        new THREE.Euler(-armAngle * 0.3, 0, 0),
        new THREE.Euler(armAngle, 0, 0),
        new THREE.Euler(armAngle * 0.3, 0, 0),
        new THREE.Euler(-armAngle, 0, 0),
    ]))
    tracks.push(quatTrack('R_Elbow', t, [
        new THREE.Euler(-10 * DEG * armSwing, 0, 0),
        new THREE.Euler(-20 * DEG * armSwing, 0, 0),
        new THREE.Euler(-10 * DEG * armSwing, 0, 0),
        new THREE.Euler(-25 * DEG * armSwing, 0, 0),
        new THREE.Euler(-10 * DEG * armSwing, 0, 0),
    ]))

    // ── Head: subtle look forward ──
    tracks.push(quatTrack('Neck', t, [
        new THREE.Euler(-2 * DEG, 1 * DEG, 0),
        new THREE.Euler(-3 * DEG, 0, 0),
        new THREE.Euler(-2 * DEG, -1 * DEG, 0),
        new THREE.Euler(-3 * DEG, 0, 0),
        new THREE.Euler(-2 * DEG, 1 * DEG, 0),
    ]))

    return new THREE.AnimationClip('Walk', duration, tracks)
}

// ═══════════════════════════════════════════════════════════════
//  RUN CYCLE
// ═══════════════════════════════════════════════════════════════
function generateRunCycle(params: Record<string, number>): THREE.AnimationClip {
    const speed = params.speed ?? 1.5
    const intensity = params.intensity ?? 1
    const duration = 0.6 / speed
    const halfDur = duration / 2
    const t = [0, halfDur * 0.4, halfDur, halfDur * 1.4, duration]

    const tracks: THREE.KeyframeTrack[] = []

    // Hips: bigger bob, more forward lean
    const bob = 0.04 * intensity
    tracks.push(posTrack('Hips', t, [
        new THREE.Vector3(0, -bob, 0),
        new THREE.Vector3(0, bob * 1.5, 0),
        new THREE.Vector3(0, -bob, 0),
        new THREE.Vector3(0, bob * 1.5, 0),
        new THREE.Vector3(0, -bob, 0),
    ]))

    tracks.push(quatTrack('Spine', t, [
        new THREE.Euler(8 * DEG * intensity, 0, 0),
        new THREE.Euler(5 * DEG * intensity, 0, 0),
        new THREE.Euler(8 * DEG * intensity, 0, 0),
        new THREE.Euler(5 * DEG * intensity, 0, 0),
        new THREE.Euler(8 * DEG * intensity, 0, 0),
    ]))

    // Legs: bigger swing
    const legSwing = 40 * DEG * intensity
    tracks.push(quatTrack('L_Hip', t, [
        new THREE.Euler(-legSwing, 0, 0),
        new THREE.Euler(-legSwing * 0.2, 0, 0),
        new THREE.Euler(legSwing * 0.5, 0, 0),
        new THREE.Euler(legSwing * 0.2, 0, 0),
        new THREE.Euler(-legSwing, 0, 0),
    ]))
    tracks.push(quatTrack('L_Knee', t, [
        new THREE.Euler(10 * DEG, 0, 0),
        new THREE.Euler(90 * DEG * intensity, 0, 0),
        new THREE.Euler(5 * DEG, 0, 0),
        new THREE.Euler(30 * DEG * intensity, 0, 0),
        new THREE.Euler(10 * DEG, 0, 0),
    ]))

    tracks.push(quatTrack('R_Hip', t, [
        new THREE.Euler(legSwing * 0.5, 0, 0),
        new THREE.Euler(legSwing * 0.2, 0, 0),
        new THREE.Euler(-legSwing, 0, 0),
        new THREE.Euler(-legSwing * 0.2, 0, 0),
        new THREE.Euler(legSwing * 0.5, 0, 0),
    ]))
    tracks.push(quatTrack('R_Knee', t, [
        new THREE.Euler(5 * DEG, 0, 0),
        new THREE.Euler(30 * DEG * intensity, 0, 0),
        new THREE.Euler(10 * DEG, 0, 0),
        new THREE.Euler(90 * DEG * intensity, 0, 0),
        new THREE.Euler(5 * DEG, 0, 0),
    ]))

    // Arms: bigger pump
    const armPump = 35 * DEG * intensity
    tracks.push(quatTrack('L_Shoulder', t, [
        new THREE.Euler(armPump, 0, 0),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(-armPump, 0, 0),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(armPump, 0, 0),
    ]))
    tracks.push(quatTrack('L_Elbow', t, [
        new THREE.Euler(-50 * DEG * intensity, 0, 0),
        new THREE.Euler(-70 * DEG * intensity, 0, 0),
        new THREE.Euler(-30 * DEG * intensity, 0, 0),
        new THREE.Euler(-60 * DEG * intensity, 0, 0),
        new THREE.Euler(-50 * DEG * intensity, 0, 0),
    ]))
    tracks.push(quatTrack('R_Shoulder', t, [
        new THREE.Euler(-armPump, 0, 0),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(armPump, 0, 0),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(-armPump, 0, 0),
    ]))
    tracks.push(quatTrack('R_Elbow', t, [
        new THREE.Euler(-30 * DEG * intensity, 0, 0),
        new THREE.Euler(-60 * DEG * intensity, 0, 0),
        new THREE.Euler(-50 * DEG * intensity, 0, 0),
        new THREE.Euler(-70 * DEG * intensity, 0, 0),
        new THREE.Euler(-30 * DEG * intensity, 0, 0),
    ]))

    return new THREE.AnimationClip('Run', duration, tracks)
}

// ═══════════════════════════════════════════════════════════════
//  IDLE BREATHING
// ═══════════════════════════════════════════════════════════════
function generateIdle(params: Record<string, number>): THREE.AnimationClip {
    const breathRate = params.breathRate ?? 1
    const sway = params.sway ?? 1
    const duration = 4.0 / breathRate
    const t = [0, duration * 0.25, duration * 0.5, duration * 0.75, duration]

    const tracks: THREE.KeyframeTrack[] = []

    // Subtle breathing: chest rises, hips bob
    const breathAmt = 0.005 * sway
    tracks.push(posTrack('Hips', t, [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, breathAmt, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -breathAmt * 0.5, 0),
        new THREE.Vector3(0, 0, 0),
    ]))

    tracks.push(quatTrack('Spine', t, [
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(-1.5 * DEG * sway, 0, 0),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(0.5 * DEG * sway, 0, 0),
        new THREE.Euler(0, 0, 0),
    ]))

    tracks.push(quatTrack('Chest', t, [
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(-1 * DEG * sway, 0, 0.3 * DEG * sway),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(0.5 * DEG * sway, 0, -0.3 * DEG * sway),
        new THREE.Euler(0, 0, 0),
    ]))

    // Weight shift: hips sway side to side
    tracks.push(quatTrack('Hips', t, [
        new THREE.Euler(0, 0, 0.5 * DEG * sway),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(0, 0, -0.5 * DEG * sway),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(0, 0, 0.5 * DEG * sway),
    ]))

    // Arms hang slightly
    tracks.push(quatTrack('L_Shoulder', t, [
        new THREE.Euler(2 * DEG, 0, -3 * DEG),
        new THREE.Euler(1 * DEG, 0, -3.5 * DEG),
        new THREE.Euler(2 * DEG, 0, -3 * DEG),
        new THREE.Euler(3 * DEG, 0, -2.5 * DEG),
        new THREE.Euler(2 * DEG, 0, -3 * DEG),
    ]))
    tracks.push(quatTrack('R_Shoulder', t, [
        new THREE.Euler(2 * DEG, 0, 3 * DEG),
        new THREE.Euler(1 * DEG, 0, 3.5 * DEG),
        new THREE.Euler(2 * DEG, 0, 3 * DEG),
        new THREE.Euler(3 * DEG, 0, 2.5 * DEG),
        new THREE.Euler(2 * DEG, 0, 3 * DEG),
    ]))

    // Subtle head movement
    tracks.push(quatTrack('Neck', t, [
        new THREE.Euler(-2 * DEG, 0, 0),
        new THREE.Euler(-2.5 * DEG, 1 * DEG * sway, 0),
        new THREE.Euler(-2 * DEG, 0, 0),
        new THREE.Euler(-2.5 * DEG, -1 * DEG * sway, 0),
        new THREE.Euler(-2 * DEG, 0, 0),
    ]))

    return new THREE.AnimationClip('Idle', duration, tracks)
}

// ═══════════════════════════════════════════════════════════════
//  WAVE GESTURE
// ═══════════════════════════════════════════════════════════════
function generateWave(params: Record<string, number>): THREE.AnimationClip {
    const hand = params.hand ?? 0  // 0 = right, 1 = left
    const speed = params.speed ?? 1
    const duration = 2.0 / speed
    const prefix = hand === 0 ? 'R' : 'L'
    const sign = hand === 0 ? 1 : -1

    const t = [0, 0.3 / speed, 0.5 / speed, 0.8 / speed, 1.1 / speed, 1.4 / speed, 1.7 / speed, duration]
    const tracks: THREE.KeyframeTrack[] = []

    // Raise arm
    tracks.push(quatTrack(`${prefix}_Shoulder`, t, [
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(-60 * DEG, sign * 30 * DEG, 0),
        new THREE.Euler(-80 * DEG, sign * 35 * DEG, 0),
        new THREE.Euler(-80 * DEG, sign * 35 * DEG, 0),
        new THREE.Euler(-80 * DEG, sign * 35 * DEG, 0),
        new THREE.Euler(-80 * DEG, sign * 35 * DEG, 0),
        new THREE.Euler(-60 * DEG, sign * 30 * DEG, 0),
        new THREE.Euler(0, 0, 0),
    ]))

    // Bend elbow
    tracks.push(quatTrack(`${prefix}_Elbow`, t, [
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(-45 * DEG, 0, 0),
        new THREE.Euler(-90 * DEG, 0, 0),
        new THREE.Euler(-90 * DEG, 0, 0),
        new THREE.Euler(-90 * DEG, 0, 0),
        new THREE.Euler(-90 * DEG, 0, 0),
        new THREE.Euler(-45 * DEG, 0, 0),
        new THREE.Euler(0, 0, 0),
    ]))

    // Wrist waves back and forth
    tracks.push(quatTrack(`${prefix}_Wrist`, t, [
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(0, 0, sign * 20 * DEG),
        new THREE.Euler(0, 0, sign * -20 * DEG),
        new THREE.Euler(0, 0, sign * 20 * DEG),
        new THREE.Euler(0, 0, sign * -20 * DEG),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(0, 0, 0),
    ]))

    return new THREE.AnimationClip('Wave', duration, tracks)
}

// ═══════════════════════════════════════════════════════════════
//  JUMP
// ═══════════════════════════════════════════════════════════════
function generateJump(params: Record<string, number>): THREE.AnimationClip {
    const height = params.height ?? 1
    const duration = 1.2
    const t = [0, 0.2, 0.35, 0.6, 0.8, 1.0, duration]

    const tracks: THREE.KeyframeTrack[] = []
    const jumpH = 0.15 * height

    // Hips: squat → launch → airborne → land
    tracks.push(posTrack('Hips', t, [
        new THREE.Vector3(0, 0, 0),           // stand
        new THREE.Vector3(0, -0.06, 0),       // squat
        new THREE.Vector3(0, jumpH * 0.5, 0), // launch
        new THREE.Vector3(0, jumpH, 0),       // peak
        new THREE.Vector3(0, jumpH * 0.3, 0), // descend
        new THREE.Vector3(0, -0.04, 0),       // land (absorb)
        new THREE.Vector3(0, 0, 0),           // recover
    ]))

    // Knees: bend for squat and landing
    const squat = 60 * DEG * height
    tracks.push(quatTrack('L_Knee', t, [
        new THREE.Euler(5 * DEG, 0, 0),
        new THREE.Euler(squat, 0, 0),
        new THREE.Euler(10 * DEG, 0, 0),
        new THREE.Euler(5 * DEG, 0, 0),
        new THREE.Euler(15 * DEG, 0, 0),
        new THREE.Euler(squat * 0.7, 0, 0),
        new THREE.Euler(5 * DEG, 0, 0),
    ]))
    tracks.push(quatTrack('R_Knee', t, [
        new THREE.Euler(5 * DEG, 0, 0),
        new THREE.Euler(squat, 0, 0),
        new THREE.Euler(10 * DEG, 0, 0),
        new THREE.Euler(5 * DEG, 0, 0),
        new THREE.Euler(15 * DEG, 0, 0),
        new THREE.Euler(squat * 0.7, 0, 0),
        new THREE.Euler(5 * DEG, 0, 0),
    ]))

    // Arms raise on jump
    tracks.push(quatTrack('L_Shoulder', t, [
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(15 * DEG, 0, 0),
        new THREE.Euler(-60 * DEG, 0, -20 * DEG),
        new THREE.Euler(-80 * DEG, 0, -30 * DEG),
        new THREE.Euler(-40 * DEG, 0, -15 * DEG),
        new THREE.Euler(10 * DEG, 0, 0),
        new THREE.Euler(0, 0, 0),
    ]))
    tracks.push(quatTrack('R_Shoulder', t, [
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(15 * DEG, 0, 0),
        new THREE.Euler(-60 * DEG, 0, 20 * DEG),
        new THREE.Euler(-80 * DEG, 0, 30 * DEG),
        new THREE.Euler(-40 * DEG, 0, 15 * DEG),
        new THREE.Euler(10 * DEG, 0, 0),
        new THREE.Euler(0, 0, 0),
    ]))

    // Spine: lean forward on squat, extend on jump
    tracks.push(quatTrack('Spine', t, [
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(10 * DEG, 0, 0),
        new THREE.Euler(-5 * DEG, 0, 0),
        new THREE.Euler(-8 * DEG, 0, 0),
        new THREE.Euler(-3 * DEG, 0, 0),
        new THREE.Euler(8 * DEG, 0, 0),
        new THREE.Euler(0, 0, 0),
    ]))

    return new THREE.AnimationClip('Jump', duration, tracks)
}

// ═══════════════════════════════════════════════════════════════
//  LOOK AROUND
// ═══════════════════════════════════════════════════════════════
function generateLookAround(params: Record<string, number>): THREE.AnimationClip {
    const range = params.range ?? 1
    const duration = 4.0
    const t = [0, 1, 2, 3, duration]

    const tracks: THREE.KeyframeTrack[] = []
    const headTurn = 30 * DEG * range

    tracks.push(quatTrack('Neck', t, [
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(-5 * DEG, headTurn, 0),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(-5 * DEG, -headTurn, 0),
        new THREE.Euler(0, 0, 0),
    ]))

    tracks.push(quatTrack('Head', t, [
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(-8 * DEG * range, 10 * DEG * range, 0),
        new THREE.Euler(5 * DEG * range, 0, 0),
        new THREE.Euler(-8 * DEG * range, -10 * DEG * range, 0),
        new THREE.Euler(0, 0, 0),
    ]))

    // Slight spine follow
    tracks.push(quatTrack('Chest', t, [
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(0, 8 * DEG * range, 0),
        new THREE.Euler(0, 0, 0),
        new THREE.Euler(0, -8 * DEG * range, 0),
        new THREE.Euler(0, 0, 0),
    ]))

    return new THREE.AnimationClip('Look Around', duration, tracks)
}

// ═══════════════════════════════════════════════════════════════
//  CLAP
// ═══════════════════════════════════════════════════════════════
function generateClap(params: Record<string, number>): THREE.AnimationClip {
    const speed = params.speed ?? 1
    const duration = 2.0 / speed
    const clapInterval = 0.25 / speed

    const times: number[] = []
    const lShoulderRots: THREE.Euler[] = []
    const rShoulderRots: THREE.Euler[] = []
    const lElbowRots: THREE.Euler[] = []
    const rElbowRots: THREE.Euler[] = []

    // Wind up
    times.push(0)
    lShoulderRots.push(new THREE.Euler(0, 0, 0))
    rShoulderRots.push(new THREE.Euler(0, 0, 0))
    lElbowRots.push(new THREE.Euler(0, 0, 0))
    rElbowRots.push(new THREE.Euler(0, 0, 0))

    // Raise arms to clap position
    times.push(0.3 / speed)
    lShoulderRots.push(new THREE.Euler(-50 * DEG, 0, 25 * DEG))
    rShoulderRots.push(new THREE.Euler(-50 * DEG, 0, -25 * DEG))
    lElbowRots.push(new THREE.Euler(-60 * DEG, 0, 0))
    rElbowRots.push(new THREE.Euler(-60 * DEG, 0, 0))

    // 4 claps
    for (let i = 0; i < 4; i++) {
        const base = 0.5 / speed + i * clapInterval * 2

        // Together
        times.push(base)
        lShoulderRots.push(new THREE.Euler(-50 * DEG, 0, 8 * DEG))
        rShoulderRots.push(new THREE.Euler(-50 * DEG, 0, -8 * DEG))
        lElbowRots.push(new THREE.Euler(-70 * DEG, 0, 0))
        rElbowRots.push(new THREE.Euler(-70 * DEG, 0, 0))

        // Apart
        times.push(base + clapInterval)
        lShoulderRots.push(new THREE.Euler(-50 * DEG, 0, 25 * DEG))
        rShoulderRots.push(new THREE.Euler(-50 * DEG, 0, -25 * DEG))
        lElbowRots.push(new THREE.Euler(-55 * DEG, 0, 0))
        rElbowRots.push(new THREE.Euler(-55 * DEG, 0, 0))
    }

    // Return to rest
    times.push(duration)
    lShoulderRots.push(new THREE.Euler(0, 0, 0))
    rShoulderRots.push(new THREE.Euler(0, 0, 0))
    lElbowRots.push(new THREE.Euler(0, 0, 0))
    rElbowRots.push(new THREE.Euler(0, 0, 0))

    const tracks: THREE.KeyframeTrack[] = [
        quatTrack('L_Shoulder', times, lShoulderRots),
        quatTrack('R_Shoulder', times, rShoulderRots),
        quatTrack('L_Elbow', times, lElbowRots),
        quatTrack('R_Elbow', times, rElbowRots),
    ]

    return new THREE.AnimationClip('Clap', duration, tracks)
}

// ═══════════════════════════════════════════════════════════════
//  MOTION LIBRARY — All available presets
// ═══════════════════════════════════════════════════════════════
export const MOTION_PRESETS: MotionPreset[] = [
    {
        name: 'Walk',
        category: 'locomotion',
        description: 'Natural bipedal walk cycle with arm swing',
        icon: '🚶',
        params: [
            { name: 'speed', label: 'Speed', min: 0.5, max: 2, default: 1, step: 0.1 },
            { name: 'stride', label: 'Stride', min: 0.3, max: 1.5, default: 1, step: 0.1 },
            { name: 'armSwing', label: 'Arm Swing', min: 0, max: 2, default: 1, step: 0.1 },
        ],
        generate: generateWalkCycle,
    },
    {
        name: 'Run',
        category: 'locomotion',
        description: 'Running gait with pumping arms and higher knees',
        icon: '🏃',
        params: [
            { name: 'speed', label: 'Speed', min: 1, max: 3, default: 1.5, step: 0.1 },
            { name: 'intensity', label: 'Intensity', min: 0.5, max: 1.5, default: 1, step: 0.1 },
        ],
        generate: generateRunCycle,
    },
    {
        name: 'Idle',
        category: 'idle',
        description: 'Subtle breathing and weight shift loop',
        icon: '🧘',
        params: [
            { name: 'breathRate', label: 'Breath Rate', min: 0.5, max: 2, default: 1, step: 0.1 },
            { name: 'sway', label: 'Body Sway', min: 0, max: 2, default: 1, step: 0.1 },
        ],
        generate: generateIdle,
    },
    {
        name: 'Wave',
        category: 'gesture',
        description: 'Friendly wave with one hand',
        icon: '👋',
        params: [
            { name: 'hand', label: 'Hand (0=R, 1=L)', min: 0, max: 1, default: 0, step: 1 },
            { name: 'speed', label: 'Speed', min: 0.5, max: 2, default: 1, step: 0.1 },
        ],
        generate: generateWave,
    },
    {
        name: 'Jump',
        category: 'action',
        description: 'Squat, jump, and land with arm raise',
        icon: '🦘',
        params: [
            { name: 'height', label: 'Height', min: 0.3, max: 2, default: 1, step: 0.1 },
        ],
        generate: generateJump,
    },
    {
        name: 'Look Around',
        category: 'idle',
        description: 'Head and chest turn to look left and right',
        icon: '👀',
        params: [
            { name: 'range', label: 'Turn Range', min: 0.3, max: 1.5, default: 1, step: 0.1 },
        ],
        generate: generateLookAround,
    },
    {
        name: 'Clap',
        category: 'gesture',
        description: 'Raise hands and clap four times',
        icon: '👏',
        params: [
            { name: 'speed', label: 'Speed', min: 0.5, max: 2, default: 1, step: 0.1 },
        ],
        generate: generateClap,
    },
]

/** Get all presets for a category */
export function getPresetsByCategory(category: MotionPreset['category']): MotionPreset[] {
    return MOTION_PRESETS.filter(p => p.category === category)
}

/** Generate a clip with default params */
export function generateDefaultClip(presetName: string): THREE.AnimationClip | null {
    const preset = MOTION_PRESETS.find(p => p.name === presetName)
    if (!preset) return null
    const defaults: Record<string, number> = {}
    for (const param of preset.params) {
        defaults[param.name] = param.default
    }
    return preset.generate(defaults)
}
