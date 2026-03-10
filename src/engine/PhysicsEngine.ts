/* ====== TrustGen — Physics Engine ======
 * Lightweight physics simulation for cinematic effects.
 * Uses Verlet integration — no external dependencies.
 *
 * - Rigid body simulation (gravity, velocity, bounce)
 * - Collision detection (sphere-sphere, sphere-plane)
 * - Cloth/rope simulation (particle springs)
 * - Ragdoll support (constrained rigid bodies)
 * - Force fields (wind, vortex, turbulence, attraction)
 */
import * as THREE from 'three'

// ── Types ──

export interface PhysicsBody {
    id: string
    /** Linked scene node */
    nodeId: string
    /** Position */
    position: THREE.Vector3
    /** Previous position (for Verlet) */
    prevPosition: THREE.Vector3
    /** Velocity (derived, for display only) */
    velocity: THREE.Vector3
    /** Mass (kg) — 0 = static/kinematic */
    mass: number
    /** Bounce coefficient (0–1) */
    restitution: number
    /** Friction coefficient (0–1) */
    friction: number
    /** Collision radius (sphere) */
    radius: number
    /** Is this body static? */
    isStatic: boolean
    /** Is this body affected by gravity? */
    useGravity: boolean
    /** Linear drag (air resistance) */
    drag: number
}

export type ForceFieldType = 'wind' | 'vortex' | 'turbulence' | 'attraction' | 'explosion'

export interface ForceField {
    id: string
    type: ForceFieldType
    position: THREE.Vector3
    /** Direction for directional forces (wind) */
    direction: THREE.Vector3
    /** Strength multiplier */
    strength: number
    /** Radius of effect (0 = infinite) */
    radius: number
    /** Whether this force field is active */
    enabled: boolean
}

export interface SpringConstraint {
    bodyA: string  // body ID
    bodyB: string  // body ID
    restLength: number
    stiffness: number
    damping: number
}

export interface PhysicsWorld {
    bodies: PhysicsBody[]
    forceFields: ForceField[]
    springs: SpringConstraint[]
    gravity: THREE.Vector3
    timeScale: number
    paused: boolean
    /** Ground plane Y level (-Infinity = no ground) */
    groundY: number
    /** Substeps per frame for stability */
    substeps: number
}

// ── Defaults ──

export const DEFAULT_GRAVITY = new THREE.Vector3(0, -9.81, 0)

let bodyCounter = 0
let fieldCounter = 0

export function createPhysicsBody(
    nodeId: string,
    position: THREE.Vector3 = new THREE.Vector3(),
    overrides?: Partial<PhysicsBody>
): PhysicsBody {
    bodyCounter++
    return {
        id: `pb_${Date.now()}_${bodyCounter}`,
        nodeId,
        position: position.clone(),
        prevPosition: position.clone(),
        velocity: new THREE.Vector3(),
        mass: 1,
        restitution: 0.5,
        friction: 0.3,
        radius: 0.5,
        isStatic: false,
        useGravity: true,
        drag: 0.01,
        ...overrides,
    }
}

export function createForceField(type: ForceFieldType, overrides?: Partial<ForceField>): ForceField {
    fieldCounter++
    return {
        id: `ff_${Date.now()}_${fieldCounter}`,
        type,
        position: new THREE.Vector3(),
        direction: new THREE.Vector3(1, 0, 0),
        strength: 5,
        radius: 10,
        enabled: true,
        ...overrides,
    }
}

export function createDefaultWorld(): PhysicsWorld {
    return {
        bodies: [],
        forceFields: [],
        springs: [],
        gravity: DEFAULT_GRAVITY.clone(),
        timeScale: 1,
        paused: false,
        groundY: 0,
        substeps: 4,
    }
}

// ── Verlet Integration ──

const _tmpForce = new THREE.Vector3()
const _tmpDiff = new THREE.Vector3()

/**
 * Step the physics world forward by dt seconds.
 */
export function stepPhysics(world: PhysicsWorld, dt: number): void {
    if (world.paused) return

    const subDt = (dt * world.timeScale) / world.substeps

    for (let sub = 0; sub < world.substeps; sub++) {
        // Apply forces and integrate
        for (const body of world.bodies) {
            if (body.isStatic || body.mass <= 0) continue

            // Accumulate forces
            _tmpForce.set(0, 0, 0)

            // Gravity
            if (body.useGravity) {
                _tmpForce.addScaledVector(world.gravity, body.mass)
            }

            // Force fields
            for (const field of world.forceFields) {
                if (!field.enabled) continue
                applyForceField(body, field, _tmpForce)
            }

            // Drag
            _tmpDiff.copy(body.position).sub(body.prevPosition)
            _tmpForce.addScaledVector(_tmpDiff, -body.drag * body.mass / subDt)

            // Verlet integration: x' = 2x - x_prev + a * dt²
            const ax = _tmpForce.x / body.mass
            const ay = _tmpForce.y / body.mass
            const az = _tmpForce.z / body.mass

            const newX = 2 * body.position.x - body.prevPosition.x + ax * subDt * subDt
            const newY = 2 * body.position.y - body.prevPosition.y + ay * subDt * subDt
            const newZ = 2 * body.position.z - body.prevPosition.z + az * subDt * subDt

            body.prevPosition.copy(body.position)
            body.position.set(newX, newY, newZ)

            // Update derived velocity
            body.velocity.copy(body.position).sub(body.prevPosition).divideScalar(subDt)
        }

        // Spring constraints
        for (const spring of world.springs) {
            solveSprings(world, spring, subDt)
        }

        // Collision detection
        resolveCollisions(world)

        // Ground collision
        if (world.groundY > -Infinity) {
            for (const body of world.bodies) {
                if (body.isStatic) continue
                const groundLevel = world.groundY + body.radius
                if (body.position.y < groundLevel) {
                    body.position.y = groundLevel
                    // Bounce
                    const vy = body.position.y - body.prevPosition.y
                    if (vy < 0) {
                        body.prevPosition.y = body.position.y + vy * body.restitution
                    }
                    // Friction
                    body.prevPosition.x += (body.position.x - body.prevPosition.x) * body.friction * 0.5
                    body.prevPosition.z += (body.position.z - body.prevPosition.z) * body.friction * 0.5
                }
            }
        }
    }
}

// ── Force Fields ──

function applyForceField(body: PhysicsBody, field: ForceField, force: THREE.Vector3): void {
    const diff = _tmpDiff.copy(field.position).sub(body.position)
    const dist = diff.length()

    if (field.radius > 0 && dist > field.radius) return

    const falloff = field.radius > 0 ? Math.max(0, 1 - dist / field.radius) : 1

    switch (field.type) {
        case 'wind':
            force.addScaledVector(field.direction, field.strength * falloff)
            break

        case 'attraction':
            if (dist > 0.01) {
                diff.normalize()
                force.addScaledVector(diff, field.strength * falloff)
            }
            break

        case 'vortex':
            if (dist > 0.01) {
                // Cross product with up vector for tangential force
                const tangent = new THREE.Vector3(-diff.z, 0, diff.x).normalize()
                force.addScaledVector(tangent, field.strength * falloff)
            }
            break

        case 'turbulence': {
            // Pseudo-random turbulent force
            const t = Date.now() * 0.001
            const turb = new THREE.Vector3(
                Math.sin(t * 3.7 + body.position.x * 5) * field.strength,
                Math.cos(t * 2.3 + body.position.y * 5) * field.strength * 0.5,
                Math.sin(t * 4.1 + body.position.z * 5) * field.strength
            )
            force.addScaledVector(turb, falloff)
            break
        }

        case 'explosion':
            if (dist > 0.01) {
                diff.negate().normalize()
                // Explosion decays with square of distance
                const explosionForce = field.strength / (1 + dist * dist)
                force.addScaledVector(diff, explosionForce)
            }
            break
    }
}

// ── Spring Solver ──

function solveSprings(world: PhysicsWorld, spring: SpringConstraint, dt: number): void {
    const bodyA = world.bodies.find(b => b.id === spring.bodyA)
    const bodyB = world.bodies.find(b => b.id === spring.bodyB)
    if (!bodyA || !bodyB) return

    _tmpDiff.copy(bodyB.position).sub(bodyA.position)
    const dist = _tmpDiff.length()
    if (dist < 0.0001) return

    const displacement = dist - spring.restLength
    _tmpDiff.normalize()

    const force = displacement * spring.stiffness

    // Apply damping
    const relVel = bodyB.velocity.clone().sub(bodyA.velocity)
    const dampForce = _tmpDiff.dot(relVel) * spring.damping

    const totalForce = force + dampForce

    if (!bodyA.isStatic) {
        bodyA.position.addScaledVector(_tmpDiff, totalForce * dt * dt / (bodyA.mass > 0 ? bodyA.mass : 1))
    }
    if (!bodyB.isStatic) {
        bodyB.position.addScaledVector(_tmpDiff, -totalForce * dt * dt / (bodyB.mass > 0 ? bodyB.mass : 1))
    }
}

// ── Collision Detection ──

function resolveCollisions(world: PhysicsWorld): void {
    const bodies = world.bodies
    for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
            const a = bodies[i]
            const b = bodies[j]
            if (a.isStatic && b.isStatic) continue

            _tmpDiff.copy(b.position).sub(a.position)
            const dist = _tmpDiff.length()
            const minDist = a.radius + b.radius

            if (dist < minDist && dist > 0.0001) {
                _tmpDiff.normalize()
                const overlap = minDist - dist
                const totalMass = (a.isStatic ? 0 : a.mass) + (b.isStatic ? 0 : b.mass)
                if (totalMass <= 0) continue

                const ratioA = a.isStatic ? 0 : (b.isStatic ? 1 : b.mass / totalMass)
                const ratioB = b.isStatic ? 0 : (a.isStatic ? 1 : a.mass / totalMass)

                if (!a.isStatic) a.position.addScaledVector(_tmpDiff, -overlap * ratioA)
                if (!b.isStatic) b.position.addScaledVector(_tmpDiff, overlap * ratioB)

                // Bounce (adjust previous positions for restitution)
                const avgRestitution = (a.restitution + b.restitution) * 0.5
                const relVel = _tmpDiff.dot(
                    new THREE.Vector3().copy(a.position).sub(a.prevPosition)
                        .sub(new THREE.Vector3().copy(b.position).sub(b.prevPosition))
                )
                if (relVel < 0) {
                    const impulse = relVel * (1 + avgRestitution) * 0.5
                    if (!a.isStatic) a.prevPosition.addScaledVector(_tmpDiff, impulse * ratioA)
                    if (!b.isStatic) b.prevPosition.addScaledVector(_tmpDiff, -impulse * ratioB)
                }
            }
        }
    }
}

// ── Force Field Presets ──

export interface ForceFieldPreset { name: string; icon: string; create: () => ForceField }

export const FORCE_FIELD_PRESETS: ForceFieldPreset[] = [
    { name: 'Wind', icon: '🌬️', create: () => createForceField('wind', { direction: new THREE.Vector3(1, 0, 0), strength: 5 }) },
    { name: 'Vortex', icon: '🌀', create: () => createForceField('vortex', { strength: 8, radius: 5 }) },
    { name: 'Turbulence', icon: '🌊', create: () => createForceField('turbulence', { strength: 3, radius: 8 }) },
    { name: 'Attractor', icon: '🧲', create: () => createForceField('attraction', { strength: 15, radius: 10 }) },
    { name: 'Explosion', icon: '💥', create: () => createForceField('explosion', { strength: 50, radius: 8 }) },
]
