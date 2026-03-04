/* ====== TrustGen — Toast Notification System ====== */
import { useState, useEffect, useCallback } from 'react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
    id: string
    type: ToastType
    message: string
    duration: number
    exiting?: boolean
}

const ICONS: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
    warning: '⚠️',
}

let toastIdCounter = 0
let globalAddToast: ((type: ToastType, message: string, duration?: number) => void) | null = null

export function showToast(type: ToastType, message: string, duration = 4000) {
    globalAddToast?.(type, message, duration)
}

export function ToastContainer() {
    const [toasts, setToasts] = useState<Toast[]>([])

    const addToast = useCallback((type: ToastType, message: string, duration = 4000) => {
        const id = `toast-${++toastIdCounter}`
        setToasts(prev => [...prev, { id, type, message, duration }])
        setTimeout(() => {
            setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t))
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, 300)
        }, duration)
    }, [])

    useEffect(() => {
        globalAddToast = addToast
        return () => { globalAddToast = null }
    }, [addToast])

    if (toasts.length === 0) return null

    return (
        <div className="toast-container">
            {toasts.map(t => (
                <div key={t.id} className={`toast ${t.type} ${t.exiting ? 'exiting' : ''}`}>
                    <span className="toast-icon">{ICONS[t.type]}</span>
                    <span className="toast-message">{t.message}</span>
                    <div
                        className="toast-progress"
                        style={{ animationDuration: `${t.duration}ms` }}
                    />
                </div>
            ))}
        </div>
    )
}
