/* ====== TrustGen — Developer Portal PIN Pass-Through ======
 * Single-PIN authentication for cross-app access.
 * When you log into the Developer Portal (TrustVault) with your PIN,
 * this module carries that auth to TrustGen automatically.
 *
 * Flow:
 *   1. User enters PIN in Developer Portal (TrustVault)
 *   2. TrustVault issues a session token as an ecosystem JWT
 *   3. This token is passed to TrustGen via URL param or shared cookie
 *   4. TrustGen verifies the ecosystem token via Trust Layer API
 *   5. User is auto-authenticated in TrustGen — no second login
 *
 * Supports:
 *   - URL token passing (?ecosystem_token=xxx)
 *   - Shared httpOnly cookie (trustlayer_session)
 *   - localStorage fallback for same-origin scenarios
 *   - PostMessage for iframe embedding
 */

// ── Constants ──

const ECOSYSTEM_TOKEN_KEY = 'trustlayer_ecosystem_token'
const ECOSYSTEM_SESSION_COOKIE = 'trustlayer_session'
const PORTAL_ORIGIN = 'https://trustvault.trustlayer.app'
const TOKEN_CHECK_INTERVAL = 30000 // re-verify every 30s

// ── Types ──

export interface PortalSession {
    userId: string
    email: string
    name: string
    pin: string // last 4 digits masked (e.g., "••••1234")
    ecosystemToken: string
    apps: AppAccess[]
    expiresAt: number
}

export interface AppAccess {
    appId: string
    appName: string
    role: 'admin' | 'editor' | 'viewer'
    lastAccessed?: string
}

export interface PassThroughResult {
    authenticated: boolean
    session?: PortalSession
    error?: string
}

// ── Token Detection ──

/**
 * Check for an ecosystem token from any supported source.
 * Priority: URL param → cookie → localStorage → postMessage.
 */
export function detectEcosystemToken(): string | null {
    // 1. URL parameter (from Developer Portal redirect)
    const urlParams = new URLSearchParams(window.location.search)
    const urlToken = urlParams.get('ecosystem_token')
    if (urlToken) {
        // Store it and clean the URL
        localStorage.setItem(ECOSYSTEM_TOKEN_KEY, urlToken)
        const cleanUrl = new URL(window.location.href)
        cleanUrl.searchParams.delete('ecosystem_token')
        window.history.replaceState({}, '', cleanUrl.toString())
        return urlToken
    }

    // 2. Shared cookie
    const cookieToken = getCookie(ECOSYSTEM_SESSION_COOKIE)
    if (cookieToken) return cookieToken

    // 3. localStorage (same-origin or previously stored)
    const storedToken = localStorage.getItem(ECOSYSTEM_TOKEN_KEY)
    if (storedToken) return storedToken

    return null
}

/**
 * Listen for ecosystem tokens sent via postMessage (iframe scenarios).
 */
export function listenForPortalAuth(callback: (token: string) => void): () => void {
    const handler = (event: MessageEvent) => {
        // Verify origin
        if (event.origin !== PORTAL_ORIGIN && event.origin !== window.location.origin) return
        if (event.data?.type === 'ecosystem_auth' && event.data?.token) {
            localStorage.setItem(ECOSYSTEM_TOKEN_KEY, event.data.token)
            callback(event.data.token)
        }
    }
    window.addEventListener('message', handler)
    return () => window.removeEventListener('message', handler)
}

// ── Token Verification ──

/**
 * Verify an ecosystem token with the server.
 * The server checks it against the Trust Layer API.
 */
export async function verifyEcosystemToken(token: string): Promise<PassThroughResult> {
    try {
        const res = await fetch('/api/auth/ecosystem-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ecosystemToken: token }),
        })

        if (!res.ok) {
            localStorage.removeItem(ECOSYSTEM_TOKEN_KEY)
            return { authenticated: false, error: `Verification failed (${res.status})` }
        }

        const data = await res.json()
        return {
            authenticated: true,
            session: {
                userId: data.userId,
                email: data.email,
                name: data.name,
                pin: data.pin || '••••••',
                ecosystemToken: token,
                apps: data.apps || [
                    { appId: 'trustgen', appName: 'TrustGen', role: 'editor' },
                    { appId: 'trustvault', appName: 'TrustVault', role: 'editor' },
                ],
                expiresAt: data.expiresAt || Date.now() + 24 * 60 * 60 * 1000,
            },
        }
    } catch (err: any) {
        return { authenticated: false, error: err.message }
    }
}

// ── Auto-Auth Flow ──

/**
 * Attempt automatic authentication from Developer Portal.
 * Call this on app startup before showing the login page.
 */
export async function attemptPortalPassThrough(): Promise<PassThroughResult> {
    const token = detectEcosystemToken()
    if (!token) return { authenticated: false, error: 'No ecosystem token found' }
    return verifyEcosystemToken(token)
}

/**
 * Generate a redirect URL to Developer Portal for authentication.
 * After PIN entry, the portal redirects back with the ecosystem token.
 */
export function getPortalLoginUrl(): string {
    const returnUrl = encodeURIComponent(window.location.href)
    return `${PORTAL_ORIGIN}/login?return_to=${returnUrl}&app=trustgen`
}

// ── Session Management ──

/**
 * Keep the session alive with periodic re-verification.
 */
export function startSessionKeepAlive(
    token: string,
    onExpired: () => void
): () => void {
    const interval = setInterval(async () => {
        const result = await verifyEcosystemToken(token)
        if (!result.authenticated) {
            clearInterval(interval)
            onExpired()
        }
    }, TOKEN_CHECK_INTERVAL)

    return () => clearInterval(interval)
}

/**
 * Sign out — clear ecosystem token from all storage.
 */
export function clearPortalSession(): void {
    localStorage.removeItem(ECOSYSTEM_TOKEN_KEY)
    // Clear cookie
    document.cookie = `${ECOSYSTEM_SESSION_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
}

// ── App Switcher ──

/**
 * Navigate to another ecosystem app, carrying the auth token.
 */
export function switchToApp(appId: string, token: string): void {
    const appUrls: Record<string, string> = {
        trustvault: 'https://trustvault.trustlayer.app',
        trustgen: 'https://trustgen.trustlayer.app',
        chronicles: 'https://chronicles.trustlayer.app',
        trustbook: 'https://trustbook.trustlayer.app',
        'signal-chat': 'https://signal.trustlayer.app',
    }
    const baseUrl = appUrls[appId]
    if (baseUrl) {
        window.location.href = `${baseUrl}?ecosystem_token=${encodeURIComponent(token)}`
    }
}

// ── Helpers ──

function getCookie(name: string): string | null {
    const match = document.cookie.match(new RegExp(`(?:^|;)\\s*${name}\\s*=\\s*([^;]+)`))
    return match ? decodeURIComponent(match[1]) : null
}
