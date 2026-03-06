/* ====== TrustGen — Skeletal Animation Player ====== */
import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useEngineStore } from '../store'

interface SkeletalAnimationPlayerProps {
    nodeId: string
    scene: THREE.Object3D
    animations: THREE.AnimationClip[]
}

/**
 * Attaches to a model's Object3D and drives skeletal
 * animations via THREE.AnimationMixer. Detects skeleton
 * + clips on mount and stores them in the engine state.
 */
export function SkeletalAnimationPlayer({ nodeId, scene, animations }: SkeletalAnimationPlayerProps) {
    const mixerRef = useRef<THREE.AnimationMixer | null>(null)
    const actionsRef = useRef<THREE.AnimationAction[]>([])
    const updateNode = useEngineStore(s => s.updateNode)

    // Initialize mixer & detect clips on mount
    useEffect(() => {
        if (!scene || animations.length === 0) return

        const mixer = new THREE.AnimationMixer(scene)
        mixerRef.current = mixer

        // Check for skeleton
        let hasRig = false
        scene.traverse((child: THREE.Object3D) => {
            if (child instanceof THREE.SkinnedMesh || child instanceof THREE.Bone) {
                hasRig = true
            }
        })

        // Create actions for all clips
        const actions = animations.map(clip => {
            const action = mixer.clipAction(clip)
            action.setLoop(THREE.LoopRepeat, Infinity)
            return action
        })
        actionsRef.current = actions

        // Store clip info in engine state
        const clipInfos = animations.map(clip => ({
            name: clip.name || 'Unnamed Clip',
            duration: clip.duration,
            trackCount: clip.tracks.length,
        }))

        updateNode(nodeId, {
            skeletalAnim: {
                hasRig,
                clips: clipInfos,
                activeClipIndex: 0,
                playing: true,
                speed: 1,
                loop: true,
                crossfadeDuration: 0.3,
            },
        })

        // Auto-play first clip
        if (actions.length > 0) {
            actions[0].play()
        }

        return () => {
            mixer.stopAllAction()
            mixer.uncacheRoot(scene)
        }
    }, [scene, animations, nodeId, updateNode])

    // React to skeletal animation state changes
    const skeletalAnim = useEngineStore(s => s.nodes[nodeId]?.skeletalAnim)

    useEffect(() => {
        if (!mixerRef.current || !skeletalAnim || actionsRef.current.length === 0) return

        const mixer = mixerRef.current
        const actions = actionsRef.current
        const activeIndex = skeletalAnim.activeClipIndex

        // Update timeScale
        mixer.timeScale = skeletalAnim.speed

        // Handle clip switching with crossfade
        actions.forEach((action, i) => {
            if (i === activeIndex) {
                if (skeletalAnim.playing) {
                    if (!action.isRunning()) {
                        action.reset()
                        action.fadeIn(skeletalAnim.crossfadeDuration)
                        action.play()
                    }
                } else {
                    action.paused = true
                }
                // Update loop mode
                action.setLoop(
                    skeletalAnim.loop ? THREE.LoopRepeat : THREE.LoopOnce,
                    skeletalAnim.loop ? Infinity : 1
                )
                action.clampWhenFinished = !skeletalAnim.loop
            } else {
                if (action.isRunning()) {
                    action.fadeOut(skeletalAnim.crossfadeDuration)
                }
            }
        })
    }, [skeletalAnim?.activeClipIndex, skeletalAnim?.playing, skeletalAnim?.speed, skeletalAnim?.loop])

    // Update mixer each frame
    useFrame((_, delta) => {
        if (mixerRef.current && skeletalAnim?.playing) {
            mixerRef.current.update(delta)
        }
    })

    return null
}
