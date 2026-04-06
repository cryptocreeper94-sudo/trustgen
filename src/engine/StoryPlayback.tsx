/* ====== TrustGen — Story Playback Engine ======
 * Drives the 3D viewport through Story Mode shots using
 * TrustGen's full procedural generator suite:
 *
 *   - CharacterCreator  → humanoids with faces, hair, clothing
 *   - CreatureGenerator  → quadrupeds, birds, fish, insects
 *   - NatureGenerator    → trees, flowers, plants, rocks
 *   - TextTo3DGenerator  → props (tables, swords, castles, etc.)
 *
 * Architecture:
 *   - Uses useThree().scene to inject THREE.Groups directly
 *   - Bypasses the store for cinematic objects (temporary playback only)
 *   - Swaps scene content per shot
 *   - Plays voice-over audio synced to scenes
 */

import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useStoryStore } from '../stores/storyStore'
import { useEngineStore } from '../store'
import { interpolateCamera, getShotAtTime } from './Sequencer'

// ── Procedural Generators ──
import { buildCharacter, CHARACTER_PRESETS, type CharacterConfig, DEFAULT_CHARACTER } from './CharacterCreator'
import { buildCreature, ALL_CREATURE_PRESETS } from './generators/CreatureGenerator'
import { buildTree, buildRock, buildPlant, TREE_PRESETS, PLANT_PRESETS } from './generators/NatureGenerator'
import { parseDescriptionLocal } from './TextTo3DGenerator'

// Tag for cinematic objects so we can find/remove them
const CINEMATIC_TAG = '__trustgen_cinematic__'

export function StoryPlayback() {
    const { camera, scene } = useThree()
    const savedNodes = useRef<any>(null)
    const savedRootIds = useRef<string[]>([])
    const prevShotIndex = useRef(-1)
    const wasPlaying = useRef(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    const playing = useStoryStore(s => s.playback.playing)

    // ── Playback lifecycle ──
    useEffect(() => {
        if (playing && !wasPlaying.current) {
            // === START ===
            wasPlaying.current = true
            prevShotIndex.current = -1

            const engine = useEngineStore.getState()

            // Save and hide existing scene nodes (don't remove — just hide)
            savedNodes.current = JSON.parse(JSON.stringify(engine.nodes))
            savedRootIds.current = [...engine.rootNodeIds]

            // Hide all existing scene objects
            scene.children.forEach(child => {
                if (child.userData?.__trustgen_scene_node__) {
                    child.visible = false
                }
            })

            // Build persistent cinematic elements
            addCinematicLighting(scene)
            addCinematicGround(scene)
            addCinematicParticles(scene)

            // Build first shot
            buildShotScene(0, scene)

            // Cinematic environment
            engine.updateEnvironment({ type: 'gradient', color1: '#030308', color2: '#08081a', fog: true, fogColor: '#030308', fogNear: 10, fogFar: 60 })
            engine.updateEffect('bloom', { enabled: true, intensity: 1.8, threshold: 0.25 })
            engine.updateEffect('vignette', { enabled: true, darkness: 0.7, offset: 0.3 })

            // Play first audio
            playSceneAudio(0, audioRef)

        } else if (!playing && wasPlaying.current) {
            // === STOP ===
            wasPlaying.current = false

            // Stop audio
            if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }

            // Remove all cinematic objects
            removeCinematicObjects(scene)

            // Unhide scene objects
            scene.children.forEach(child => {
                if (child.userData?.__trustgen_scene_node__) {
                    child.visible = true
                }
            })

            // Restore environment
            const engine = useEngineStore.getState()
            engine.updateEnvironment({ type: 'gradient', color1: '#0a0a1a', color2: '#1a1a2e', fog: false })
            engine.updateEffect('bloom', { enabled: true, intensity: 0.5, threshold: 0.8 })
            engine.updateEffect('vignette', { enabled: true, darkness: 0.4, offset: 0.5 })
        }
    }, [playing, scene])

    // ── Per-frame camera driver ──
    useFrame((_state, delta) => {
        const store = useStoryStore.getState()
        const { playback, shots } = store
        if (!playback.playing || !shots.length) return

        const newTime = playback.currentTime + delta
        if (newTime >= playback.totalDuration) { store.stopPlayback(); return }

        const { shotIndex, localTime } = getShotAtTime(shots, newTime)
        const shot = shots[shotIndex]
        if (!shot) return

        // Interpolate camera
        const cam = interpolateCamera(shot, localTime)
        camera.position.set(cam.position.x, cam.position.y, cam.position.z)
        camera.lookAt(cam.lookAt.x, cam.lookAt.y, cam.lookAt.z)
        if ('fov' in camera && cam.fov) {
            (camera as any).fov = cam.fov;
            (camera as any).updateProjectionMatrix()
        }

        // On shot change → swap scene + audio
        if (shotIndex !== prevShotIndex.current) {
            prevShotIndex.current = shotIndex

            // Remove previous shot objects (keep persistent lights/ground/particles)
            removeShotObjects(scene)

            // Build new shot scene
            buildShotScene(shotIndex, scene)

            // Play audio
            playSceneAudio(shotIndex, audioRef)

            // Dynamic bloom
            const ci = Math.max(0, shotIndex - 1)
            const comps = store.compositions
            if (comps[ci]) {
                const mood = comps[ci].lighting.mood
                useEngineStore.getState().updateEffect('bloom', {
                    enabled: true,
                    intensity: mood === 'dramatic' ? 2.5 : mood === 'ethereal' ? 1.8 : 1.2,
                    threshold: 0.25,
                })
            }
        }

        // Animate particles
        animateParticles(scene, newTime)

        useStoryStore.setState(s => ({
            playback: { ...s.playback, currentTime: newTime, activeShotIndex: shotIndex }
        }))
    })

    return null
}

// ═══════════════════════════════════════════════════════
//  PERSISTENT CINEMATIC ELEMENTS
// ═══════════════════════════════════════════════════════

function tag(obj: THREE.Object3D, subTag?: string) {
    obj.userData[CINEMATIC_TAG] = true
    if (subTag) obj.userData.__cinematic_sub__ = subTag
}

function addCinematicLighting(scene: THREE.Scene) {
    // Key light — warm white spot from upper right
    const key = new THREE.SpotLight('#f0e6d4', 5, 30, 0.5, 0.7, 2)
    key.position.set(5, 10, 5)
    key.castShadow = true
    key.shadow.mapSize.set(2048, 2048)
    key.name = '🎬 Key Light'
    tag(key, 'persistent')
    scene.add(key)

    // Fill — cool cyan from left
    const fill = new THREE.PointLight('#06b6d4', 2.5, 25, 2)
    fill.position.set(-6, 5, -3)
    fill.name = '🎬 Fill Light'
    tag(fill, 'persistent')
    scene.add(fill)

    // Rim — purple backlight
    const rim = new THREE.PointLight('#8b5cf6', 2, 20, 2)
    rim.position.set(0, 4, -8)
    rim.name = '🎬 Rim Light'
    tag(rim, 'persistent')
    scene.add(rim)

    // Ambient — very dim
    const amb = new THREE.AmbientLight('#0a0a20', 0.4)
    amb.name = '🎬 Ambient'
    tag(amb, 'persistent')
    scene.add(amb)
}

function addCinematicGround(scene: THREE.Scene) {
    const geo = new THREE.PlaneGeometry(50, 50)
    const mat = new THREE.MeshStandardMaterial({
        color: '#080810',
        metalness: 0.95,
        roughness: 0.05,
        emissive: new THREE.Color('#06b6d4'),
        emissiveIntensity: 0.015,
        transparent: true,
        opacity: 0.9,
    })
    const ground = new THREE.Mesh(geo, mat)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    ground.name = '🎬 Ground'
    tag(ground, 'persistent')
    scene.add(ground)
}

function addCinematicParticles(scene: THREE.Scene) {
    const group = new THREE.Group()
    group.name = '🎬 Particles'
    tag(group, 'persistent')

    const colors = [0x06b6d4, 0x8b5cf6, 0x14b8a6, 0x22d3ee]
    for (let i = 0; i < 24; i++) {
        const size = 0.02 + Math.random() * 0.05
        const geo = new THREE.SphereGeometry(size, 6, 6)
        const mat = new THREE.MeshBasicMaterial({
            color: colors[i % colors.length],
            transparent: true,
            opacity: 0.4 + Math.random() * 0.3,
        })
        const sphere = new THREE.Mesh(geo, mat)
        const angle = (i / 24) * Math.PI * 2
        const r = 5 + Math.random() * 8
        sphere.position.set(
            Math.cos(angle) * r,
            0.5 + Math.random() * 6,
            Math.sin(angle) * r,
        )
        sphere.userData.__particle_base_y__ = sphere.position.y
        sphere.userData.__particle_speed__ = 0.3 + Math.random() * 0.5
        sphere.userData.__particle_offset__ = Math.random() * Math.PI * 2
        group.add(sphere)
    }
    scene.add(group)
}

function animateParticles(scene: THREE.Scene, time: number) {
    scene.traverse(obj => {
        if (obj.userData.__particle_base_y__ !== undefined) {
            const baseY = obj.userData.__particle_base_y__
            const speed = obj.userData.__particle_speed__
            const offset = obj.userData.__particle_offset__
            obj.position.y = baseY + Math.sin(time * speed + offset) * 0.3
        }
    })
}

// ═══════════════════════════════════════════════════════
//  SHOT SCENE BUILDING (uses real generators)
// ═══════════════════════════════════════════════════════

function buildShotScene(shotIndex: number, scene: THREE.Scene) {
    const { compositions, timeline } = useStoryStore.getState()
    const sceneIndex = Math.max(0, shotIndex - 1)
    const sceneData = timeline?.scenes?.[sceneIndex]
    const comp = compositions[sceneIndex]

    if (!sceneData && !comp) return

    const text = (sceneData?.text || '').toLowerCase()
    let xCursor = 0 // horizontal placement cursor

    // ── 1. CHARACTERS ──
    // Match character presets from text
    const charMatches = matchCharacters(text)

    // Also use composition characters
    if (comp) {
        comp.characters.forEach(char => {
            const name = char.name.toLowerCase()
            if (!charMatches.find(c => c.config.name?.toLowerCase() === name)) {
                charMatches.push({ config: matchCharacterPreset(name), x: char.position.x })
            }
        })
    }

    charMatches.forEach((match, idx) => {
        const x = match.x ?? (idx * 2.5 - (charMatches.length - 1) * 1.25)
        const group = buildCharacter({ ...match.config, height: match.config.height || 1 })
        group.position.set(x, 0, 0)
        tag(group, 'shot')
        scene.add(group)
        xCursor = Math.max(xCursor, Math.abs(x) + 2)
    })

    // ── 2. CREATURES ──
    const creatureMatches = matchCreatures(text)
    creatureMatches.forEach((config, idx) => {
        const group = buildCreature(config)
        group.position.set(xCursor + idx * 3, 0, -2)
        tag(group, 'shot')
        scene.add(group)
    })

    // ── 3. NATURE ──
    const natureItems = matchNature(text)
    natureItems.forEach((item, idx) => {
        item.position.set(-xCursor - 2 - idx * 2.5, 0, -1 - Math.random() * 3)
        tag(item, 'shot')
        scene.add(item)
    })

    // ── 4. PROPS (from TextTo3DGenerator templates) ──
    const propItems = matchProps(text)
    propItems.forEach((item, idx) => {
        item.position.set(idx * 1.5 - propItems.length * 0.75, 0, 2 + Math.random() * 2)
        tag(item, 'shot')
        scene.add(item)
    })

    // ── 5. ENVIRONMENT ROCKS ──
    // Add scatter rocks for atmosphere
    for (let i = 0; i < 3; i++) {
        const rock = buildRock({
            type: 'rock', sizeCategory: 'stone',
            size: 0.1 + Math.random() * 0.2,
            roughness: 0.5, jaggedness: 0.4,
            color: '#3a3a3a', mossy: Math.random() > 0.5,
            seed: shotIndex * 100 + i,
        })
        const angle = Math.random() * Math.PI * 2
        const r = 3 + Math.random() * 5
        rock.position.set(Math.cos(angle) * r, 0, Math.sin(angle) * r)
        tag(rock, 'shot')
        scene.add(rock)
    }
}

// ═══════════════════════════════════════════════════════
//  KEYWORD → GENERATOR MATCHING
// ═══════════════════════════════════════════════════════

interface CharMatch {
    config: CharacterConfig
    x?: number
}

function matchCharacters(text: string): CharMatch[] {
    const results: CharMatch[] = []
    const used = new Set<string>()

    // Check preset names first
    for (const preset of CHARACTER_PRESETS) {
        if (text.includes(preset.id) && !used.has(preset.id)) {
            results.push({ config: { ...preset.config } })
            used.add(preset.id)
        }
    }

    // Check common character keywords
    const CHAR_KEYWORDS: [string, Partial<CharacterConfig>][] = [
        ['person', {}],
        ['human', {}],
        ['man', { gender: 'masculine' }],
        ['woman', { gender: 'feminine' }],
        ['boy', { build: 'child', gender: 'masculine' }],
        ['girl', { build: 'child', gender: 'feminine' }],
        ['child', { build: 'child' }],
        ['soldier', { build: 'athletic', clothing: { top: 'armor', topColor: '#4A553A', bottom: 'armor-legs', bottomColor: '#3A4530', footwear: 'armor-boots', footwearColor: '#333' }, accessories: ['helmet'] }],
        ['doctor', { clothing: { top: 'coat', topColor: '#FFFFFF', bottom: 'slacks', bottomColor: '#333', footwear: 'shoes', footwearColor: '#333' } }],
        ['guard', { build: 'athletic', clothing: { top: 'armor', topColor: '#333', bottom: 'armor-legs', bottomColor: '#222', footwear: 'armor-boots', footwearColor: '#1a1a1a' }, accessories: ['helmet'] }],
        ['king', { clothing: { top: 'coat', topColor: '#800020', bottom: 'slacks', bottomColor: '#1a1a1a', footwear: 'shoes', footwearColor: '#1a1a1a' }, accessories: ['crown'] }],
        ['queen', { gender: 'feminine', clothing: { top: 'coat', topColor: '#800020', bottom: 'slacks', bottomColor: '#1a1a1a', footwear: 'shoes', footwearColor: '#1a1a1a' }, accessories: ['crown'] }],
        ['worker', { build: 'athletic', clothing: { top: 'tshirt', topColor: '#FF8C00', bottom: 'jeans', bottomColor: '#2F4F6F', footwear: 'shoes', footwearColor: '#333' }, accessories: ['hat'] }],
        ['pilot', { clothing: { top: 'jacket', topColor: '#2F4F4F', bottom: 'slacks', bottomColor: '#2F4F4F', footwear: 'shoes', footwearColor: '#1a1a1a' }, accessories: ['sunglasses'] }],
        ['hacker', { build: 'slim', clothing: { top: 'hoodie', topColor: '#1a1a1a', bottom: 'jeans', bottomColor: '#222', footwear: 'sneakers', footwearColor: '#333' }, accessories: ['headphones'] }],
    ]

    for (const [keyword, overrides] of CHAR_KEYWORDS) {
        if (text.includes(keyword) && !used.has(keyword)) {
            results.push({ config: { ...DEFAULT_CHARACTER, ...overrides, name: keyword.charAt(0).toUpperCase() + keyword.slice(1) } })
            used.add(keyword)
            break // one generic character match per scene
        }
    }

    return results
}

function matchCharacterPreset(name: string): CharacterConfig {
    // Try to find a matching preset
    const preset = CHARACTER_PRESETS.find(p => name.includes(p.id))
    if (preset) return { ...preset.config }

    // Default: casual person
    return { ...DEFAULT_CHARACTER, name }
}

function matchCreatures(text: string): any[] {
    const results: any[] = []
    const used = new Set<string>()

    for (const preset of ALL_CREATURE_PRESETS) {
        if (text.includes(preset.id) && !used.has(preset.id)) {
            results.push({ ...preset.config })
            used.add(preset.id)
        }
    }

    // Common aliases
    const aliases: [string, string][] = [
        ['drone', 'eagle'], // drone → bird-like
        ['animal', 'dog'],
        ['pet', 'cat'],
        ['monster', 'wolf'],
        ['beast', 'bear'],
    ]

    for (const [keyword, presetId] of aliases) {
        if (text.includes(keyword) && !used.has(presetId)) {
            const preset = ALL_CREATURE_PRESETS.find(p => p.id === presetId)
            if (preset) {
                results.push({ ...preset.config })
                used.add(presetId)
            }
        }
    }

    return results
}

function matchNature(text: string): THREE.Group[] {
    const results: THREE.Group[] = []

    // Trees
    const treeKeywords: [string, string][] = [
        ['oak', 'oak'], ['pine', 'pine'], ['palm', 'palm'],
        ['birch', 'birch'], ['willow', 'willow'], ['cherry', 'cherry'],
        ['tree', 'oak'], ['forest', 'pine'], ['woods', 'oak'],
    ]
    const usedTrees = new Set<string>()
    for (const [kw, presetId] of treeKeywords) {
        if (text.includes(kw) && !usedTrees.has(presetId)) {
            const preset = TREE_PRESETS.find(p => p.id === presetId)
            if (preset) {
                results.push(buildTree({ ...preset.config, seed: Math.floor(Math.random() * 1000) }))
                usedTrees.add(presetId)
            }
        }
    }

    // Plants
    const plantKeywords: [string, string][] = [
        ['bush', 'bush'], ['fern', 'fern'], ['grass', 'grass'],
        ['cactus', 'cactus'], ['mushroom', 'mushroom'], ['bamboo', 'bamboo'],
        ['flower', ''], ['garden', ''],
    ]
    for (const [kw, presetId] of plantKeywords) {
        if (text.includes(kw)) {
            if (kw === 'flower' || kw === 'garden') {
                // Add a few plants for garden/flower scenes
                const bush = PLANT_PRESETS.find(p => p.id === 'bush')
                if (bush) results.push(buildPlant({ ...bush.config, seed: Math.floor(Math.random() * 1000) }))
            } else {
                const preset = PLANT_PRESETS.find(p => p.id === presetId)
                if (preset) results.push(buildPlant({ ...preset.config, seed: Math.floor(Math.random() * 1000) }))
            }
        }
    }

    // Rocks
    if (text.includes('rock') || text.includes('stone') || text.includes('cliff') || text.includes('mountain')) {
        results.push(buildRock({
            type: 'rock', sizeCategory: 'boulder', size: 0.8,
            roughness: 0.6, jaggedness: 0.5, color: '#5A5A5A',
            mossy: true, seed: Math.floor(Math.random() * 1000),
        }))
    }

    return results
}

function matchProps(text: string): THREE.Group[] {
    const results: THREE.Group[] = []

    // Use TextTo3DGenerator for props that aren't characters/creatures/nature
    const propKeywords = [
        'table', 'desk', 'chair', 'sword', 'shield', 'castle',
        'throne', 'portal', 'tower', 'lamp', 'book', 'barrel',
        'fountain', 'bridge', 'pillar', 'bench', 'altar',
        'chest', 'crown', 'car', 'spaceship',
    ]

    for (const kw of propKeywords) {
        if (text.includes(kw)) {
            const sg = parseDescriptionLocal(kw)
            const group = new THREE.Group()
            group.name = `Prop_${kw}`

            for (const node of sg.objects) {
                const geo = createGeometryForShape(node.shape, node.size)
                const mat = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(node.material.color),
                    metalness: node.material.metalness,
                    roughness: node.material.roughness,
                    emissive: node.material.emissive ? new THREE.Color(node.material.emissive) : undefined,
                    emissiveIntensity: node.material.emissiveIntensity || 0,
                    opacity: node.material.opacity ?? 1,
                    transparent: node.material.transparent ?? false,
                    side: THREE.DoubleSide,
                })
                const mesh = new THREE.Mesh(geo, mat)
                mesh.position.set(node.position.x, node.position.y, node.position.z)
                mesh.rotation.set(
                    node.rotation.x * Math.PI / 180,
                    node.rotation.y * Math.PI / 180,
                    node.rotation.z * Math.PI / 180,
                )
                mesh.castShadow = true
                mesh.receiveShadow = true
                group.add(mesh)
            }

            results.push(group)
            break // one prop per scene to avoid clutter
        }
    }

    return results
}

function createGeometryForShape(shape: string, size: { x: number; y: number; z: number }): THREE.BufferGeometry {
    switch (shape) {
        case 'box': return new THREE.BoxGeometry(size.x, size.y, size.z)
        case 'sphere': return new THREE.SphereGeometry(size.x / 2, 24, 24)
        case 'cylinder': return new THREE.CylinderGeometry(size.x / 2, size.x / 2, size.y, 24)
        case 'cone': return new THREE.ConeGeometry(size.x / 2, size.y, 24)
        case 'torus': return new THREE.TorusGeometry(size.x / 2, size.y / 2, 16, 32)
        case 'plane': return new THREE.PlaneGeometry(size.x, size.z)
        case 'capsule': return new THREE.CapsuleGeometry(size.x / 2, size.y - size.x, 16, 16)
        case 'ring': return new THREE.RingGeometry(size.x / 3, size.x / 2, 24)
        case 'dodecahedron': return new THREE.DodecahedronGeometry(size.x / 2)
        case 'octahedron': return new THREE.OctahedronGeometry(size.x / 2)
        case 'icosahedron': return new THREE.IcosahedronGeometry(size.x / 2)
        case 'tetrahedron': return new THREE.TetrahedronGeometry(size.x / 2)
        default: return new THREE.BoxGeometry(size.x, size.y, size.z)
    }
}

// ═══════════════════════════════════════════════════════
//  SCENE CLEANUP
// ═══════════════════════════════════════════════════════

function removeShotObjects(scene: THREE.Scene) {
    const toRemove: THREE.Object3D[] = []
    scene.children.forEach(child => {
        if (child.userData[CINEMATIC_TAG] && child.userData.__cinematic_sub__ === 'shot') {
            toRemove.push(child)
        }
    })
    toRemove.forEach(obj => {
        scene.remove(obj)
        disposeObject(obj)
    })
}

function removeCinematicObjects(scene: THREE.Scene) {
    const toRemove: THREE.Object3D[] = []
    scene.children.forEach(child => {
        if (child.userData[CINEMATIC_TAG]) {
            toRemove.push(child)
        }
    })
    toRemove.forEach(obj => {
        scene.remove(obj)
        disposeObject(obj)
    })
}

function disposeObject(obj: THREE.Object3D) {
    obj.traverse(child => {
        if (child instanceof THREE.Mesh) {
            child.geometry?.dispose()
            if (Array.isArray(child.material)) {
                child.material.forEach(m => m.dispose())
            } else {
                child.material?.dispose()
            }
        }
    })
}

// ═══════════════════════════════════════════════════════
//  AUDIO
// ═══════════════════════════════════════════════════════

function playSceneAudio(shotIndex: number, audioRef: React.MutableRefObject<HTMLAudioElement | null>) {
    const { voiceOvers } = useStoryStore.getState()
    const sceneIndex = Math.max(0, shotIndex - 1)
    const vo = voiceOvers[sceneIndex]

    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }

    if (vo?.audioUrl) {
        const audio = new Audio(vo.audioUrl)
        audio.volume = 0.85
        audio.play().catch(() => {})
        audioRef.current = audio
    }
}
