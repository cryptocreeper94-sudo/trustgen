/* ====== TrustGen — SSO Integration Stubs ====== */
/* Typed interfaces for OAuth2/OIDC/SAML SSO providers */

export interface SSOProvider {
    id: string
    name: string
    icon: string
    type: 'oidc' | 'saml' | 'oauth2'
}

export interface OIDCConfig {
    issuer: string
    clientId: string
    redirectUri: string
    scopes: string[]
    responseType: 'code' | 'token'
}

export interface SAMLConfig {
    entryPoint: string
    issuer: string
    cert: string
    callbackUrl: string
}

export interface SSOCallbackResult {
    token: string
    user: {
        id: string
        email: string
        name: string
        avatar?: string
    }
}

// ── Stub Functions ──
export async function initSSO(_provider: SSOProvider, _config: OIDCConfig | SAMLConfig): Promise<string> {
    console.warn('[TrustGen SSO] initSSO() is a stub — returns a redirect URL')
    throw new Error('SSO not yet configured. Contact admin.')
}

export async function handleSSOCallback(_provider: string, _params: Record<string, string>): Promise<SSOCallbackResult> {
    console.warn('[TrustGen SSO] handleSSOCallback() is a stub')
    throw new Error('SSO callback not yet configured.')
}

export async function refreshSSOToken(_provider: string, _refreshToken: string): Promise<string> {
    console.warn('[TrustGen SSO] refreshSSOToken() is a stub')
    throw new Error('SSO token refresh not yet configured.')
}

// ── Pre-defined Providers (stubs) ──
export const SSO_PROVIDERS: SSOProvider[] = [
    { id: 'google', name: 'Google Workspace', icon: '🔵', type: 'oidc' },
    { id: 'microsoft', name: 'Microsoft Entra', icon: '🟦', type: 'oidc' },
    { id: 'okta', name: 'Okta', icon: '🟡', type: 'oidc' },
    { id: 'saml', name: 'SAML 2.0', icon: '🔐', type: 'saml' },
]
