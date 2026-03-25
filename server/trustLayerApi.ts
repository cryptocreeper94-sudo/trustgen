/* ====== TrustGen — Trust Layer API Client ====== */
/* HMAC-SHA256 authenticated API for blockchain integration with dwtl.io */

import crypto from 'crypto'

const TRUSTLAYER_BASE = process.env.TRUSTLAYER_BASE_URL || 'https://dwtl.io'
const API_KEY = process.env.TRUSTLAYER_API_KEY || ''
const API_SECRET = process.env.TRUSTLAYER_API_SECRET || ''

// ── HMAC Signature Construction ──
function createHmacSignature(method: string, path: string, body?: any): {
    signature: string; timestamp: string; apiKey: string
} {
    const timestamp = Date.now().toString()
    const bodyHash = body
        ? crypto.createHash('sha256').update(JSON.stringify(body)).digest('hex')
        : ''
    const canonical = `${method}:${path}:${API_KEY}:${timestamp}:${bodyHash}`
    const signature = crypto.createHmac('sha256', API_SECRET).update(canonical).digest('hex')

    return { signature, timestamp, apiKey: API_KEY }
}

function hmacHeaders(method: string, path: string, body?: any): Record<string, string> {
    const { signature, timestamp, apiKey } = createHmacSignature(method, path, body)
    return {
        'x-blockchain-key': apiKey,
        'x-blockchain-signature': signature,
        'x-blockchain-timestamp': timestamp,
        'Content-Type': 'application/json',
    }
}

// ── Generic HMAC-Authenticated Request ──
async function hmacRequest<T = any>(method: string, path: string, body?: any): Promise<T> {
    const headers = hmacHeaders(method, path, body)
    try {
        const res = await fetch(`${TRUSTLAYER_BASE}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(5000)
        })
        if (!res.ok) {
            const text = await res.text()
            throw new Error(`Trust Layer API error (${res.status}): ${text}`)
        }
        if (res.status === 204) return undefined as any
        return res.json()
    } catch (err: any) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
            throw new Error('Trust Layer API timeout: Service is unreachable')
        }
        throw err
    }
}

// ── Bearer-Authenticated Request (for user-scoped calls) ──
async function bearerRequest<T = any>(method: string, path: string, ecosystemToken: string, body?: any): Promise<T> {
    try {
        const res = await fetch(`${TRUSTLAYER_BASE}${path}`, {
            method,
            headers: {
                'Authorization': `Bearer ${ecosystemToken}`,
                'Content-Type': 'application/json',
            },
            body: body ? JSON.stringify(body) : undefined,
            signal: AbortSignal.timeout(5000)
        })
        if (!res.ok) {
            const text = await res.text()
            throw new Error(`Trust Layer Bearer error (${res.status}): ${text}`)
        }
        return res.json()
    } catch (err: any) {
        if (err.name === 'TimeoutError' || err.name === 'AbortError') {
            throw new Error('Trust Layer API timeout: Service is unreachable')
        }
        throw err
    }
}

// ════════════════════════════════════
//  ECOSYSTEM CREDENTIAL SYNC
// ════════════════════════════════════

/** Sync a newly registered user to the Trust Layer ecosystem so all apps share credentials */
export async function syncUserToEcosystem(
    email: string, password: string, displayName: string, username?: string
): Promise<{ success: boolean; trustLayerId: string; ecosystemSynced: boolean }> {
    return hmacRequest('POST', '/api/ecosystem/sync-user', {
        email, password, displayName, username: username || email.split('@')[0],
        sourceApp: 'trustgen',
    })
}

/** Verify credentials against the ecosystem — used as login fallback when local auth fails */
export async function verifyEcosystemCredentials(
    email: string, password: string
): Promise<{ valid: boolean; userId: string; displayName: string; trustLayerId: string }> {
    return hmacRequest('POST', '/api/ecosystem/verify-credentials', {
        email, password, sourceApp: 'trustgen',
    })
}

/** Propagate a password change to the ecosystem so all apps stay in sync */
export async function syncPasswordChange(email: string, newPassword: string): Promise<{ success: boolean }> {
    return hmacRequest('POST', '/api/ecosystem/sync-password', {
        email, newPassword, sourceApp: 'trustgen',
    })
}

/** Generate a Trust Layer ID for a new user */
export function generateTrustLayerId(): string {
    const ts = Date.now().toString(36)
    const rand = crypto.randomBytes(4).toString('hex')
    return `tl-${ts}-${rand}`
}

/** Validate ecosystem password policy: 8+ chars, 1 uppercase, 1 special char */
export function validateEcosystemPassword(password: string): { valid: boolean; message?: string } {
    if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' }
    if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain at least 1 uppercase letter' }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { valid: false, message: 'Password must contain at least 1 special character' }
    return { valid: true }
}

// ════════════════════════════════════
//  SSO TOKEN EXCHANGE
// ════════════════════════════════════
export interface EcosystemTokenResponse {
    ecosystemToken: string
    expiresIn: number
    userId: string
    email: string
    displayName: string
}

export async function exchangeSSOToken(hubSessionToken: string): Promise<EcosystemTokenResponse> {
    return hmacRequest('POST', '/api/auth/exchange-token', { hubSessionToken })
}

export async function verifySSOToken(ecosystemToken: string): Promise<{
    valid: boolean; userId: string; email: string; displayName: string
}> {
    const { signature, timestamp, apiKey } = createHmacSignature('GET', '/api/auth/sso/verify')
    const res = await fetch(`${TRUSTLAYER_BASE}/api/auth/sso/verify?token=${ecosystemToken}`, {
        headers: {
            'x-app-key': apiKey,
            'x-app-signature': signature,
            'x-app-timestamp': timestamp,
        },
    })
    if (!res.ok) throw new Error('SSO verification failed')
    return res.json()
}

// ════════════════════════════════════
//  HALLMARK SYSTEM
// ════════════════════════════════════
export interface HallmarkRequest {
    appId: string
    appName: string
    productName: string
    version: string
    releaseType: 'creation' | 'animation' | 'export' | 'genesis'
    userId: number | string
    metadata: {
        modelType?: string
        polyCount?: number
        format?: string
        creator?: string
        [key: string]: any
    }
    parentGenesis?: string
}

export interface HallmarkResponse {
    success: boolean
    hallmark: {
        hallmarkId: string
        thId: string
        verificationUrl: string
        darkwave: {
            txHash: string
            blockHeight: string
            status: string
        }
    }
}

export async function generateHallmark(params: HallmarkRequest): Promise<HallmarkResponse> {
    return hmacRequest('POST', '/api/hallmark/generate', params)
}

export async function verifyHallmark(hallmarkId: string): Promise<{
    verified: boolean
    hallmark: {
        thId: string; appName: string; productName: string
        dataHash: string; txHash: string; blockHeight: string; createdAt: string
    }
}> {
    return hmacRequest('GET', `/api/hallmark/${hallmarkId}/verify`)
}

// Helper: Generate hallmark for a TrustGen 3D creation
export async function hallmarkCreation(
    productName: string,
    userId: string | number,
    metadata: { modelType?: string; polyCount?: number; format?: string; creator?: string }
): Promise<HallmarkResponse> {
    return generateHallmark({
        appId: 'trustgen',
        appName: 'TrustGen',
        productName,
        version: '1.0',
        releaseType: 'creation',
        userId,
        metadata,
    })
}

// Genesis hallmark for TrustGen (first boot)
export async function createGenesisHallmark(): Promise<HallmarkResponse> {
    return generateHallmark({
        appId: 'trustgen',
        appName: 'TrustGen',
        productName: 'TrustGen 3D Engine',
        version: '1.0',
        releaseType: 'genesis',
        userId: 0,
        metadata: {
            description: 'TrustGen 3D Engine — Browser-based 3D creation, animation, and export platform',
            domain: 'trustgen.tlid.io',
            prefix: 'TN',
        },
        parentGenesis: 'TL-00000001',
    })
}

// ════════════════════════════════════
//  TRUST STAMPS (Audit Trail)
// ════════════════════════════════════
export type TrustStampCategory =
    | 'trustgen-create'
    | 'trustgen-animate'
    | 'trustgen-export'
    | 'trustgen-publish'
    | 'trustgen-purchase'

export async function createTrustStamp(
    ecosystemToken: string,
    category: TrustStampCategory,
    data: Record<string, any>
): Promise<{ success: boolean; stampId: string }> {
    return bearerRequest('POST', '/api/trust-stamp', ecosystemToken, { category, data })
}

export async function getUserTrustStamps(userId: string): Promise<any[]> {
    return hmacRequest('GET', `/api/trust-stamps/${userId}`)
}

// ════════════════════════════════════
//  IDENTITY ANCHORING
// ════════════════════════════════════
export async function anchorIdentity(userId: string, email: string, displayName: string): Promise<any> {
    return hmacRequest('POST', '/api/identity/anchor', {
        userId,
        email,
        displayName,
        app: 'trustgen',
    })
}

// ════════════════════════════════════
//  GUARDIAN SECURITY SCAN
// ════════════════════════════════════
export async function guardianScan(target: string, type: 'address' | 'url'): Promise<any> {
    return hmacRequest('POST', '/api/guardian/scan', { target, type })
}

// ════════════════════════════════════
//  TRUSTVAULT — ASSET STORAGE
// ════════════════════════════════════

/** Get a presigned URL for uploading a file to TrustVault */
export async function getPresignedUploadUrl(
    ecosystemToken: string, filename: string, mimetype: string
): Promise<{ uploadUrl: string; assetId: string; publicUrl: string }> {
    return bearerRequest('POST', '/api/vault/presign-upload', ecosystemToken, { filename, mimetype })
}

/** Upload asset metadata after file upload completes */
export async function registerVaultAsset(
    ecosystemToken: string,
    assetId: string,
    metadata: { name: string; type: string; size: number; hallmarkId?: string; format?: string }
): Promise<{ success: boolean; asset: { id: string; name: string; url: string } }> {
    return bearerRequest('POST', '/api/vault/register', ecosystemToken, { assetId, ...metadata })
}

/** List user's assets in TrustVault */
export async function getVaultAssets(ecosystemToken: string): Promise<{
    assets: { id: string; name: string; url: string; type: string; size: number; createdAt: string }[]
}> {
    return bearerRequest('GET', '/api/vault/assets', ecosystemToken)
}

// ════════════════════════════════════
//  WALLET & SIG BALANCE
// ════════════════════════════════════
export function deriveWalletAddress(userId: string | number): string {
    return '0x' + crypto.createHash('sha256')
        .update('trustlayer:member:' + userId)
        .digest('hex').slice(0, 40)
}

export async function getWalletBalance(address: string): Promise<{
    sig: string; shells: string; stSig: string; echoes: string
}> {
    return hmacRequest('GET', `/api/wallet/${address}/balance`)
}

export async function getWalletTransactions(address: string): Promise<any[]> {
    return hmacRequest('GET', `/api/wallet/${address}/transactions`)
}

// ════════════════════════════════════
//  PAYMENT METHODS
// ════════════════════════════════════
export async function getPaymentMethods(): Promise<{
    methods: { id: string; name: string; provider: string; enabled: boolean; description: string }[]
}> {
    return hmacRequest('GET', '/api/payment-methods')
}

// ════════════════════════════════════
//  AFFILIATE PROGRAM
// ════════════════════════════════════
export async function trackReferral(referralHash: string): Promise<any> {
    const res = await fetch(`${TRUSTLAYER_BASE}/api/affiliate/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralHash, platform: 'trustgen' }),
    })
    return res.json()
}

export async function getAffiliateDashboard(ecosystemToken: string): Promise<any> {
    return bearerRequest('GET', '/api/affiliate/dashboard', ecosystemToken)
}

export async function getAffiliateLink(ecosystemToken: string): Promise<{ link: string }> {
    return bearerRequest('GET', '/api/affiliate/link', ecosystemToken)
}

export async function requestAffiliatePayout(ecosystemToken: string): Promise<any> {
    return bearerRequest('POST', '/api/affiliate/request-payout', ecosystemToken)
}

// ════════════════════════════════════
//  NETWORK STATS
// ════════════════════════════════════
export async function getNetworkStats(): Promise<{
    tps: number; consensus: string; blockTime: string
    validators: number; totalStake: string; chainHeight: number
}> {
    const res = await fetch(`${TRUSTLAYER_BASE}/api/network/stats`)
    return res.json()
}
