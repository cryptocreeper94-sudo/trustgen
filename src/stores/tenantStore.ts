/* ====== TrustGen — Tenant Store ====== */
import { create } from 'zustand'
import { api } from '../api/apiClient'

export interface TenantConfig {
    id: string
    name: string
    slug: string
    brandColor?: string
    logoUrl?: string
    features: {
        aiGeneration: boolean
        particleSystem: boolean
        postProcessing: boolean
        maxProjects: number
        maxAssets: number
    }
}

interface TenantState {
    tenant: TenantConfig | null
    loading: boolean

    loadTenant: (tenantId: string) => Promise<void>
    setTenant: (tenant: TenantConfig) => void
}

export const useTenantStore = create<TenantState>((set) => ({
    tenant: null,
    loading: false,

    loadTenant: async (tenantId) => {
        set({ loading: true })
        try {
            const tenant = await api.get<TenantConfig>(`/api/tenants/${tenantId}`)
            set({ tenant, loading: false })
        } catch {
            set({ loading: false })
        }
    },

    setTenant: (tenant) => set({ tenant }),
}))
