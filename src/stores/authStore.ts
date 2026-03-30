/* ====== TrustGen — Auth Store ====== */
import { create } from 'zustand'
import { api } from '../api/apiClient'

export type SubscriptionTier = 'free' | 'pro' | 'enterprise'

export interface User {
    id: string
    email: string
    name: string
    tenantId: string
    avatar?: string
    emailVerified: boolean
    smsOptIn: boolean
    phone?: string
    subscriptionTier: SubscriptionTier
    stripeCustomerId?: string
    mustChangePassword?: boolean
}

/* ── Tier gating map ── */
type GatedAction = 'ai-generate' | 'export-glb' | 'animation' | 'post-processing' | 'save' | 'download'
const TIER_REQUIREMENTS: Record<GatedAction, SubscriptionTier> = {
    'save': 'free',
    'download': 'free',
    'ai-generate': 'free',
    'export-glb': 'pro',
    'animation': 'pro',
    'post-processing': 'pro',
}
const TIER_ORDER: SubscriptionTier[] = ['free', 'pro', 'enterprise']
function tierAtLeast(current: SubscriptionTier, required: SubscriptionTier): boolean {
    return TIER_ORDER.indexOf(current) >= TIER_ORDER.indexOf(required)
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    loading: boolean
    error: string | null

    /* ── Core auth ── */
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, name: string) => Promise<void>
    logout: () => void
    checkAuth: () => Promise<void>
    clearError: () => void
    setUser: (user: User) => void

    /* ── Demo mode helpers ── */
    /** True when user is browsing without an account */
    isGuest: () => boolean
    /** Checks auth — if not logged in, redirects to /login?returnTo=<current path>&reason=<action>.
     *  Returns true if authenticated, false if redirecting. */
    requireAuth: (action?: string) => boolean
    /** Checks if user's subscription tier allows the action. Returns the required tier or null if allowed. */
    canPerformAction: (action: GatedAction) => SubscriptionTier | null

    /* ── Biometric (WebAuthn) ── */
    biometricAvailable: () => boolean
    biometricLogin: () => Promise<void>
    registerBiometric: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: localStorage.getItem('trustgen-auth-token'),
    isAuthenticated: false,
    loading: false,
    error: null,

    /* ─────────── Core Auth ─────────── */

    login: async (email, password) => {
        set({ loading: true, error: null })
        try {
            const data = await api.post<{ token: string; user: User }>('/api/auth/login', { email, password })
            localStorage.setItem('trustgen-auth-token', data.token)
            localStorage.setItem('trustgen-tenant-id', data.user.tenantId)
            set({ user: data.user, token: data.token, isAuthenticated: true, loading: false })
        } catch (err: any) {
            set({ loading: false, error: err.message || 'Login failed' })
        }
    },

    register: async (email, password, name) => {
        set({ loading: true, error: null })
        try {
            const data = await api.post<{ token: string; user: User }>('/api/auth/register', { email, password, name })
            localStorage.setItem('trustgen-auth-token', data.token)
            localStorage.setItem('trustgen-tenant-id', data.user.tenantId)
            set({ user: data.user, token: data.token, isAuthenticated: true, loading: false })
        } catch (err: any) {
            set({ loading: false, error: err.message || 'Registration failed' })
        }
    },

    logout: () => {
        localStorage.removeItem('trustgen-auth-token')
        localStorage.removeItem('trustgen-tenant-id')
        set({ user: null, token: null, isAuthenticated: false })
    },

    checkAuth: async () => {
        const token = localStorage.getItem('trustgen-auth-token')
        if (!token) {
            set({ isAuthenticated: false })
            return
        }
        try {
            const data = await api.get<{ user: User }>('/api/auth/me')
            set({ user: data.user, isAuthenticated: true, token })
        } catch {
            localStorage.removeItem('trustgen-auth-token')
            set({ user: null, token: null, isAuthenticated: false })
        }
    },

    clearError: () => set({ error: null }),
    setUser: (user) => set({ user }),

    /* ─────────── Demo Mode Helpers ─────────── */

    isGuest: () => !get().isAuthenticated,

    requireAuth: (action?: string) => {
        if (get().isAuthenticated) return true
        const returnTo = encodeURIComponent(window.location.pathname + window.location.search)
        const reason = action ? `&reason=${encodeURIComponent(action)}` : ''
        window.location.href = `/login?returnTo=${returnTo}${reason}`
        return false
    },

    canPerformAction: (action: GatedAction): SubscriptionTier | null => {
        const user = get().user
        const currentTier: SubscriptionTier = user?.subscriptionTier || 'free'
        const requiredTier = TIER_REQUIREMENTS[action]
        if (tierAtLeast(currentTier, requiredTier)) return null
        return requiredTier // returns the tier needed to unlock
    },

    /* ─────────── Biometric (WebAuthn / Passkey) ─────────── */

    biometricAvailable: () => {
        return !!(window.PublicKeyCredential && typeof window.PublicKeyCredential === 'function')
    },

    biometricLogin: async () => {
        set({ loading: true, error: null })
        try {
            if (!window.PublicKeyCredential) {
                throw new Error('Biometric authentication is not supported on this device')
            }
            // Step 1: Get challenge from server
            const challenge = await api.post<{
                challenge: string
                rpId: string
                allowCredentials: { id: string; type: 'public-key' }[]
            }>('/api/auth/webauthn/login-challenge', {})

            // Step 2: Invoke browser biometric prompt
            const credential = await navigator.credentials.get({
                publicKey: {
                    challenge: Uint8Array.from(atob(challenge.challenge), c => c.charCodeAt(0)),
                    rpId: challenge.rpId,
                    allowCredentials: challenge.allowCredentials.map(c => ({
                        id: Uint8Array.from(atob(c.id), ch => ch.charCodeAt(0)),
                        type: c.type as PublicKeyCredentialType,
                    })),
                    timeout: 60000,
                    userVerification: 'preferred',
                },
            }) as PublicKeyCredential | null

            if (!credential) throw new Error('Biometric authentication was cancelled')

            // Step 3: Send assertion to server for verification
            const response = credential.response as AuthenticatorAssertionResponse
            const data = await api.post<{ token: string; user: User }>('/api/auth/webauthn/login-verify', {
                credentialId: credential.id,
                authenticatorData: btoa(String.fromCharCode(...new Uint8Array(response.authenticatorData))),
                clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(response.clientDataJSON))),
                signature: btoa(String.fromCharCode(...new Uint8Array(response.signature))),
            })

            localStorage.setItem('trustgen-auth-token', data.token)
            localStorage.setItem('trustgen-tenant-id', data.user.tenantId)
            set({ user: data.user, token: data.token, isAuthenticated: true, loading: false })
        } catch (err: any) {
            set({ loading: false, error: err.message || 'Biometric login failed' })
        }
    },

    registerBiometric: async () => {
        set({ loading: true, error: null })
        try {
            if (!window.PublicKeyCredential) {
                throw new Error('Biometric authentication is not supported on this device')
            }
            // Step 1: Get registration options from server
            const options = await api.post<{
                challenge: string
                rpId: string
                rpName: string
                userId: string
                userName: string
            }>('/api/auth/webauthn/register-challenge', {})

            // Step 2: Create credential via browser prompt
            const credential = await navigator.credentials.create({
                publicKey: {
                    challenge: Uint8Array.from(atob(options.challenge), c => c.charCodeAt(0)),
                    rp: { id: options.rpId, name: options.rpName },
                    user: {
                        id: Uint8Array.from(atob(options.userId), c => c.charCodeAt(0)),
                        name: options.userName,
                        displayName: options.userName,
                    },
                    pubKeyCredParams: [
                        { alg: -7, type: 'public-key' },   // ES256
                        { alg: -257, type: 'public-key' },  // RS256
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: 'platform',
                        userVerification: 'required',
                    },
                    timeout: 60000,
                },
            }) as PublicKeyCredential | null

            if (!credential) throw new Error('Biometric registration was cancelled')

            // Step 3: Send credential to server for storage
            const attestation = credential.response as AuthenticatorAttestationResponse
            await api.post('/api/auth/webauthn/register-verify', {
                credentialId: credential.id,
                attestationObject: btoa(String.fromCharCode(...new Uint8Array(attestation.attestationObject))),
                clientDataJSON: btoa(String.fromCharCode(...new Uint8Array(attestation.clientDataJSON))),
            })

            set({ loading: false })
        } catch (err: any) {
            set({ loading: false, error: err.message || 'Biometric registration failed' })
        }
    },
}))
