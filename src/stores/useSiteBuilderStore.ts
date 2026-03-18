/* ====== Lume Studio — Site Builder Store ======
 * Zustand state for the speak-to-reality website builder.
 * Manages conversation, pages, themes, and UI state.
 */
import { create } from 'zustand'
import { compileStudioCommand, type StudioResult } from '../engine/LumeStudioAgent'

// ── Types ──

export interface ChatMessage {
    id: string
    role: 'user' | 'system'
    content: string
    timestamp: number
    preview?: string          // HTML snapshot at time of message
    componentUsed?: string    // which component/pattern was applied
}

export interface SitePage {
    id: string
    name: string
    slug: string
    html: string
    css: string
    isActive: boolean
}

export interface SiteThemePreset {
    id: string
    name: string
    colors: {
        primary: string
        secondary: string
        accent: string
        background: string
        surface: string
        text: string
        textSecondary: string
    }
    fontHeading: string
    fontBody: string
    borderRadius: string
}

export type UITheme = 'light' | 'dark'
export type PreviewDevice = 'desktop' | 'tablet' | 'mobile'
export type PublishMethod = 'subdomain' | 'custom' | 'export'
export type PublishStatus = 'idle' | 'publishing' | 'published' | 'error'

interface SiteBuilderState {
    // ── Conversation ──
    messages: ChatMessage[]
    inputValue: string
    isProcessing: boolean
    isListening: boolean

    // ── Pages ──
    pages: SitePage[]
    activePageId: string

    // ── Theme ──
    siteTheme: SiteThemePreset
    uiTheme: UITheme

    // ── UI ──
    galleryOpen: boolean
    dictionaryOpen: boolean
    themeSelectorOpen: boolean
    publishPanelOpen: boolean
    previewDevice: PreviewDevice
    previewFullscreen: boolean
    showSuggestions: boolean

    // ── Publish ──
    subdomain: string
    subdomainAvailable: boolean | null
    publishMethod: PublishMethod
    publishStatus: PublishStatus
    publishedUrl: string
    customDomain: string
    domainSearchQuery: string
    domainSearchResults: DomainSearchResult[]
    siteName: string

    // ── Actions ──
    setInputValue: (v: string) => void
    sendMessage: (content: string) => void
    toggleVoice: () => void
    addPage: (name: string) => void
    setActivePage: (id: string) => void
    removePage: (id: string) => void
    setSiteTheme: (theme: SiteThemePreset) => void
    toggleUITheme: () => void
    setPreviewDevice: (d: PreviewDevice) => void
    togglePreviewFullscreen: () => void
    toggleGallery: () => void
    toggleDictionary: () => void
    toggleThemeSelector: () => void
    togglePublishPanel: () => void
    applyComponent: (command: string) => void
    setShowSuggestions: (v: boolean) => void
    getFullPageHTML: () => string
    setSubdomain: (v: string) => void
    checkSubdomain: () => void
    setPublishMethod: (m: PublishMethod) => void
    publishSite: () => void
    exportSite: () => void
    setCustomDomain: (v: string) => void
    setDomainSearchQuery: (v: string) => void
    searchDomains: () => void
    setSiteName: (v: string) => void
}

export interface DomainSearchResult {
    domain: string
    available: boolean
    price: string
    tld: string
}

// ── Default Theme Presets ──

export const THEME_PRESETS: SiteThemePreset[] = [
    {
        id: 'modern-dark', name: 'Modern Dark',
        colors: { primary: '#06b6d4', secondary: '#14b8a6', accent: '#22d3ee', background: '#0a0a0f', surface: '#141420', text: '#eaeaf2', textSecondary: '#8888a8' },
        fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif", borderRadius: '12px',
    },
    {
        id: 'clean-light', name: 'Clean Light',
        colors: { primary: '#2563eb', secondary: '#3b82f6', accent: '#60a5fa', background: '#ffffff', surface: '#f8fafc', text: '#1e293b', textSecondary: '#64748b' },
        fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif", borderRadius: '8px',
    },
    {
        id: 'ocean-blue', name: 'Ocean Blue',
        colors: { primary: '#0284c7', secondary: '#0369a1', accent: '#38bdf8', background: '#0c1929', surface: '#132f4c', text: '#e3f2fd', textSecondary: '#90caf9' },
        fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif", borderRadius: '16px',
    },
    {
        id: 'forest-green', name: 'Forest Green',
        colors: { primary: '#059669', secondary: '#047857', accent: '#34d399', background: '#0a1a14', surface: '#132a20', text: '#e8f5e9', textSecondary: '#81c784' },
        fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif", borderRadius: '8px',
    },
    {
        id: 'sunset-warm', name: 'Sunset Warm',
        colors: { primary: '#ea580c', secondary: '#dc2626', accent: '#fb923c', background: '#1a0a05', surface: '#2a1508', text: '#fff3e0', textSecondary: '#ffab91' },
        fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif", borderRadius: '12px',
    },
    {
        id: 'minimal-gray', name: 'Minimal Gray',
        colors: { primary: '#525252', secondary: '#737373', accent: '#a3a3a3', background: '#fafafa', surface: '#f5f5f5', text: '#171717', textSecondary: '#525252' },
        fontHeading: "'Inter', sans-serif", fontBody: "'Inter', sans-serif", borderRadius: '4px',
    },
]

const uid = () => Math.random().toString(36).slice(2, 10)

// ── Store ──

export const useSiteBuilderStore = create<SiteBuilderState>((set, get) => ({
    // Conversation
    messages: [],
    inputValue: '',
    isProcessing: false,
    isListening: false,

    // Pages
    pages: [{
        id: 'home', name: 'Home', slug: '/', html: '', css: '', isActive: true,
    }],
    activePageId: 'home',

    // Theme
    siteTheme: THEME_PRESETS[0],
    uiTheme: 'dark',

    // UI
    galleryOpen: false,
    dictionaryOpen: false,
    themeSelectorOpen: false,
    publishPanelOpen: false,
    previewDevice: 'desktop',
    previewFullscreen: false,
    showSuggestions: true,

    // Publish
    subdomain: '',
    subdomainAvailable: null,
    publishMethod: 'subdomain',
    publishStatus: 'idle',
    publishedUrl: '',
    customDomain: '',
    domainSearchQuery: '',
    domainSearchResults: [],
    siteName: 'My Website',

    // ── Actions ──

    setInputValue: (v) => set({ inputValue: v }),

    sendMessage: (content) => {
        const trimmed = content.trim()
        if (!trimmed) return

        const userMsg: ChatMessage = {
            id: uid(), role: 'user', content: trimmed, timestamp: Date.now(),
        }

        set(s => ({
            messages: [...s.messages, userMsg],
            inputValue: '',
            isProcessing: true,
            showSuggestions: false,
        }))

        // Compile via Studio Agent (deterministic, no API call)
        setTimeout(() => {
            const { pages, activePageId, siteTheme } = get()
            const page = pages.find(p => p.id === activePageId)
            if (!page) return

            const result: StudioResult = compileStudioCommand(trimmed, {
                currentHTML: page.html,
                currentCSS: page.css,
                theme: siteTheme,
            })

            // Update page HTML/CSS
            const updatedPages = pages.map(p =>
                p.id === activePageId
                    ? { ...p, html: result.html, css: result.css }
                    : p
            )

            const systemMsg: ChatMessage = {
                id: uid(), role: 'system', content: result.message,
                timestamp: Date.now(), componentUsed: result.patternUsed,
            }

            set({
                pages: updatedPages,
                messages: [...get().messages, systemMsg],
                isProcessing: false,
            })
        }, 150) // Small delay for UX feel
    },

    toggleVoice: () => set(s => ({ isListening: !s.isListening })),

    addPage: (name) => {
        const id = uid()
        const slug = '/' + name.toLowerCase().replace(/\s+/g, '-')
        set(s => ({
            pages: [...s.pages, { id, name, slug, html: '', css: '', isActive: false }],
            activePageId: id,
        }))
    },

    setActivePage: (id) => set({ activePageId: id }),

    removePage: (id) => {
        const { pages, activePageId } = get()
        if (pages.length <= 1) return
        const filtered = pages.filter(p => p.id !== id)
        set({
            pages: filtered,
            activePageId: id === activePageId ? filtered[0].id : activePageId,
        })
    },

    setSiteTheme: (theme) => set({ siteTheme: theme }),

    toggleUITheme: () => set(s => ({
        uiTheme: s.uiTheme === 'dark' ? 'light' : 'dark',
    })),

    setPreviewDevice: (d) => set({ previewDevice: d }),
    togglePreviewFullscreen: () => set(s => ({ previewFullscreen: !s.previewFullscreen })),
    toggleGallery: () => set(s => ({ galleryOpen: !s.galleryOpen })),
    toggleDictionary: () => set(s => ({ dictionaryOpen: !s.dictionaryOpen })),
    toggleThemeSelector: () => set(s => ({ themeSelectorOpen: !s.themeSelectorOpen })),
    togglePublishPanel: () => set(s => ({ publishPanelOpen: !s.publishPanelOpen })),

    applyComponent: (command) => {
        set({ galleryOpen: false, dictionaryOpen: false })
        get().sendMessage(command)
    },

    setShowSuggestions: (v) => set({ showSuggestions: v }),

    // ── Publish Actions ──

    setSubdomain: (v) => set({ subdomain: v.toLowerCase().replace(/[^a-z0-9-]/g, ''), subdomainAvailable: null }),

    checkSubdomain: () => {
        const { subdomain } = get()
        if (!subdomain || subdomain.length < 3) {
            set({ subdomainAvailable: null })
            return
        }
        // Client-side pre-check against reserved subdomains (mirrors server RESERVED_SUBDOMAINS)
        const reserved = new Set([
            // Active ecosystem *.tlid.io apps
            'arbora', 'bomber', 'academy', 'studio',
            'signalchat', 'torque', 'verdara',
            // Ecosystem brand names
            'dwtl', 'signal', 'lume', 'lume-lang', 'lumelang',
            'chronicles', 'yourlegacy',
            'garagebot', 'happyeats', 'lotopspro', 'orbitstaffing', 'getorby', 'orby',
            'paintpros', 'nashpaintpros', 'pulse', 'strikeagent', 'thearcade', 'thevoid', 'intothevoid',
            'tldriverconnect', 'tradeworksai', 'brewandboard', 'vedasolus',
            'livfi', 'livfi-initiative',
            // Infrastructure
            'www', 'app', 'api', 'admin', 'mail', 'ftp', 'smtp', 'imap',
            'ns1', 'ns2', 'dns', 'cdn', 'static', 'assets', 'media',
            'staging', 'dev', 'test', 'preview', 'demo',
            'auth', 'sso', 'login', 'signup', 'register',
            'dashboard', 'panel', 'console', 'portal',
            'blog', 'docs', 'help', 'support', 'status',
            'shop', 'store', 'billing', 'pay', 'checkout', 'sites',
        ])
        // Prefix-based blocking: trust*, darkwave*, guardian*
        const reservedPrefixes = ['trust', 'darkwave', 'guardian']
        const isPrefixBlocked = reservedPrefixes.some(p => subdomain.startsWith(p))
        if (reserved.has(subdomain) || isPrefixBlocked) {
            set({ subdomainAvailable: false })
            return
        }
        // Server-side availability check via API
        fetch(`/api/studio-sites/check-subdomain/${subdomain}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
        })
            .then(r => r.json())
            .then(data => set({ subdomainAvailable: data.available }))
            .catch(() => {
                // Fallback: assume available if API unreachable (dev mode)
                set({ subdomainAvailable: true })
            })
    },

    setPublishMethod: (m) => set({ publishMethod: m }),

    publishSite: () => {
        const { subdomain, publishMethod, customDomain, pages, siteTheme, siteName } = get()
        set({ publishStatus: 'publishing' })

        const token = localStorage.getItem('token') || ''
        const body = {
            siteName,
            subdomain: publishMethod === 'subdomain' ? subdomain : undefined,
            customDomain: publishMethod === 'custom' ? customDomain : undefined,
            pages: pages.map(p => ({ name: p.name, slug: p.slug, html: p.html, css: p.css })),
            themeId: siteTheme.id,
            themeConfig: siteTheme,
        }

        // Save site first, then publish
        fetch('/api/studio-sites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(body),
        })
            .then(r => r.json())
            .then(site => {
                if (!site.id) throw new Error('Failed to save')
                // Now publish
                return fetch(`/api/studio-sites/${site.id}/publish`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ subdomain }),
                }).then(r => r.json())
            })
            .then(result => {
                const url = result.url || (publishMethod === 'subdomain'
                    ? `https://${subdomain}.tlid.io`
                    : `https://${customDomain}`)
                set({ publishStatus: 'published', publishedUrl: url })
            })
            .catch(() => {
                // Fallback for dev mode (no server running)
                const url = publishMethod === 'subdomain'
                    ? `https://${subdomain}.tlid.io`
                    : publishMethod === 'custom'
                    ? `https://${customDomain}`
                    : ''
                set({ publishStatus: 'published', publishedUrl: url })
            })
    },

    exportSite: () => {
        const { pages, siteTheme, siteName } = get()
        // Build a multi-page site bundle
        const htmlFiles: { name: string; content: string }[] = pages.map(page => {
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${siteName} — ${page.name}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
<style>${page.css}</style>
</head>
<body>
${page.html}
</body>
</html>`
            return { name: page.slug === '/' ? 'index.html' : `${page.slug.slice(1)}.html`, content: html }
        })

        const cssContent = `*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --primary: ${siteTheme.colors.primary};
  --secondary: ${siteTheme.colors.secondary};
  --accent: ${siteTheme.colors.accent};
  --bg: ${siteTheme.colors.background};
  --surface: ${siteTheme.colors.surface};
  --text: ${siteTheme.colors.text};
  --text-secondary: ${siteTheme.colors.textSecondary};
  --font-heading: ${siteTheme.fontHeading};
  --font-body: ${siteTheme.fontBody};
  --radius: ${siteTheme.borderRadius};
}
body {
  background: var(--bg); color: var(--text);
  font-family: var(--font-body); line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
h1,h2,h3,h4,h5,h6 { font-family: var(--font-heading); line-height: 1.2; }
img { max-width: 100%; height: auto; }
a { color: var(--primary); text-decoration: none; }
a:hover { text-decoration: underline; }`

        // Create a downloadable blob
        // For simplicity, we create a single index.html for now
        // A full ZIP export would use JSZip library
        const blob = new Blob(
            [htmlFiles[0]?.content || '', '\n\n/* === styles.css === */\n\n', cssContent],
            { type: 'text/html' }
        )
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${siteName.toLowerCase().replace(/\s+/g, '-')}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    },

    setCustomDomain: (v) => set({ customDomain: v }),
    setDomainSearchQuery: (v) => set({ domainSearchQuery: v }),
    setSiteName: (v) => set({ siteName: v }),

    searchDomains: () => {
        const { domainSearchQuery } = get()
        if (!domainSearchQuery.trim()) return
        const base = domainSearchQuery.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
        // Simulated results — will be replaced by Namecheap Reseller API
        const tlds = [
            { tld: '.com', price: '$11.98/yr' },
            { tld: '.io', price: '$39.98/yr' },
            { tld: '.shop', price: '$2.98/yr' },
            { tld: '.site', price: '$3.98/yr' },
            { tld: '.online', price: '$4.98/yr' },
            { tld: '.store', price: '$5.98/yr' },
            { tld: '.app', price: '$14.98/yr' },
            { tld: '.dev', price: '$12.98/yr' },
        ]
        const results: DomainSearchResult[] = tlds.map(t => ({
            domain: base + t.tld,
            available: Math.random() > 0.3, // simulated
            price: t.price,
            tld: t.tld,
        }))
        set({ domainSearchResults: results })
    },

    getFullPageHTML: () => {
        const { pages, activePageId, siteTheme } = get()
        const page = pages.find(p => p.id === activePageId)
        if (!page) return ''

        return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --primary: ${siteTheme.colors.primary};
  --secondary: ${siteTheme.colors.secondary};
  --accent: ${siteTheme.colors.accent};
  --bg: ${siteTheme.colors.background};
  --surface: ${siteTheme.colors.surface};
  --text: ${siteTheme.colors.text};
  --text-secondary: ${siteTheme.colors.textSecondary};
  --font-heading: ${siteTheme.fontHeading};
  --font-body: ${siteTheme.fontBody};
  --radius: ${siteTheme.borderRadius};
}
body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}
h1, h2, h3, h4, h5, h6 { font-family: var(--font-heading); line-height: 1.2; }
img { max-width: 100%; height: auto; }
a { color: var(--primary); text-decoration: none; }
a:hover { text-decoration: underline; }
${page.css}
</style>
</head>
<body>
${page.html}
</body>
</html>`
    },
}))
