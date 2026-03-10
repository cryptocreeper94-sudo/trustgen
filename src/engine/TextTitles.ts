/* ====== TrustGen — Text & Titles Engine ======
 * Cinematic text overlays, lower thirds, title cards, and credits.
 *
 * - 3D text in the scene (THREE.js TextGeometry)
 * - 2D overlay titles (HTML/CSS rendered over canvas)
 * - Animated title presets (fade, typewriter, glitch, slide)
 * - Lower thirds with name/title
 * - Credits roll
 */

// ── Types ──

export type TextAnimation = 'none' | 'fade-in' | 'fade-out' | 'typewriter' | 'glitch' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale-up' | 'blur-in' | 'cinematic-reveal'

export type TextPresetType = 'title-card' | 'lower-third' | 'subtitle' | 'credit-roll' | 'chapter' | 'custom'

export interface TextOverlay {
    id: string
    /** The text content (supports \n for line breaks) */
    text: string
    /** Preset type */
    preset: TextPresetType
    /** Font family */
    fontFamily: string
    /** Font size (px for 2D, units for 3D) */
    fontSize: number
    /** Font weight */
    fontWeight: number
    /** Text color */
    color: string
    /** Background color (with alpha) */
    backgroundColor: string
    /** Text alignment */
    textAlign: 'left' | 'center' | 'right'
    /** Position on screen (normalized 0–1) */
    position: { x: number; y: number }
    /** Entrance animation */
    animIn: TextAnimation
    /** Exit animation */
    animOut: TextAnimation
    /** Animation duration (seconds) */
    animDuration: number
    /** Start time on timeline */
    startTime: number
    /** Duration visible (seconds) */
    duration: number
    /** Opacity (0–1) */
    opacity: number
    /** Drop shadow */
    shadow: boolean
    /** Letter spacing (em) */
    letterSpacing: number
    /** Line height */
    lineHeight: number
    /** Whether this is 3D in-scene text */
    is3D: boolean
    /** 3D position (if is3D) */
    position3D?: { x: number; y: number; z: number }
    /** 3D rotation (if is3D) */
    rotation3D?: { x: number; y: number; z: number }
}

// ── Defaults ──

let overlayCounter = 0

export function createTextOverlay(overrides?: Partial<TextOverlay>): TextOverlay {
    overlayCounter++
    return {
        id: `text_${Date.now()}_${overlayCounter}`,
        text: 'Title Text',
        preset: 'title-card',
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: 48,
        fontWeight: 700,
        color: '#ffffff',
        backgroundColor: 'transparent',
        textAlign: 'center',
        position: { x: 0.5, y: 0.5 },
        animIn: 'fade-in',
        animOut: 'fade-out',
        animDuration: 0.8,
        startTime: 0,
        duration: 3,
        opacity: 1,
        shadow: true,
        letterSpacing: 0.02,
        lineHeight: 1.3,
        is3D: false,
        ...overrides,
    }
}

// ── Title Presets ──

export interface TitlePreset {
    name: string
    icon: string
    description: string
    create: () => TextOverlay
}

export const TITLE_PRESETS: TitlePreset[] = [
    {
        name: 'Cinematic Title',
        icon: '🎬',
        description: 'Large centered title with fade-in',
        create: () => createTextOverlay({
            text: 'TITLE',
            preset: 'title-card',
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: 0.15,
            animIn: 'cinematic-reveal',
            animDuration: 1.2,
            duration: 4,
            shadow: true,
        }),
    },
    {
        name: 'Lower Third',
        icon: '📋',
        description: 'Name and title at bottom of screen',
        create: () => createTextOverlay({
            text: 'Character Name\nTitle / Description',
            preset: 'lower-third',
            fontSize: 24,
            fontWeight: 600,
            textAlign: 'left',
            position: { x: 0.08, y: 0.82 },
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            animIn: 'slide-left',
            animOut: 'slide-left',
            animDuration: 0.5,
            duration: 4,
            letterSpacing: 0.04,
        }),
    },
    {
        name: 'Subtitle',
        icon: '💬',
        description: 'Bottom-center dialogue subtitle',
        create: () => createTextOverlay({
            text: '"Dialogue goes here."',
            preset: 'subtitle',
            fontSize: 22,
            fontWeight: 500,
            position: { x: 0.5, y: 0.9 },
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            animIn: 'fade-in',
            animOut: 'fade-out',
            animDuration: 0.3,
            duration: 3,
            shadow: false,
        }),
    },
    {
        name: 'Chapter Card',
        icon: '📖',
        description: 'Chapter number and title',
        create: () => createTextOverlay({
            text: 'CHAPTER ONE\nThe Beginning',
            preset: 'chapter',
            fontSize: 36,
            fontWeight: 300,
            letterSpacing: 0.2,
            lineHeight: 1.8,
            animIn: 'fade-in',
            animOut: 'fade-out',
            animDuration: 1,
            duration: 5,
        }),
    },
    {
        name: 'Credit Roll',
        icon: '🎭',
        description: 'Scrolling end credits',
        create: () => createTextOverlay({
            text: 'Directed by\nYour Name\n\nProduced by\nStudio Name\n\nCreated with TrustGen',
            preset: 'credit-roll',
            fontSize: 28,
            fontWeight: 400,
            position: { x: 0.5, y: 1.2 },
            animIn: 'slide-up',
            animOut: 'none',
            animDuration: 0,
            duration: 10,
            lineHeight: 2.0,
        }),
    },
    {
        name: 'Glitch Title',
        icon: '⚡',
        description: 'Digital glitch effect reveal',
        create: () => createTextOverlay({
            text: 'GLITCH',
            preset: 'title-card',
            fontSize: 64,
            fontWeight: 900,
            color: '#06b6d4',
            animIn: 'glitch',
            animOut: 'glitch',
            animDuration: 0.6,
            duration: 3,
            letterSpacing: 0.1,
        }),
    },
    {
        name: 'Typewriter',
        icon: '⌨️',
        description: 'Letter-by-letter reveal',
        create: () => createTextOverlay({
            text: 'This text appears one letter at a time...',
            preset: 'custom',
            fontSize: 28,
            fontWeight: 400,
            fontFamily: '"Courier New", monospace',
            textAlign: 'left',
            position: { x: 0.1, y: 0.5 },
            animIn: 'typewriter',
            animOut: 'fade-out',
            animDuration: 2,
            duration: 5,
        }),
    },
]

// ── Animation Evaluation ──

/**
 * Compute CSS properties for a text overlay at a given time.
 * Returns opacity and transform values.
 */
export function evaluateTextAnimation(
    overlay: TextOverlay,
    currentTime: number
): { opacity: number; transform: string; clipPath: string; visible: boolean } {
    const localTime = currentTime - overlay.startTime
    if (localTime < 0 || localTime > overlay.duration) {
        return { opacity: 0, transform: 'none', clipPath: 'none', visible: false }
    }

    let opacity = overlay.opacity
    let transform = 'translate(-50%, -50%)'
    let clipPath = 'none'

    // Entrance animation
    if (localTime < overlay.animDuration) {
        const t = localTime / overlay.animDuration
        const ease = t * t * (3 - 2 * t) // smoothstep

        switch (overlay.animIn) {
            case 'fade-in': opacity *= ease; break
            case 'slide-up': transform = `translate(-50%, calc(-50% + ${(1 - ease) * 40}px))`; opacity *= ease; break
            case 'slide-down': transform = `translate(-50%, calc(-50% - ${(1 - ease) * 40}px))`; opacity *= ease; break
            case 'slide-left': transform = `translate(calc(-50% + ${(1 - ease) * 60}px), -50%)`; opacity *= ease; break
            case 'slide-right': transform = `translate(calc(-50% - ${(1 - ease) * 60}px), -50%)`; opacity *= ease; break
            case 'scale-up': transform = `translate(-50%, -50%) scale(${0.5 + ease * 0.5})`; opacity *= ease; break
            case 'blur-in': transform = `translate(-50%, -50%)`; opacity *= ease; break
            case 'cinematic-reveal': clipPath = `inset(0 ${(1 - ease) * 50}% 0 ${(1 - ease) * 50}%)`; break
            case 'typewriter': /* handled by text slicing in renderer */ break
            case 'glitch': opacity *= t > 0.3 ? 1 : (Math.random() > 0.5 ? 1 : 0); break
        }
    }

    // Exit animation
    const exitStart = overlay.duration - overlay.animDuration
    if (localTime > exitStart && overlay.animOut !== 'none') {
        const t = (localTime - exitStart) / overlay.animDuration
        const ease = 1 - t * t * (3 - 2 * t)

        switch (overlay.animOut) {
            case 'fade-out': opacity *= ease; break
            case 'slide-up': transform = `translate(-50%, calc(-50% - ${(1 - ease) * 40}px))`; opacity *= ease; break
            case 'slide-down': transform = `translate(-50%, calc(-50% + ${(1 - ease) * 40}px))`; opacity *= ease; break
            case 'slide-left': transform = `translate(calc(-50% - ${(1 - ease) * 60}px), -50%)`; opacity *= ease; break
            case 'glitch': opacity *= Math.random() > 0.5 ? ease : 0; break
            default: opacity *= ease; break
        }
    }

    return { opacity, transform, clipPath, visible: true }
}

/**
 * Get the portion of text to show for typewriter animation.
 */
export function getTypewriterText(text: string, currentTime: number, overlay: TextOverlay): string {
    if (overlay.animIn !== 'typewriter') return text
    const localTime = currentTime - overlay.startTime
    if (localTime < 0) return ''
    const progress = Math.min(1, localTime / overlay.animDuration)
    const chars = Math.floor(progress * text.length)
    return text.slice(0, chars)
}
