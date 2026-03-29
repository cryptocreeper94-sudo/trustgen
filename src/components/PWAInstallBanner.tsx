/* ====== TrustGen PWA Install Banner ====== */
import { useState, useEffect } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallBanner() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true
    setIsStandalone(standalone)

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    setIsIOS(ios)

    const wasDismissed = sessionStorage.getItem('tg-pwa-dismissed')
    if (wasDismissed) setDismissed(true)

    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', () => {
      setInstalled(true)
      setInstallPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const result = await installPrompt.userChoice
    if (result.outcome === 'accepted') setInstalled(true)
    setInstallPrompt(null)
  }

  const handleDismiss = () => {
    setDismissed(true)
    sessionStorage.setItem('tg-pwa-dismissed', '1')
  }

  if (isStandalone || installed || dismissed) return null
  const showBanner = installPrompt || isIOS
  if (!showBanner) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 9999,
      width: 'calc(100% - 32px)',
      maxWidth: 480,
      background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(139,92,246,0.12), rgba(6,182,212,0.06))',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(6,182,212,0.2)',
      borderRadius: 16,
      padding: '16px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'slideUp 0.4s ease-out',
    }}>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>

      {/* Icon */}
      <div style={{
        width: 44, height: 44, borderRadius: 12, flexShrink: 0,
        background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 0 20px rgba(6,182,212,0.3)',
        fontSize: 22,
      }}>
        ◈
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>
          Install TrustGen 3D
        </div>
        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, lineHeight: 1.4 }}>
          {isIOS
            ? 'Tap the share button below, then "Add to Home Screen" for the full app experience.'
            : 'Get instant access, offline 3D editing, and push notifications.'}
        </div>
      </div>

      {/* Actions */}
      {installPrompt ? (
        <button onClick={handleInstall} style={{
          flexShrink: 0, padding: '10px 18px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, #06b6d4, #8b5cf6)',
          color: '#fff', fontWeight: 800, fontSize: 12, cursor: 'pointer',
          boxShadow: '0 0 16px rgba(6,182,212,0.3)',
          transition: 'transform 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Install
        </button>
      ) : isIOS ? (
        <div style={{
          flexShrink: 0, padding: '8px 14px', borderRadius: 10,
          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
          color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600,
        }}>
          Share → Add
        </div>
      ) : null}

      {/* Dismiss */}
      <button onClick={handleDismiss} style={{
        position: 'absolute', top: 6, right: 8,
        width: 22, height: 22, borderRadius: '50%',
        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'rgba(255,255,255,0.4)', fontSize: 12, cursor: 'pointer',
        transition: 'all 0.15s',
      }}
        onMouseEnter={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.8)'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
        onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
      >
        ✕
      </button>
    </div>
  )
}
