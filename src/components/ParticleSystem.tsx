/* ====== TrustGen — GPU Particle System ====== */
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { ParticleDef, ParticlePreset } from '../types'

const PARTICLE_CONFIGS: Record<ParticlePreset, Partial<ParticleDef>> = {
    fire: { count: 300, speed: 1.5, size: 0.08, colorStart: '#ff6b35', colorEnd: '#ffd93d', spread: 1, lifetime: 1.5 },
    smoke: { count: 150, speed: 0.5, size: 0.2, colorStart: '#666666', colorEnd: '#222222', spread: 2, lifetime: 4 },
    sparkles: { count: 200, speed: 0.8, size: 0.04, colorStart: '#ffd93d', colorEnd: '#ff6b6b', spread: 3, lifetime: 3 },
    rain: { count: 500, speed: 8, size: 0.02, colorStart: '#88bbdd', colorEnd: '#4488bb', spread: 10, lifetime: 2 },
    snow: { count: 400, speed: 0.5, size: 0.03, colorStart: '#ffffff', colorEnd: '#ccddee', spread: 10, lifetime: 8 },
    magic: { count: 250, speed: 0.6, size: 0.05, colorStart: '#a855f7', colorEnd: '#d946ef', spread: 2, lifetime: 3 },
    explosion: { count: 500, speed: 5, size: 0.1, colorStart: '#ff4444', colorEnd: '#ffaa00', spread: 0.5, lifetime: 1 },
    fireflies: { count: 100, speed: 0.3, size: 0.06, colorStart: '#aaff44', colorEnd: '#88cc22', spread: 5, lifetime: 5 },
}

interface Props {
    config: ParticleDef
    position?: [number, number, number]
}

export function ParticleSystem({ config, position = [0, 0, 0] }: Props) {
    const pointsRef = useRef<THREE.Points>(null!)
    const velocitiesRef = useRef<Float32Array>(null!)
    const lifetimesRef = useRef<Float32Array>(null!)
    const maxLifetimesRef = useRef<Float32Array>(null!)

    const count = config.count

    const { geometry, material } = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const colors = new Float32Array(count * 3)
        const sizes = new Float32Array(count)
        const velocities = new Float32Array(count * 3)
        const lifetimes = new Float32Array(count)
        const maxLifetimes = new Float32Array(count)

        const colorStart = new THREE.Color(config.colorStart)
        const colorEnd = new THREE.Color(config.colorEnd)

        for (let i = 0; i < count; i++) {
            // Random starting position within spread
            positions[i * 3] = (Math.random() - 0.5) * config.spread * 0.3
            positions[i * 3 + 1] = Math.random() * config.spread * 0.2
            positions[i * 3 + 2] = (Math.random() - 0.5) * config.spread * 0.3

            // Random velocity
            velocities[i * 3] = (Math.random() - 0.5) * config.speed * 0.5
            velocities[i * 3 + 1] = Math.random() * config.speed
            velocities[i * 3 + 2] = (Math.random() - 0.5) * config.speed * 0.5

            // Random lifetime
            const lt = config.lifetime * (0.5 + Math.random() * 0.5)
            lifetimes[i] = Math.random() * lt // Stagger start
            maxLifetimes[i] = lt

            // Interpolated color
            const t = Math.random()
            const c = colorStart.clone().lerp(colorEnd, t)
            colors[i * 3] = c.r
            colors[i * 3 + 1] = c.g
            colors[i * 3 + 2] = c.b

            sizes[i] = config.size * (0.5 + Math.random() * 0.5)
        }

        velocitiesRef.current = velocities
        lifetimesRef.current = lifetimes
        maxLifetimesRef.current = maxLifetimes

        const geo = new THREE.BufferGeometry()
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
        geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

        const mat = new THREE.PointsMaterial({
            size: config.size,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            sizeAttenuation: true,
        })

        return { geometry: geo, material: mat }
    }, [count, config.colorStart, config.colorEnd, config.speed, config.spread, config.lifetime, config.size])

    useFrame((_, delta) => {
        if (!pointsRef.current) return
        const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute
        const positions = posAttr.array as Float32Array
        const velocities = velocitiesRef.current
        const lifetimes = lifetimesRef.current
        const maxLifetimes = maxLifetimesRef.current

        if (!velocities || !lifetimes || !maxLifetimes) return

        for (let i = 0; i < count; i++) {
            lifetimes[i] += delta * config.speed

            if (lifetimes[i] >= maxLifetimes[i]) {
                // Reset particle
                lifetimes[i] = 0
                positions[i * 3] = (Math.random() - 0.5) * config.spread * 0.3
                positions[i * 3 + 1] = 0
                positions[i * 3 + 2] = (Math.random() - 0.5) * config.spread * 0.3

                velocities[i * 3] = (Math.random() - 0.5) * config.speed * 0.5
                velocities[i * 3 + 1] = Math.random() * config.speed
                velocities[i * 3 + 2] = (Math.random() - 0.5) * config.speed * 0.5
            }

            // Apply velocity
            positions[i * 3] += velocities[i * 3] * delta
            positions[i * 3 + 1] += velocities[i * 3 + 1] * delta
            positions[i * 3 + 2] += velocities[i * 3 + 2] * delta

            // Gravity for some presets
            velocities[i * 3 + 1] -= delta * 0.5
        }

        posAttr.needsUpdate = true
    })

    return (
        <points ref={pointsRef} position={position} geometry={geometry} material={material} />
    )
}

// ── Preset Helper ──
export function getParticleConfig(preset: ParticlePreset): ParticleDef {
    const base = PARTICLE_CONFIGS[preset]
    return {
        preset,
        count: base.count || 200,
        speed: base.speed || 1,
        size: base.size || 0.05,
        colorStart: base.colorStart || '#ffffff',
        colorEnd: base.colorEnd || '#888888',
        spread: base.spread || 3,
        lifetime: base.lifetime || 3,
    }
}
