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
}

interface AuthState {
    user: User | null
    token: string | null
    isAuthenticated: boolean
    loading: boolean
    error: string | null

    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, name: string) => Promise<void>
    logout: () => void
    checkAuth: () => Promise<void>
    clearError: () => void
    setUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: localStorage.getItem('trustgen-auth-token'),
    isAuthenticated: false,
    loading: false,
    error: null,

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
}))
