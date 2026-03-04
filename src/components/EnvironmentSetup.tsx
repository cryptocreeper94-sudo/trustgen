/* ====== TrustGen — Environment Setup ====== */
import { useMemo } from 'react'
import { Environment, ContactShadows, Sky } from '@react-three/drei'
import * as THREE from 'three'
import { useEngineStore } from '../store'

function GradientBackground({ color1, color2 }: { color1: string; color2: string }) {
    const material = useMemo(() => {
        const canvas = document.createElement('canvas')
        canvas.width = 2
        canvas.height = 512
        const ctx = canvas.getContext('2d')!
        const gradient = ctx.createLinearGradient(0, 0, 0, 512)
        gradient.addColorStop(0, color1)
        gradient.addColorStop(1, color2)
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 2, 512)
        const texture = new THREE.CanvasTexture(canvas)
        return new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, depthWrite: false })
    }, [color1, color2])

    return (
        <mesh scale={[80, 80, 80]} renderOrder={-1}>
            <sphereGeometry args={[1, 16, 16]} />
            <primitive object={material} attach="material" />
        </mesh>
    )
}

export function EnvironmentSetup() {
    const env = useEngineStore(s => s.environment)

    return (
        <>
            {/* Base lighting */}
            <ambientLight intensity={0.3} color="#aab4c0" />
            <directionalLight
                position={[8, 12, 5]}
                intensity={1.5}
                color="#ffffff"
                castShadow
                shadow-mapSize-width={2048}
                shadow-mapSize-height={2048}
                shadow-camera-near={0.5}
                shadow-camera-far={50}
                shadow-camera-left={-10}
                shadow-camera-right={10}
                shadow-camera-top={10}
                shadow-camera-bottom={-10}
                shadow-bias={-0.0001}
            />
            <directionalLight position={[-5, 5, -5]} intensity={0.5} color="#88aaff" />
            <hemisphereLight args={['#b1e1ff', '#1a1a2e', 0.6]} />

            {/* Background */}
            {env.type === 'color' && (
                <color attach="background" args={[env.color1]} />
            )}
            {env.type === 'gradient' && (
                <>
                    <color attach="background" args={['#000000']} />
                    <GradientBackground color1={env.color1} color2={env.color2} />
                </>
            )}
            {env.type === 'hdri' && (
                <Environment preset={env.hdriPreset} background />
            )}
            {env.type === 'sky' && (
                <>
                    <Sky distance={450000} sunPosition={[5, 1, 8]} inclination={0} azimuth={0.25} />
                    <Environment preset="sunset" />
                </>
            )}

            {/* Contact Shadows */}
            {env.groundShadow && (
                <ContactShadows
                    position={[0, -0.01, 0]}
                    opacity={0.5}
                    scale={20}
                    blur={2}
                    far={4}
                />
            )}

            {/* Fog */}
            {env.fog && (
                <fog attach="fog" args={[env.fogColor, env.fogNear, env.fogFar]} />
            )}
        </>
    )
}
