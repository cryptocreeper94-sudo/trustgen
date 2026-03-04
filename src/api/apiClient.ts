/* ====== TrustGen — API Client ====== */
/* Centralized fetch wrapper with auth token + tenant ID injection */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
        super(message)
        this.name = 'ApiError'
        this.status = status
    }
}

function getToken(): string | null {
    return localStorage.getItem('trustgen-auth-token')
}

function getTenantId(): string | null {
    return localStorage.getItem('trustgen-tenant-id')
}

export async function apiRequest<T = any>(
    path: string,
    options: RequestInit = {},
): Promise<T> {
    const token = getToken()
    const tenantId = getTenantId()

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...(tenantId && { 'X-Tenant-ID': tenantId }),
        ...(options.headers as Record<string, string> || {}),
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    })

    if (!res.ok) {
        const body = await res.text()
        throw new ApiError(res.status, body)
    }

    // Handle 204 No Content
    if (res.status === 204) return undefined as any

    return res.json()
}

export const api = {
    get: <T = any>(path: string) => apiRequest<T>(path),
    post: <T = any>(path: string, body?: any) =>
        apiRequest<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
    put: <T = any>(path: string, body?: any) =>
        apiRequest<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
    delete: <T = any>(path: string) =>
        apiRequest<T>(path, { method: 'DELETE' }),
}
