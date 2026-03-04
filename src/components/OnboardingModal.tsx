/* ====== TrustGen — Onboarding Walkthrough Modal ====== */
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'trustgen-onboarding-complete'

interface Step {
    icon: string
    title: string
    body: string
}

const STEPS: Step[] = [
    {
        icon: '◈',
        title: 'Welcome to TrustGen 3D',
        body: 'A premium browser-based 3D engine for creating, animating, and exporting stunning scenes. This quick tour will show you the essentials.',
    },
    {
        icon: '🎨',
        title: 'Create & Edit',
        body: 'Use the left toolbar to select, move, rotate, and scale objects. Add primitives (cubes, spheres, cylinders) from the sidebar. Adjust materials, colors, and textures in the Properties tab.',
    },
    {
        icon: '🤖',
        title: 'AI Generation',
        body: 'Open the AI tab to generate 3D models from text descriptions, images, or URLs. You can also generate textures for existing models. Requires a Meshy API key.',
    },
    {
        icon: '🎬',
        title: 'Animate',
        body: 'Select any object, switch to the Animation tab, and add keyframes. Set position, rotation, and scale at different timestamps. Hit play to preview your animation.',
    },
    {
        icon: '📦',
        title: 'Import & Export',
        body: 'Drag-and-drop GLB, GLTF, FBX, or OBJ files directly onto the viewport. Export your scenes as GLB files from the Export tab. Your work auto-saves every 30 seconds.',
    },
    {
        icon: '⌨️',
        title: 'Keyboard Shortcuts',
        body: 'Ctrl+K opens the Command Palette for quick access to all tools and actions. Ctrl+C/V for copy/paste. Q/W/E/R to switch tools. Ctrl+Z to undo.',
    },
    {
        icon: '🚀',
        title: 'You\'re Ready!',
        body: 'Start creating! Look for (?) info bubbles throughout the interface for contextual help. You can replay this tour anytime from the Settings menu.',
    },
]

export function OnboardingModal() {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState(0)

    useEffect(() => {
        if (!localStorage.getItem(STORAGE_KEY)) {
            setOpen(true)
        }
    }, [])

    const handleClose = () => {
        setOpen(false)
        localStorage.setItem(STORAGE_KEY, 'true')
    }

    const next = () => {
        if (step < STEPS.length - 1) setStep(s => s + 1)
        else handleClose()
    }

    const prev = () => {
        if (step > 0) setStep(s => s - 1)
    }

    if (!open) return null

    const current = STEPS[step]

    return (
        <div className="onboarding-overlay" onClick={handleClose}>
            <div className="onboarding-modal" onClick={e => e.stopPropagation()}>
                {/* Progress dots */}
                <div className="onboarding-progress">
                    {STEPS.map((_, i) => (
                        <div key={i} className={`onboarding-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
                    ))}
                </div>

                <div className="onboarding-icon">{current.icon}</div>
                <h2 className="onboarding-title">{current.title}</h2>
                <p className="onboarding-body">{current.body}</p>

                <div className="onboarding-actions">
                    {step > 0 && (
                        <button className="btn glass-btn" onClick={prev}>
                            ← Back
                        </button>
                    )}
                    <button className="btn btn-primary" onClick={next}>
                        {step < STEPS.length - 1 ? 'Next →' : 'Get Started 🚀'}
                    </button>
                </div>

                <button className="onboarding-skip" onClick={handleClose}>
                    Skip Tour
                </button>
            </div>
        </div>
    )
}

export function resetOnboarding() {
    localStorage.removeItem(STORAGE_KEY)
}
