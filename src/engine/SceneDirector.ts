/* ====== TrustGen — AI Scene Director ======
 * Automatically compose 3D scenes from script/text descriptions.
 * Parses storyboard descriptions and generates:
 *   - Camera positions and movements
 *   - Character placement
 *   - Prop arrangement
 *   - Lighting mood
 *   - Environment selection
 *
 * Think of it as a "screenplay to scene" engine.
 */

// ── Types ──

export interface SceneComposition {
    /** Environment preset to use */
    environmentId: string
    /** Camera setup */
    camera: {
        position: { x: number; y: number; z: number }
        lookAt: { x: number; y: number; z: number }
        fov: number
        movement: 'static' | 'pan' | 'orbit' | 'dolly' | 'crane' | 'follow'
    }
    /** Character placements */
    characters: CharacterPlacement[]
    /** Prop placements */
    props: PropPlacement[]
    /** Lighting mood */
    lighting: {
        mood: LightingMood
        mainLightColor: string
        mainLightIntensity: number
        ambientIntensity: number
    }
    /** Suggested duration (seconds) */
    suggestedDuration: number
    /** Suggested shot type */
    shotType: ShotType
}

export type LightingMood = 'bright' | 'dramatic' | 'warm' | 'cool' | 'dark' | 'ethereal' | 'natural'
export type ShotType = 'establishing' | 'close-up' | 'medium' | 'wide' | 'over-shoulder' | 'two-shot' | 'group'

export interface CharacterPlacement {
    /** Text-to-3D prompt for the character */
    description: string
    /** Position in scene */
    position: { x: number; y: number; z: number }
    /** Rotation (facing direction in degrees) */
    facingAngle: number
    /** Suggested animation */
    animation: string
    /** Label/name */
    name: string
}

export interface PropPlacement {
    /** Text-to-3D prompt for the prop */
    description: string
    /** Position */
    position: { x: number; y: number; z: number }
    /** Scale multiplier */
    scale: number
}

// ── Keyword Analyzers ──

const ENVIRONMENT_KEYWORDS: Record<string, string> = {
    'studio': 'studio', 'photo studio': 'studio',
    'office': 'office', 'desk': 'office', 'computer': 'office',
    'living room': 'living-room', 'couch': 'living-room', 'sofa': 'living-room',
    'interview': 'interview', 'talk show': 'interview', 'podcast': 'interview',
    'presentation': 'podium', 'keynote': 'podium', 'conference': 'podium', 'stage': 'podium',
    'park': 'park', 'outdoor': 'park', 'garden': 'park', 'nature': 'park',
    'beach': 'beach', 'ocean': 'beach', 'sand': 'beach', 'tropical': 'beach',
    'dark': 'void', 'void': 'void', 'space': 'void', 'empty': 'void',
    'abstract': 'gradient', 'neon': 'gradient', 'modern': 'gradient',
}

const MOOD_KEYWORDS: Record<string, LightingMood> = {
    'bright': 'bright', 'sunny': 'bright', 'cheerful': 'bright', 'happy': 'bright',
    'dramatic': 'dramatic', 'intense': 'dramatic', 'suspense': 'dramatic', 'tense': 'dramatic',
    'warm': 'warm', 'cozy': 'warm', 'sunset': 'warm', 'golden': 'warm',
    'cool': 'cool', 'cold': 'cool', 'blue': 'cool', 'winter': 'cool',
    'dark': 'dark', 'night': 'dark', 'shadow': 'dark', 'mysterious': 'dark',
    'ethereal': 'ethereal', 'dream': 'ethereal', 'magical': 'ethereal', 'fantasy': 'ethereal',
    'natural': 'natural', 'daylight': 'natural', 'outdoor': 'natural',
}

const SHOT_KEYWORDS: Record<string, ShotType> = {
    'establishing': 'establishing', 'wide shot': 'establishing', 'panorama': 'establishing',
    'close-up': 'close-up', 'closeup': 'close-up', 'tight': 'close-up', 'face': 'close-up',
    'medium shot': 'medium', 'waist': 'medium',
    'wide': 'wide', 'full body': 'wide',
    'over shoulder': 'over-shoulder', 'over-the-shoulder': 'over-shoulder',
    'two-shot': 'two-shot', 'two people': 'two-shot', 'conversation': 'two-shot',
    'group': 'group', 'crowd': 'group', 'audience': 'group',
}

const MOOD_LIGHTING: Record<LightingMood, { mainColor: string; mainIntensity: number; ambientIntensity: number }> = {
    bright: { mainColor: '#ffffff', mainIntensity: 1.5, ambientIntensity: 0.6 },
    dramatic: { mainColor: '#ff8844', mainIntensity: 2.0, ambientIntensity: 0.15 },
    warm: { mainColor: '#FFE4B5', mainIntensity: 1.2, ambientIntensity: 0.4 },
    cool: { mainColor: '#B0C4DE', mainIntensity: 1.0, ambientIntensity: 0.35 },
    dark: { mainColor: '#334455', mainIntensity: 0.3, ambientIntensity: 0.1 },
    ethereal: { mainColor: '#E0E8FF', mainIntensity: 0.8, ambientIntensity: 0.5 },
    natural: { mainColor: '#FFF5E0', mainIntensity: 1.3, ambientIntensity: 0.5 },
}

const CAMERA_FOR_SHOT: Record<ShotType, { position: { x: number; y: number; z: number }; fov: number; movement: SceneComposition['camera']['movement'] }> = {
    establishing: { position: { x: 8, y: 5, z: 8 }, fov: 45, movement: 'orbit' },
    'close-up': { position: { x: 0, y: 1.5, z: 2 }, fov: 35, movement: 'dolly' },
    medium: { position: { x: 2, y: 1.3, z: 4 }, fov: 45, movement: 'static' },
    wide: { position: { x: 5, y: 2, z: 6 }, fov: 55, movement: 'pan' },
    'over-shoulder': { position: { x: -1, y: 1.6, z: 1.5 }, fov: 40, movement: 'static' },
    'two-shot': { position: { x: 0, y: 1.3, z: 3.5 }, fov: 45, movement: 'static' },
    group: { position: { x: 0, y: 2, z: 6 }, fov: 55, movement: 'pan' },
}

// ── Main Director Function ──

/**
 * Analyze a text description and compose a 3D scene.
 * Works locally without any API calls.
 */
export function directScene(description: string): SceneComposition {
    const lower = description.toLowerCase()

    // 1. Detect environment
    let environmentId = 'void'
    for (const [keyword, envId] of Object.entries(ENVIRONMENT_KEYWORDS)) {
        if (lower.includes(keyword)) { environmentId = envId; break }
    }

    // 2. Detect lighting mood
    let mood: LightingMood = 'natural'
    for (const [keyword, m] of Object.entries(MOOD_KEYWORDS)) {
        if (lower.includes(keyword)) { mood = m; break }
    }
    const lightingConfig = MOOD_LIGHTING[mood]

    // 3. Detect shot type
    let shotType: ShotType = 'medium'
    for (const [keyword, st] of Object.entries(SHOT_KEYWORDS)) {
        if (lower.includes(keyword)) { shotType = st; break }
    }
    const cameraConfig = CAMERA_FOR_SHOT[shotType]

    // 4. Extract character mentions
    const characters: CharacterPlacement[] = []
    const characterPatterns = [
        /(?:a |the )?(man|woman|person|character|figure|narrator|host|speaker|interviewer|guest)/gi,
        /([A-Z][a-z]+)\s+(stands|sits|walks|talks|speaks|looks|enters)/g,
    ]
    const foundChars = new Set<string>()
    for (const pattern of characterPatterns) {
        let match
        while ((match = pattern.exec(description)) !== null) {
            const name = match[1]
            if (!foundChars.has(name.toLowerCase())) {
                foundChars.add(name.toLowerCase())
                const xOffset = characters.length * 1.5 - (characters.length > 0 ? 0.75 : 0)
                characters.push({
                    name: name.charAt(0).toUpperCase() + name.slice(1),
                    description: `A ${name.toLowerCase()} character`,
                    position: { x: xOffset, y: 0, z: 0 },
                    facingAngle: characters.length % 2 === 0 ? 0 : 180,
                    animation: lower.includes('walk') ? 'Walk' : lower.includes('sit') ? 'Idle' : lower.includes('talk') || lower.includes('speak') ? 'Wave' : 'Idle',
                })
            }
        }
    }

    // Default: if no characters found in a documentary context, add a narrator
    if (characters.length === 0 && (lower.includes('narrator') || lower.includes('documentary') || lower.includes('explain'))) {
        characters.push({
            name: 'Narrator',
            description: 'A standing narrator/presenter',
            position: { x: 0, y: 0, z: 0 },
            facingAngle: 0,
            animation: 'Idle',
        })
    }

    // 5. Extract props
    const props: PropPlacement[] = []
    const propPatterns = [
        /(?:a |the |an )?(table|desk|chair|book|lamp|screen|monitor|microphone|whiteboard|plant|globe|map|podium|trophy|clock|phone)/gi,
    ]
    const foundProps = new Set<string>()
    for (const pattern of propPatterns) {
        let match
        while ((match = pattern.exec(description)) !== null) {
            const propName = match[1].toLowerCase()
            if (!foundProps.has(propName)) {
                foundProps.add(propName)
                props.push({
                    description: `A ${propName}`,
                    position: { x: props.length * 1.2 - 1, y: 0, z: -1.5 },
                    scale: 1,
                })
            }
        }
    }

    // 6. Duration heuristics
    let duration = 4
    if (shotType === 'establishing') duration = 6
    else if (shotType === 'close-up') duration = 3
    else if (lower.includes('long') || lower.includes('slow')) duration = 8
    else if (lower.includes('quick') || lower.includes('fast') || lower.includes('brief')) duration = 2

    return {
        environmentId,
        camera: {
            position: cameraConfig.position,
            lookAt: { x: 0, y: 1, z: 0 },
            fov: cameraConfig.fov,
            movement: cameraConfig.movement,
        },
        characters,
        props,
        lighting: {
            mood,
            mainLightColor: lightingConfig.mainColor,
            mainLightIntensity: lightingConfig.mainIntensity,
            ambientIntensity: lightingConfig.ambientIntensity,
        },
        suggestedDuration: duration,
        shotType,
    }
}

/**
 * Compose a full sequence from multiple scene descriptions.
 * Useful for converting a storyboard into a complete multi-shot sequence.
 */
export function directSequence(descriptions: string[]): SceneComposition[] {
    return descriptions.map(desc => directScene(desc))
}

/**
 * Generate a scene description summary for UI display.
 */
export function summarizeComposition(comp: SceneComposition): string {
    const parts: string[] = []
    parts.push(`📍 ${comp.environmentId.replace(/-/g, ' ')}`)
    parts.push(`🎬 ${comp.shotType}`)
    parts.push(`💡 ${comp.lighting.mood}`)
    if (comp.characters.length > 0) {
        parts.push(`👤 ${comp.characters.map(c => c.name).join(', ')}`)
    }
    if (comp.props.length > 0) {
        parts.push(`📦 ${comp.props.map(p => p.description).join(', ')}`)
    }
    parts.push(`⏱️ ~${comp.suggestedDuration}s`)
    return parts.join(' • ')
}
