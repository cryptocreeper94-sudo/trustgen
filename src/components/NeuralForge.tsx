/* ====== TrustGen — Neural Forge Loading Experience ======
 * Premium loading animation for AI/procedural generation.
 *
 * Shows a blurred image carousel that progressively reveals
 * as generation completes, with rotating status messages
 * and particle effects.
 *
 * Usage:
 *   <NeuralForge
 *     active={isGenerating}
 *     progress={0-100}
 *     onComplete={() => { ... }}
 *     stage="sculpting"  // optional override
 *   />
 */
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'

// ── Status Messages (rotate during generation) ──

const FORGE_MESSAGES: { text: string; icon: string; minProgress: number }[] = [
    { text: 'Initializing neural pathways...', icon: '🧬', minProgress: 0 },
    { text: 'Scanning creative matrix...', icon: '🔮', minProgress: 5 },
    { text: 'Charging vertex buffers...', icon: '⚡', minProgress: 10 },
    { text: 'Sculpting geometry...', icon: '🗿', minProgress: 20 },
    { text: 'Resolving topology chains...', icon: '🔗', minProgress: 30 },
    { text: 'Weaving material fibers...', icon: '🧵', minProgress: 40 },
    { text: 'Applying neural textures...', icon: '🎨', minProgress: 50 },
    { text: 'Calibrating surface normals...', icon: '💎', minProgress: 60 },
    { text: 'Optimizing mesh density...', icon: '📐', minProgress: 70 },
    { text: 'Rendering preview frames...', icon: '🖼️', minProgress: 80 },
    { text: 'Finalizing asset pipeline...', icon: '🏗️', minProgress: 90 },
    { text: 'Asset ready.', icon: '✅', minProgress: 98 },
]

// ── Reference image data (procedural SVG thumbnails) ──

function generateRefImages(): string[] {
    const colors = [
        ['#06b6d4', '#0e7490'], // cyan
        ['#a855f7', '#7c3aed'], // purple
        ['#14b8a6', '#0d9488'], // teal
        ['#38bdf8', '#0284c7'], // blue
        ['#34d399', '#059669'], // green
        ['#f472b6', '#db2777'], // pink
        ['#818cf8', '#6366f1'], // indigo
        ['#22d3ee', '#06b6d4'], // light cyan
    ]
    const shapes = [
        // Cube
        (c: string[]) => `<rect x="30" y="30" width="40" height="40" rx="4" fill="${c[0]}" opacity="0.8"/><rect x="20" y="20" width="40" height="40" rx="4" fill="${c[1]}" opacity="0.4"/>`,
        // Sphere
        (c: string[]) => `<circle cx="50" cy="50" r="25" fill="${c[0]}" opacity="0.8"/><ellipse cx="50" cy="50" rx="25" ry="12" fill="${c[1]}" opacity="0.3"/>`,
        // Pyramid
        (c: string[]) => `<polygon points="50,15 80,75 20,75" fill="${c[0]}" opacity="0.8"/><polygon points="50,15 80,75 65,75" fill="${c[1]}" opacity="0.4"/>`,
        // Cylinder
        (c: string[]) => `<rect x="30" y="25" width="40" height="45" rx="3" fill="${c[0]}" opacity="0.8"/><ellipse cx="50" cy="25" rx="20" ry="8" fill="${c[1]}" opacity="0.6"/>`,
        // Torus
        (c: string[]) => `<circle cx="50" cy="50" r="25" fill="none" stroke="${c[0]}" stroke-width="10" opacity="0.8"/><ellipse cx="50" cy="50" rx="25" ry="12" fill="none" stroke="${c[1]}" stroke-width="5" opacity="0.4"/>`,
        // Crystal
        (c: string[]) => `<polygon points="50,10 70,40 60,85 40,85 30,40" fill="${c[0]}" opacity="0.7"/><polygon points="50,10 60,40 50,85 40,40" fill="${c[1]}" opacity="0.5"/>`,
        // House
        (c: string[]) => `<rect x="25" y="45" width="50" height="35" fill="${c[0]}" opacity="0.8"/><polygon points="50,20 80,45 20,45" fill="${c[1]}" opacity="0.7"/>`,
        // Sword
        (c: string[]) => `<rect x="47" y="10" width="6" height="55" rx="1" fill="${c[0]}" opacity="0.9"/><rect x="35" y="65" width="30" height="6" rx="2" fill="${c[1]}" opacity="0.7"/><rect x="45" y="71" width="10" height="15" rx="2" fill="${c[0]}" opacity="0.5"/>`,
    ]
    return shapes.map((shapeFn, i) => {
        const c = colors[i % colors.length]
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
            <defs><radialGradient id="bg${i}"><stop offset="0%" style="stop-color:${c[0]};stop-opacity:0.15"/><stop offset="100%" style="stop-color:#06060a;stop-opacity:1"/></radialGradient></defs>
            <rect width="100" height="100" fill="url(#bg${i})"/>
            ${shapeFn(c)}
        </svg>`
        return `data:image/svg+xml,${encodeURIComponent(svg)}`
    })
}

// ── Particle system ──

interface Particle {
    x: number; y: number; vx: number; vy: number
    size: number; opacity: number; hue: number; life: number
}

function createParticle(): Particle {
    return {
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.5 - 0.1,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.6 + 0.2,
        hue: Math.random() > 0.5 ? 185 : 270, // cyan or purple
        life: Math.random() * 100,
    }
}

// ══════════════════════════════════════════
//  COMPONENT
// ══════════════════════════════════════════

interface NeuralForgeProps {
    active: boolean
    progress?: number           // 0–100, auto-simulated if not provided
    onComplete?: () => void
    stage?: string              // optional message override
    compact?: boolean           // smaller version for sidebar
}

export function NeuralForge({ active, progress: externalProgress, onComplete, stage, compact }: NeuralForgeProps) {
    const [internalProgress, setInternalProgress] = useState(0)
    const [carouselIndex, setCarouselIndex] = useState(0)
    const [particles, setParticles] = useState<Particle[]>(() =>
        Array.from({ length: 20 }, createParticle)
    )
    const [completed, setCompleted] = useState(false)
    const [visible, setVisible] = useState(false)
    const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)
    const particleRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

    const refImages = useMemo(() => generateRefImages(), [])
    const progress = externalProgress ?? internalProgress

    // ── Auto-progress simulation (when no external progress) ──
    useEffect(() => {
        if (!active) {
            setInternalProgress(0)
            setCompleted(false)
            setVisible(false)
            return
        }

        setVisible(true)

        if (externalProgress !== undefined) return // external control

        // Simulate progress with acceleration curve
        intervalRef.current = setInterval(() => {
            setInternalProgress(p => {
                if (p >= 100) {
                    clearInterval(intervalRef.current)
                    return 100
                }
                // Fast start, slow middle, fast finish
                const speed = p < 20 ? 3 : p < 70 ? 0.8 : p < 90 ? 1.5 : 4
                return Math.min(100, p + speed + Math.random() * speed)
            })
        }, 100)

        return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
    }, [active, externalProgress])

    // ── Carousel rotation (faster at start, slower at end) ──
    useEffect(() => {
        if (!active || !visible) return
        const speed = Math.max(80, 400 - (100 - progress) * 3) // 80ms at start → 400ms at end
        const timer = setInterval(() => {
            setCarouselIndex(i => (i + 1) % refImages.length)
        }, speed)
        return () => clearInterval(timer)
    }, [active, visible, progress, refImages.length])

    // ── Particle animation ──
    useEffect(() => {
        if (!active || !visible) return
        particleRef.current = setInterval(() => {
            setParticles(prev => prev.map(p => {
                p.x += p.vx
                p.y += p.vy
                p.life -= 1
                p.opacity *= 0.995
                if (p.life <= 0 || p.opacity < 0.05 || p.y < -5) {
                    return createParticle()
                }
                return { ...p }
            }))
        }, 50)
        return () => { if (particleRef.current) clearInterval(particleRef.current) }
    }, [active, visible])

    // ── Completion ──
    useEffect(() => {
        if (progress >= 100 && !completed) {
            setCompleted(true)
            setTimeout(() => {
                onComplete?.()
            }, 600) // brief pause to show "Asset ready" state
        }
    }, [progress, completed, onComplete])

    // Current message
    const currentMessage = useMemo(() => {
        if (stage) return { text: stage, icon: '⚡' }
        const msg = [...FORGE_MESSAGES].reverse().find(m => progress >= m.minProgress)
        return msg || FORGE_MESSAGES[0]
    }, [progress, stage])

    // Blur level: heavy at 0% → clear at 100%
    const blurLevel = Math.max(0, (100 - progress) / 5) // 20px at 0% → 0px at 100%
    const pixelSize = Math.max(1, Math.floor((100 - progress) / 10)) // 10 at 0% → 1 at 100%

    const handleSkip = useCallback(() => {
        setInternalProgress(100)
    }, [])

    if (!visible && !active) return null

    return (
        <div className={"nf-container" + (compact ? ' nf-compact' : '') + (completed ? ' nf-done' : '')}
            style={{ opacity: visible ? 1 : 0 }}
        >
            {/* Particle background */}
            <div className="nf-particles">
                {particles.map((p, i) => (
                    <div key={i} className="nf-particle" style={{
                        left: p.x + '%',
                        top: p.y + '%',
                        width: p.size + 'px',
                        height: p.size + 'px',
                        opacity: p.opacity,
                        background: `hsl(${p.hue}, 80%, 60%)`,
                        boxShadow: `0 0 ${p.size * 2}px hsl(${p.hue}, 80%, 60%)`,
                    }} />
                ))}
            </div>

            {/* Image carousel */}
            <div className="nf-carousel">
                {refImages.map((src, i) => (
                    <img
                        key={i}
                        src={src}
                        alt=""
                        className={"nf-carousel-img" + (i === carouselIndex ? ' nf-carousel-img--active' : '')}
                        style={{
                            filter: `blur(${blurLevel}px)`,
                            imageRendering: pixelSize > 2 ? 'pixelated' : 'auto',
                            transform: i === carouselIndex
                                ? `scale(${0.85 + progress * 0.0015})`
                                : 'scale(0.5)',
                        }}
                        draggable={false}
                    />
                ))}

                {/* Scanline overlay */}
                <div className="nf-scanlines" />

                {/* Progress ring */}
                <svg className="nf-ring" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                    <circle cx="60" cy="60" r="54" fill="none"
                        stroke={completed ? '#34d399' : '#06b6d4'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 54}`}
                        strokeDashoffset={`${2 * Math.PI * 54 * (1 - progress / 100)}`}
                        style={{ transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease' }}
                    />
                </svg>

                {/* Center percentage */}
                <div className="nf-percent" style={{
                    color: completed ? '#34d399' : '#06b6d4',
                    textShadow: `0 0 20px ${completed ? '#34d39960' : '#06b6d460'}`,
                }}>
                    {completed ? '✓' : Math.floor(progress) + '%'}
                </div>
            </div>

            {/* Status message */}
            <div className="nf-status">
                <span className="nf-status-icon">{currentMessage.icon}</span>
                <span className="nf-status-text">{currentMessage.text}</span>
            </div>

            {/* Progress bar (bottom) */}
            <div className="nf-bar">
                <div className="nf-bar-fill" style={{
                    width: progress + '%',
                    background: completed
                        ? 'linear-gradient(90deg, #34d399, #06b6d4)'
                        : 'linear-gradient(90deg, #06b6d4, #a855f7)',
                }} />
            </div>

            {/* Brand watermark */}
            <div className="nf-brand">
                <span className="nf-brand-logo">◈</span>
                <span className="nf-brand-text">Neural Forge</span>
            </div>

            {/* Skip button (only during simulation) */}
            {!completed && externalProgress === undefined && (
                <button className="nf-skip" onClick={handleSkip}>Skip →</button>
            )}
        </div>
    )
}

export default NeuralForge
