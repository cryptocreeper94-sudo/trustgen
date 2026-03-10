/* ====== TrustGen — Mesh Construction Utilities ======
 * Foundation layer for all procedural generators.
 * Provides subdivision, spline lathes, noise displacement,
 * mesh merging, and UV mapping — all pure Three.js.
 *
 * NO external dependencies beyond three.
 */
import * as THREE from 'three'
import type { Point2, Point3, CrossSection, ProfileCurve } from './GeneratorTypes'

// ══════════════════════════════════════════
//  NOISE — Simplex-style value noise for displacement
// ══════════════════════════════════════════

/** Seeded pseudo-random number generator (Mulberry32) */
function mulberry32(seed: number): () => number {
    return () => {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed)
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
        return ((t ^ t >>> 14) >>> 0) / 4294967296
    }
}

/** Simple 3D gradient noise (hash-based, deterministic) */
function hash3(x: number, y: number, z: number): number {
    let h = (x * 374761393 + y * 668265263 + z * 1274126177) | 0
    h = (h ^ (h >> 13)) * 1274126177
    return ((h ^ (h >> 16)) >>> 0) / 4294967296
}

/** Smooth interpolation */
function smoothstep(t: number): number {
    return t * t * (3 - 2 * t)
}

/** 3D value noise with smooth interpolation */
export function noise3D(x: number, y: number, z: number): number {
    const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z)
    const fx = x - ix, fy = y - iy, fz = z - iz
    const sx = smoothstep(fx), sy = smoothstep(fy), sz = smoothstep(fz)

    const n000 = hash3(ix, iy, iz)
    const n100 = hash3(ix + 1, iy, iz)
    const n010 = hash3(ix, iy + 1, iz)
    const n110 = hash3(ix + 1, iy + 1, iz)
    const n001 = hash3(ix, iy, iz + 1)
    const n101 = hash3(ix + 1, iy, iz + 1)
    const n011 = hash3(ix, iy + 1, iz + 1)
    const n111 = hash3(ix + 1, iy + 1, iz + 1)

    const nx00 = n000 + sx * (n100 - n000)
    const nx10 = n010 + sx * (n110 - n010)
    const nx01 = n001 + sx * (n101 - n001)
    const nx11 = n011 + sx * (n111 - n011)

    const nxy0 = nx00 + sy * (nx10 - nx00)
    const nxy1 = nx01 + sy * (nx11 - nx01)

    return nxy0 + sz * (nxy1 - nxy0)
}

/** Fractal brownian motion — layered noise for natural-looking variation */
export function fbm(x: number, y: number, z: number, octaves = 4, lacunarity = 2, gain = 0.5): number {
    let value = 0, amplitude = 1, frequency = 1, maxValue = 0
    for (let i = 0; i < octaves; i++) {
        value += noise3D(x * frequency, y * frequency, z * frequency) * amplitude
        maxValue += amplitude
        amplitude *= gain
        frequency *= lacunarity
    }
    return value / maxValue
}

// ══════════════════════════════════════════
//  SPLINE INTERPOLATION — Catmull-Rom
// ══════════════════════════════════════════

/** Evaluate a Catmull-Rom spline at parameter t (0–1) given control points */
export function catmullRom(points: Point2[], t: number, tension = 0.5): Point2 {
    const n = points.length
    if (n < 2) return points[0] || { x: 0, y: 0 }

    const totalSegments = n - 1
    const segFloat = t * totalSegments
    const seg = Math.min(Math.floor(segFloat), totalSegments - 1)
    const localT = segFloat - seg

    // Get four points with clamped indices
    const p0 = points[Math.max(0, seg - 1)]
    const p1 = points[seg]
    const p2 = points[Math.min(n - 1, seg + 1)]
    const p3 = points[Math.min(n - 1, seg + 2)]

    const t2 = localT * localT
    const t3 = t2 * localT

    const s = (1 - tension) / 2

    return {
        x: s * (-t3 + 2 * t2 - localT) * p0.x + (s * (-t3 + t2) + (2 * t3 - 3 * t2 + 1)) * p1.x +
            (s * (t3 - 2 * t2 + localT) + (-2 * t3 + 3 * t2)) * p2.x + s * (t3 - t2) * p3.x,
        y: s * (-t3 + 2 * t2 - localT) * p0.y + (s * (-t3 + t2) + (2 * t3 - 3 * t2 + 1)) * p1.y +
            (s * (t3 - 2 * t2 + localT) + (-2 * t3 + 3 * t2)) * p2.y + s * (t3 - t2) * p3.y,
    }
}

/** Evaluate a 3D Catmull-Rom spline */
export function catmullRom3D(points: Point3[], t: number, tension = 0.5): Point3 {
    const n = points.length
    if (n < 2) return points[0] || { x: 0, y: 0, z: 0 }

    const totalSegments = n - 1
    const segFloat = t * totalSegments
    const seg = Math.min(Math.floor(segFloat), totalSegments - 1)
    const localT = segFloat - seg

    const p0 = points[Math.max(0, seg - 1)]
    const p1 = points[seg]
    const p2 = points[Math.min(n - 1, seg + 1)]
    const p3 = points[Math.min(n - 1, seg + 2)]

    const t2 = localT * localT
    const t3 = t2 * localT
    const s = (1 - tension) / 2

    return {
        x: s * (-t3 + 2 * t2 - localT) * p0.x + (s * (-t3 + t2) + (2 * t3 - 3 * t2 + 1)) * p1.x +
            (s * (t3 - 2 * t2 + localT) + (-2 * t3 + 3 * t2)) * p2.x + s * (t3 - t2) * p3.x,
        y: s * (-t3 + 2 * t2 - localT) * p0.y + (s * (-t3 + t2) + (2 * t3 - 3 * t2 + 1)) * p1.y +
            (s * (t3 - 2 * t2 + localT) + (-2 * t3 + 3 * t2)) * p2.y + s * (t3 - t2) * p3.y,
        z: s * (-t3 + 2 * t2 - localT) * p0.z + (s * (-t3 + t2) + (2 * t3 - 3 * t2 + 1)) * p1.z +
            (s * (t3 - 2 * t2 + localT) + (-2 * t3 + 3 * t2)) * p2.z + s * (t3 - t2) * p3.z,
    }
}

/** Sample N points along a Catmull-Rom spline */
export function sampleSpline(points: Point2[], samples: number, tension?: number): Point2[] {
    const result: Point2[] = []
    for (let i = 0; i < samples; i++) {
        result.push(catmullRom(points, i / (samples - 1), tension))
    }
    return result
}

/** Sample N points along a 3D Catmull-Rom spline */
export function sampleSpline3D(points: Point3[], samples: number, tension?: number): Point3[] {
    const result: Point3[] = []
    for (let i = 0; i < samples; i++) {
        result.push(catmullRom3D(points, i / (samples - 1), tension))
    }
    return result
}

// ══════════════════════════════════════════
//  LATHE GENERATOR — Revolve a profile curve
// ══════════════════════════════════════════

/**
 * Create a lathe geometry from a profile curve.
 * Profile points define (radius, height) — rotated around the Y axis.
 * 
 * @param profile - Array of {x: radius, y: height} points
 * @param segments - Number of angular segments (higher = smoother)
 * @param phiStart - Starting angle (radians, default 0)
 * @param phiLength - Arc length (radians, default 2π for full revolution)
 */
export function createLatheGeometry(
    profile: Point2[],
    segments = 24,
    phiStart = 0,
    phiLength = Math.PI * 2,
): THREE.BufferGeometry {
    // Convert to THREE.Vector2 array for THREE.LatheGeometry
    const points = profile.map(p => new THREE.Vector2(p.x, p.y))
    const geometry = new THREE.LatheGeometry(points, segments, phiStart, phiLength)
    geometry.computeVertexNormals()
    return geometry
}

/**
 * Create a lathe geometry from a spline profile (smoother).
 * Takes sparse control points, interpolates via Catmull-Rom, then lathes.
 */
export function createSplineLatheGeometry(
    controlPoints: Point2[],
    profileSamples = 32,
    segments = 24,
    phiStart = 0,
    phiLength = Math.PI * 2,
): THREE.BufferGeometry {
    const smoothProfile = sampleSpline(controlPoints, profileSamples)
    return createLatheGeometry(smoothProfile, segments, phiStart, phiLength)
}

// ══════════════════════════════════════════
//  LOFT / SWEEP — Extrude cross-sections along a spine
// ══════════════════════════════════════════

/**
 * Loft a shape along a spine curve by placing cross-sections at intervals.
 * Creates organic body shapes for creatures and characters.
 *
 * @param spinePath - 3D spline control points defining the central path
 * @param crossSections - Radius definitions at positions along the spine
 * @param spineSegments - Number of segments along the spine
 * @param radialSegments - Number of segments around each cross-section
 */
export function createLoftGeometry(
    spinePath: Point3[],
    crossSections: CrossSection[],
    spineSegments = 32,
    radialSegments = 16,
): THREE.BufferGeometry {
    const vertices: number[] = []
    const normals: number[] = []
    const uvs: number[] = []
    const indices: number[] = []

    // Sort cross-sections by t
    const sorted = [...crossSections].sort((a, b) => a.t - b.t)

    // Sample radii along spine via interpolation
    function getRadiusAt(t: number): { rx: number; ry: number } {
        // Find the two bounding cross-sections
        let lower = sorted[0], upper = sorted[sorted.length - 1]
        for (let i = 0; i < sorted.length - 1; i++) {
            if (t >= sorted[i].t && t <= sorted[i + 1].t) {
                lower = sorted[i]
                upper = sorted[i + 1]
                break
            }
        }
        const range = upper.t - lower.t
        const localT = range > 0 ? (t - lower.t) / range : 0
        const r = lower.radius + (upper.radius - lower.radius) * localT

        const lSquash = lower.squash || { x: 1, y: 1 }
        const uSquash = upper.squash || { x: 1, y: 1 }
        return {
            rx: r * (lSquash.x + (uSquash.x - lSquash.x) * localT),
            ry: r * (lSquash.y + (uSquash.y - lSquash.y) * localT),
        }
    }

    // Build rings along the spine
    for (let i = 0; i <= spineSegments; i++) {
        const t = i / spineSegments
        const pos = catmullRom3D(spinePath, t)
        const { rx, ry } = getRadiusAt(t)

        // Compute tangent for orientation
        const tNext = Math.min(1, t + 0.001)
        const tPrev = Math.max(0, t - 0.001)
        const pNext = catmullRom3D(spinePath, tNext)
        const pPrev = catmullRom3D(spinePath, tPrev)

        const tangent = new THREE.Vector3(
            pNext.x - pPrev.x, pNext.y - pPrev.y, pNext.z - pPrev.z,
        ).normalize()

        // Create a frame (Frenet-like) around the tangent
        const up = Math.abs(tangent.y) < 0.99
            ? new THREE.Vector3(0, 1, 0)
            : new THREE.Vector3(1, 0, 0)
        const right = new THREE.Vector3().crossVectors(up, tangent).normalize()
        const localUp = new THREE.Vector3().crossVectors(tangent, right).normalize()

        for (let j = 0; j <= radialSegments; j++) {
            const angle = (j / radialSegments) * Math.PI * 2
            const cos = Math.cos(angle)
            const sin = Math.sin(angle)

            const vx = pos.x + right.x * cos * rx + localUp.x * sin * ry
            const vy = pos.y + right.y * cos * rx + localUp.y * sin * ry
            const vz = pos.z + right.z * cos * rx + localUp.z * sin * ry

            vertices.push(vx, vy, vz)

            // Normal points outward from spine center
            const nx = right.x * cos * rx + localUp.x * sin * ry
            const ny = right.y * cos * rx + localUp.y * sin * ry
            const nz = right.z * cos * rx + localUp.z * sin * ry
            const nl = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
            normals.push(nx / nl, ny / nl, nz / nl)

            uvs.push(j / radialSegments, i / spineSegments)
        }
    }

    // Build triangle indices
    for (let i = 0; i < spineSegments; i++) {
        for (let j = 0; j < radialSegments; j++) {
            const a = i * (radialSegments + 1) + j
            const b = a + 1
            const c = (i + 1) * (radialSegments + 1) + j
            const d = c + 1
            indices.push(a, c, b, b, c, d)
        }
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
}

// ══════════════════════════════════════════
//  DISPLACEMENT — Apply noise to geometry
// ══════════════════════════════════════════

/**
 * Displace geometry vertices along their normals using noise.
 * Creates organic, natural-looking surfaces from smooth primitives.
 */
export function displaceGeometry(
    geometry: THREE.BufferGeometry,
    amplitude: number,
    frequency = 2,
    octaves = 3,
    seed = 0,
): THREE.BufferGeometry {
    const positions = geometry.getAttribute('position')
    const normals = geometry.getAttribute('normal')

    if (!normals) geometry.computeVertexNormals()
    const norms = geometry.getAttribute('normal')

    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i) + seed * 100
        const y = positions.getY(i) + seed * 200
        const z = positions.getZ(i) + seed * 300

        const displacement = (fbm(x * frequency, y * frequency, z * frequency, octaves) - 0.5) * 2 * amplitude

        positions.setXYZ(
            i,
            positions.getX(i) + norms.getX(i) * displacement,
            positions.getY(i) + norms.getY(i) * displacement,
            positions.getZ(i) + norms.getZ(i) * displacement,
        )
    }

    positions.needsUpdate = true
    geometry.computeVertexNormals()
    return geometry
}

// ══════════════════════════════════════════
//  MESH MERGING — Combine geometries
// ══════════════════════════════════════════

/**
 * Merge multiple meshes into a single BufferGeometry.
 * Applies world transforms before merging for correct positioning.
 */
export function mergeGeometries(meshes: THREE.Mesh[]): THREE.BufferGeometry {
    const geometries: THREE.BufferGeometry[] = []

    for (const mesh of meshes) {
        mesh.updateMatrixWorld(true)
        const geo = mesh.geometry.clone()
        geo.applyMatrix4(mesh.matrixWorld)
        geometries.push(geo)
    }

    // Manual merge — combine all position/normal/uv arrays
    let totalVerts = 0, totalIndices = 0
    for (const geo of geometries) {
        totalVerts += geo.getAttribute('position').count
        totalIndices += geo.index ? geo.index.count : geo.getAttribute('position').count
    }

    const positions = new Float32Array(totalVerts * 3)
    const normals = new Float32Array(totalVerts * 3)
    const uvArray = new Float32Array(totalVerts * 2)
    const indices: number[] = []

    let vertOffset = 0, idxOffset = 0
    for (const geo of geometries) {
        const pos = geo.getAttribute('position')
        const norm = geo.getAttribute('normal')
        const uv = geo.getAttribute('uv')

        for (let i = 0; i < pos.count; i++) {
            positions[(vertOffset + i) * 3] = pos.getX(i)
            positions[(vertOffset + i) * 3 + 1] = pos.getY(i)
            positions[(vertOffset + i) * 3 + 2] = pos.getZ(i)

            if (norm) {
                normals[(vertOffset + i) * 3] = norm.getX(i)
                normals[(vertOffset + i) * 3 + 1] = norm.getY(i)
                normals[(vertOffset + i) * 3 + 2] = norm.getZ(i)
            }

            if (uv) {
                uvArray[(vertOffset + i) * 2] = uv.getX(i)
                uvArray[(vertOffset + i) * 2 + 1] = uv.getY(i)
            }
        }

        if (geo.index) {
            for (let i = 0; i < geo.index.count; i++) {
                indices.push(geo.index.getX(i) + vertOffset)
            }
        } else {
            for (let i = 0; i < pos.count; i++) {
                indices.push(vertOffset + i)
            }
        }

        vertOffset += pos.count
    }

    const merged = new THREE.BufferGeometry()
    merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    merged.setAttribute('uv', new THREE.Float32BufferAttribute(uvArray, 2))
    merged.setIndex(indices)
    merged.computeVertexNormals()
    return merged
}

// ══════════════════════════════════════════
//  TAPERED LIMB — Common pattern for arms, legs, tails
// ══════════════════════════════════════════

/**
 * Create a tapered organic limb shape.
 * Wider at the base, narrower at the tip, with adjustable bulge.
 */
export function createTaperedLimb(
    length: number,
    baseRadius: number,
    tipRadius: number,
    bulge = 0,
    segments = 12,
    radialSegments = 12,
): THREE.BufferGeometry {
    const profile: Point2[] = []

    for (let i = 0; i <= segments; i++) {
        const t = i / segments
        const y = t * length

        // Linear taper with optional midpoint bulge
        let r = baseRadius + (tipRadius - baseRadius) * t

        // Add organic bulge at mid-section (like a muscle)
        if (bulge > 0) {
            const bulgeT = Math.sin(t * Math.PI)
            r += bulge * baseRadius * bulgeT
        }

        profile.push({ x: Math.max(0.001, r), y })
    }

    return createLatheGeometry(profile, radialSegments)
}

// ══════════════════════════════════════════
//  PROCEDURAL ROCKS — Noise-displaced icosahedrons
// ══════════════════════════════════════════

/**
 * Generate a natural-looking rock mesh.
 */
export function createRockGeometry(
    size: number,
    roughness: number,
    jaggedness: number,
    seed = 42,
    detail = 2,
): THREE.BufferGeometry {
    const geometry = new THREE.IcosahedronGeometry(size, detail)

    // Apply noise displacement
    const amplitude = size * roughness * 0.4
    const frequency = 1 + jaggedness * 3

    displaceGeometry(geometry, amplitude, frequency, 3 + Math.floor(jaggedness * 2), seed)

    // Flatten bottom slightly so rocks sit on ground
    const positions = geometry.getAttribute('position')
    for (let i = 0; i < positions.count; i++) {
        const y = positions.getY(i)
        if (y < -size * 0.3) {
            positions.setY(i, -size * 0.3 + (y + size * 0.3) * 0.3)
        }
    }

    positions.needsUpdate = true
    geometry.computeVertexNormals()
    return geometry
}

// ══════════════════════════════════════════
//  UV PROJECTION HELPERS
// ══════════════════════════════════════════

/** Apply cylindrical UV mapping to a geometry */
export function applyCylindricalUV(geometry: THREE.BufferGeometry): void {
    const positions = geometry.getAttribute('position')
    const uvs = new Float32Array(positions.count * 2)

    let minY = Infinity, maxY = -Infinity
    for (let i = 0; i < positions.count; i++) {
        minY = Math.min(minY, positions.getY(i))
        maxY = Math.max(maxY, positions.getY(i))
    }
    const rangeY = maxY - minY || 1

    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const z = positions.getZ(i)

        uvs[i * 2] = (Math.atan2(z, x) / (Math.PI * 2)) + 0.5
        uvs[i * 2 + 1] = (y - minY) / rangeY
    }

    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
}

/** Apply spherical UV mapping */
export function applySphericalUV(geometry: THREE.BufferGeometry): void {
    const positions = geometry.getAttribute('position')
    const uvs = new Float32Array(positions.count * 2)

    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i)
        const y = positions.getY(i)
        const z = positions.getZ(i)
        const r = Math.sqrt(x * x + y * y + z * z) || 1

        uvs[i * 2] = (Math.atan2(z, x) / (Math.PI * 2)) + 0.5
        uvs[i * 2 + 1] = Math.asin(Math.max(-1, Math.min(1, y / r))) / Math.PI + 0.5
    }

    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
}

// ══════════════════════════════════════════
//  MATERIAL HELPERS
// ══════════════════════════════════════════

/** Create a standard material with defaults */
export function mat(color: string, metalness = 0, roughness = 0.7): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color,
        metalness,
        roughness,
        side: THREE.DoubleSide,
    })
}

/** Create a material with emissive glow */
export function glowMat(color: string, emissiveIntensity = 1): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color,
        emissive: color,
        emissiveIntensity,
        metalness: 0,
        roughness: 0.4,
    })
}

/** Create a transparent material */
export function glassMat(color: string, opacity = 0.5): THREE.MeshStandardMaterial {
    return new THREE.MeshStandardMaterial({
        color,
        metalness: 0.1,
        roughness: 0.05,
        opacity,
        transparent: true,
        side: THREE.DoubleSide,
    })
}

// ══════════════════════════════════════════
//  BRANCHING — L-System for trees and plants
// ══════════════════════════════════════════

export interface BranchSegment {
    start: THREE.Vector3
    end: THREE.Vector3
    radius: number
    depth: number
}

/**
 * Generate a branching structure using recursive L-system-style rules.
 * Returns an array of branch segments to be meshed.
 */
export function generateBranches(
    origin: THREE.Vector3,
    direction: THREE.Vector3,
    length: number,
    radius: number,
    depth: number,
    maxDepth: number,
    branchesPerLevel: number,
    branchAngle: number,
    lengthDecay = 0.7,
    radiusDecay = 0.6,
    seed = 42,
): BranchSegment[] {
    if (depth > maxDepth || radius < 0.005) return []

    const rng = mulberry32(seed + depth * 1000 + Math.round(origin.x * 100))

    const segments: BranchSegment[] = []
    const end = origin.clone().add(direction.clone().multiplyScalar(length))
    segments.push({ start: origin.clone(), end: end.clone(), radius, depth })

    if (depth < maxDepth) {
        const childLength = length * lengthDecay * (0.8 + rng() * 0.4)
        const childRadius = radius * radiusDecay

        for (let i = 0; i < branchesPerLevel; i++) {
            // Distribute branches around the trunk with some randomness
            const baseAngle = (i / branchesPerLevel) * Math.PI * 2 + rng() * 0.5
            const pitchAngle = (branchAngle + (rng() - 0.5) * 20) * Math.PI / 180

            // Create branch direction by rotating from trunk direction
            const branchDir = direction.clone()
            const axis = new THREE.Vector3(Math.cos(baseAngle), 0, Math.sin(baseAngle))
            branchDir.applyAxisAngle(axis, pitchAngle)
            branchDir.normalize()

            // Add slight upward bias for natural growth
            branchDir.y = Math.max(branchDir.y, 0.1)
            branchDir.normalize()

            segments.push(...generateBranches(
                end.clone(),
                branchDir,
                childLength,
                childRadius,
                depth + 1,
                maxDepth,
                Math.max(1, branchesPerLevel - 1),
                branchAngle + 5,
                lengthDecay,
                radiusDecay,
                seed + i * 7919 + depth * 131,
            ))
        }
    }

    return segments
}

/**
 * Convert branch segments into Three.js tube meshes.
 */
export function branchesToMesh(
    segments: BranchSegment[],
    material: THREE.Material,
    tubeSegments = 6,
    radialSegments = 6,
): THREE.Group {
    const group = new THREE.Group()

    for (const seg of segments) {
        const dir = seg.end.clone().sub(seg.start)
        const length = dir.length()
        if (length < 0.001) continue

        // Use a cylinder for each branch segment
        const geo = new THREE.CylinderGeometry(
            seg.radius * 0.7,  // top (thinner)
            seg.radius,         // bottom
            length,
            Math.max(4, radialSegments - seg.depth),
        )

        const mesh = new THREE.Mesh(geo, material)

        // Position at midpoint of segment
        const mid = seg.start.clone().add(seg.end).multiplyScalar(0.5)
        mesh.position.copy(mid)

        // Orient along segment direction
        const up = new THREE.Vector3(0, 1, 0)
        const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.normalize())
        mesh.quaternion.copy(quat)

        mesh.castShadow = true
        mesh.receiveShadow = true
        group.add(mesh)
    }

    return group
}

// ══════════════════════════════════════════
//  LEAF / PETAL SHAPES
// ══════════════════════════════════════════

/**
 * Create a leaf or petal shape using a parametric quad with vertex displacement.
 * Returns a flat organic shape that can be bent/curled.
 */
export function createLeafShape(
    length: number,
    width: number,
    curl = 0,
    segments = 8,
): THREE.BufferGeometry {
    const vertices: number[] = []
    const normals: number[] = []
    const uvVertices: number[] = []
    const indices: number[] = []

    for (let i = 0; i <= segments; i++) {
        const t = i / segments
        // Leaf width profile: sinusoidal (widest at 1/3, tapers at tip)
        const widthAt = width * Math.sin(t * Math.PI) * (1 - t * 0.3)
        const y = t * length

        // Curl: bend the leaf backward along its length
        const curlAngle = curl * t * t * Math.PI * 0.5
        const curlOffsetY = Math.cos(curlAngle) * y - y
        const curlOffsetZ = Math.sin(curlAngle) * y

        for (let j = 0; j <= 2; j++) {
            const s = (j / 2) * 2 - 1 // -1 to 1
            const x = s * widthAt
            vertices.push(x, y + curlOffsetY, curlOffsetZ)
            normals.push(0, 0, 1) // Will recompute
            uvVertices.push((s + 1) / 2, t)
        }
    }

    for (let i = 0; i < segments; i++) {
        const row = i * 3
        const nextRow = (i + 1) * 3
        indices.push(row, nextRow, row + 1)
        indices.push(row + 1, nextRow, nextRow + 1)
        indices.push(row + 1, nextRow + 1, row + 2)
        indices.push(row + 2, nextRow + 1, nextRow + 2)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
    geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvVertices, 2))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    return geometry
}

/**
 * Create a flower petal ring — N petals arranged radially.
 */
export function createPetalRing(
    petalCount: number,
    petalLength: number,
    petalWidth: number,
    curl: number,
    material: THREE.Material,
    tiltAngle = 30,
): THREE.Group {
    const group = new THREE.Group()

    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2
        const petalGeo = createLeafShape(petalLength, petalWidth, curl)
        const petal = new THREE.Mesh(petalGeo, material)

        // Position petal at ring edge, tilted outward
        const tilt = tiltAngle * Math.PI / 180
        petal.rotation.set(-Math.PI / 2 + tilt, 0, 0)
        petal.rotation.z = angle
        petal.position.set(
            Math.cos(angle) * petalWidth * 0.2,
            0,
            Math.sin(angle) * petalWidth * 0.2,
        )

        petal.castShadow = true
        group.add(petal)
    }

    return group
}

// ══════════════════════════════════════════
//  SEEDED RNG EXPORT
// ══════════════════════════════════════════

export { mulberry32 }
