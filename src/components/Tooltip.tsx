/* ====== TrustGen — Tooltip / Info Bubble System ====== */
import { useState, useRef, useEffect, type ReactNode } from 'react'

interface TooltipProps {
    text: string
    children: ReactNode
    position?: 'top' | 'bottom' | 'left' | 'right'
    delay?: number
}

export function Tooltip({ text, children, position = 'top', delay = 300 }: TooltipProps) {
    const [visible, setVisible] = useState(false)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const show = () => {
        timerRef.current = setTimeout(() => setVisible(true), delay)
    }
    const hide = () => {
        if (timerRef.current) clearTimeout(timerRef.current)
        setVisible(false)
    }

    useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

    return (
        <span className="tooltip-wrapper" onMouseEnter={show} onMouseLeave={hide} onFocus={show} onBlur={hide}>
            {children}
            {visible && (
                <span className={`tooltip-bubble tooltip-${position}`} role="tooltip">
                    {text}
                    <span className="tooltip-arrow" />
                </span>
            )}
        </span>
    )
}

/* ── Info Bubble (?) icon with tooltip ── */
interface InfoBubbleProps {
    text: string
    position?: 'top' | 'bottom' | 'left' | 'right'
}

export function InfoBubble({ text, position = 'top' }: InfoBubbleProps) {
    return (
        <Tooltip text={text} position={position}>
            <span className="info-bubble" tabIndex={0} aria-label="More information">?</span>
        </Tooltip>
    )
}
