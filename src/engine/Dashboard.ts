/* ====== TrustGen — User Dashboard ======
 * 3-column bento grid ultra-premium dashboard.
 * Follows Trust Layer Design System:
 *   - Void black (#06060a) + cyan (#06b6d4) palette
 *   - Glassmorphism panels
 *   - Floating orbs
 *   - Skeleton reveal animations
 *
 * Dashboard cards:
 *   - Recent Projects  (2-col span)
 *   - Quick Actions     (1-col)
 *   - Storage Usage     (1-col)
 *   - Recent Renders    (1-col)
 *   - AI Usage Stats    (1-col)
 *   - TrustBook Library (2-col span)
 *   - Activity Feed     (1-col)
 *   - Getting Started   (full-width for new users)
 */

import type { Tenant, SceneMeta, RenderMeta, Activity } from './TenantSystem'

// ── Types ──

export type CardSize = '1x1' | '2x1' | '3x1' | '1x2'

export interface DashboardCard {
    id: string
    title: string
    icon: string
    size: CardSize
    /** Order priority (lower = earlier) */
    order: number
    /** Whether the card is collapsible */
    collapsible: boolean
    /** Whether the card is visible */
    visible: boolean
}

export interface DashboardState {
    tenant: Tenant | null
    recentScenes: SceneMeta[]
    recentRenders: RenderMeta[]
    activityFeed: Activity[]
    stats: DashboardStats
    isNewUser: boolean
}

export interface DashboardStats {
    totalScenes: number
    totalRenders: number
    totalAssets: number
    storageUsedMB: number
    storageQuotaMB: number
    aiGenerationsUsed: number
    aiGenerationsQuota: number
    voiceMinutesUsed: number
    voiceMinutesQuota: number
    rendersThisMonth: number
    rendersQuota: number
}

// ── Card Definitions ──

export const DASHBOARD_CARDS: DashboardCard[] = [
    { id: 'getting-started', title: 'Getting Started', icon: '🚀', size: '3x1', order: 0, collapsible: true, visible: true },
    { id: 'recent-projects', title: 'Recent Projects', icon: '📁', size: '2x1', order: 1, collapsible: false, visible: true },
    { id: 'quick-actions', title: 'Quick Actions', icon: '⚡', size: '1x1', order: 2, collapsible: false, visible: true },
    { id: 'storage', title: 'Storage', icon: '💾', size: '1x1', order: 3, collapsible: true, visible: true },
    { id: 'recent-renders', title: 'Recent Renders', icon: '🎬', size: '1x1', order: 4, collapsible: true, visible: true },
    { id: 'ai-usage', title: 'AI Usage', icon: '🧠', size: '1x1', order: 5, collapsible: true, visible: true },
    { id: 'trustbook', title: 'TrustBook Library', icon: '📚', size: '2x1', order: 6, collapsible: true, visible: true },
    { id: 'activity', title: 'Activity', icon: '📊', size: '1x1', order: 7, collapsible: true, visible: true },
    { id: 'ecosystem', title: 'Ecosystem Apps', icon: '🌐', size: '1x1', order: 8, collapsible: true, visible: true },
    { id: 'plan', title: 'Your Plan', icon: '⭐', size: '1x1', order: 9, collapsible: true, visible: true },
]

// ── Quick Actions ──

export interface QuickAction {
    id: string
    label: string
    icon: string
    description: string
    action: string // route or action ID
}

export const QUICK_ACTIONS: QuickAction[] = [
    { id: 'new-scene', label: 'New Scene', icon: '➕', description: 'Start with a blank canvas', action: '/editor/new' },
    { id: 'from-template', label: 'From Template', icon: '📋', description: 'Pick a project template', action: '/editor/templates' },
    { id: 'story-mode', label: 'Story Mode', icon: '📖', description: 'Paste text → auto documentary', action: '/editor/story' },
    { id: 'import-model', label: 'Import Model', icon: '📦', description: 'Upload GLB/GLTF/FBX', action: '/editor/import' },
    { id: 'text-to-3d', label: 'Text to 3D', icon: '🧊', description: 'Generate from description', action: '/editor/text3d' },
    { id: 'record-voice', label: 'Record Voice', icon: '🎙️', description: 'Record narration with your mic', action: '/editor/record' },
    { id: 'import-ebook', label: 'Import from TrustBook', icon: '📚', description: 'Pull in your published ebook', action: '/editor/trustbook' },
    { id: 'view-renders', label: 'My Renders', icon: '🎬', description: 'View exported videos', action: '/renders' },
]

// ── Ecosystem Apps ──

export interface EcosystemApp {
    id: string
    name: string
    icon: string
    url: string
    description: string
    color: string
}

export const ECOSYSTEM_APPS: EcosystemApp[] = [
    { id: 'trustvault', name: 'TrustVault', icon: '🔐', url: 'https://trustvault.trustlayer.app', description: 'Developer Portal', color: '#06b6d4' },
    { id: 'trustbook', name: 'TrustBook', icon: '📚', url: 'https://trustbook.trustlayer.app', description: 'eBook Publishing', color: '#14b8a6' },
    { id: 'chronicles', name: 'Chronicles', icon: '📜', url: 'https://chronicles.trustlayer.app', description: 'Portfolio & Blog', color: '#38bdf8' },
    { id: 'signal-chat', name: 'Signal Chat', icon: '💬', url: 'https://signal.trustlayer.app', description: 'Real-Time Messaging', color: '#a855f7' },
    { id: 'darkwave', name: 'DarkWave IDE', icon: '🌊', url: 'https://darkwave.trustlayer.app', description: 'Ecosystem IDE', color: '#7c3aed' },
    { id: 'bomber3d', name: 'Bomber 3D', icon: '⛳', url: 'https://bomber3d.trustlayer.app', description: 'Golf Game', color: '#22d3ee' },
]

// ── CSS Classes (inline-ready for the ultra-premium bento grid) ──

export const DASHBOARD_STYLES = {
    /** Container for the entire dashboard */
    container: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '20px',
        padding: '32px',
        maxWidth: '1440px',
        margin: '0 auto',
        background: '#06060a',
        minHeight: '100vh',
    },
    /** Individual bento card */
    card: {
        background: 'rgba(16, 16, 26, 0.72)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        transition: 'all 0.3s ease',
        position: 'relative' as const,
        overflow: 'hidden' as const,
    },
    /** Card hover glow */
    cardHover: {
        border: '1px solid rgba(6, 182, 212, 0.3)',
        boxShadow: '0 8px 32px rgba(6, 182, 212, 0.15)',
    },
    /** Card title */
    cardTitle: {
        fontSize: '14px',
        fontWeight: 600,
        color: '#ffffff',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    /** Stat number */
    statValue: {
        fontSize: '32px',
        fontWeight: 700,
        background: 'linear-gradient(135deg, #06b6d4, #14b8a6)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    /** Stat label */
    statLabel: {
        fontSize: '12px',
        color: 'rgba(255,255,255,0.5)',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
    },
    /** Progress bar track */
    progressTrack: {
        height: '6px',
        borderRadius: '3px',
        background: 'rgba(255,255,255,0.08)',
        overflow: 'hidden' as const,
    },
    /** Progress bar fill */
    progressFill: (percentage: number) => ({
        height: '100%',
        borderRadius: '3px',
        background: percentage > 80
            ? 'linear-gradient(90deg, #ef4444, #dc2626)'
            : 'linear-gradient(90deg, #06b6d4, #14b8a6)',
        width: `${Math.min(100, percentage)}%`,
        transition: 'width 0.5s ease',
    }),
    /** Grid spans for card sizes */
    spans: {
        '1x1': { gridColumn: 'span 1' },
        '2x1': { gridColumn: 'span 2' },
        '3x1': { gridColumn: 'span 3' },
        '1x2': { gridColumn: 'span 1', gridRow: 'span 2' },
    } as Record<CardSize, React.CSSProperties>,
    /** Floating orb (background decoration) */
    orb: (color: string, x: number, y: number) => ({
        position: 'absolute' as const,
        width: '300px',
        height: '300px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
        left: `${x}%`,
        top: `${y}%`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none' as const,
        zIndex: 0,
    }),
    /** Quick action button */
    actionButton: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(255,255,255,0.03)',
        color: '#ffffff',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        fontSize: '13px',
        width: '100%',
        textAlign: 'left' as const,
    },
    /** Action button hover */
    actionButtonHover: {
        background: 'rgba(6, 182, 212, 0.1)',
        border: '1px solid rgba(6, 182, 212, 0.2)',
    },

    // ── Responsive breakpoints (applied via media query) ──
    /** Mobile: stack to single column */
    mobileOverrides: {
        gridTemplateColumns: '1fr',
    },
    /** Tablet: 2-column */
    tabletOverrides: {
        gridTemplateColumns: 'repeat(2, 1fr)',
    },
}

/**
 * Generate CSS string for the dashboard (for injecting into a style tag).
 */
export function getDashboardCSS(): string {
    return `
.tg-dashboard {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    padding: 32px;
    max-width: 1440px;
    margin: 0 auto;
    background: #06060a;
    min-height: 100vh;
    position: relative;
}
.tg-dashboard-card {
    background: rgba(16, 16, 26, 0.72);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    animation: tg-card-reveal 0.5s ease forwards;
    opacity: 0;
    transform: translateY(20px);
}
.tg-dashboard-card:hover {
    border-color: rgba(6, 182, 212, 0.3);
    box-shadow: 0 8px 32px rgba(6, 182, 212, 0.15);
}
.tg-card-span-1 { grid-column: span 1; }
.tg-card-span-2 { grid-column: span 2; }
.tg-card-span-3 { grid-column: span 3; }
.tg-card-title {
    font-size: 14px; font-weight: 600; color: #ffffff;
    text-transform: uppercase; letter-spacing: 0.05em;
    margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
}
.tg-stat-value {
    font-size: 32px; font-weight: 700;
    background: linear-gradient(135deg, #06b6d4, #14b8a6);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
}
.tg-stat-label {
    font-size: 12px; color: rgba(255,255,255,0.5);
    text-transform: uppercase; letter-spacing: 0.08em;
}
.tg-progress-track {
    height: 6px; border-radius: 3px; background: rgba(255,255,255,0.08); overflow: hidden;
}
.tg-progress-fill {
    height: 100%; border-radius: 3px;
    background: linear-gradient(90deg, #06b6d4, #14b8a6);
    transition: width 0.5s ease;
}
.tg-progress-fill.warning { background: linear-gradient(90deg, #ef4444, #dc2626); }
.tg-quick-action {
    display: flex; align-items: center; gap: 12px; padding: 12px 16px;
    border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.03); color: #fff;
    cursor: pointer; transition: all 0.2s ease; font-size: 13px; width: 100%;
}
.tg-quick-action:hover {
    background: rgba(6, 182, 212, 0.1); border-color: rgba(6, 182, 212, 0.2);
}
.tg-orb {
    position: absolute; width: 300px; height: 300px; border-radius: 50%;
    pointer-events: none; z-index: 0;
    animation: tg-orb-float 8s ease-in-out infinite;
}
.tg-orb-cyan { background: radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%); }
.tg-orb-teal { background: radial-gradient(circle, rgba(20,184,166,0.12) 0%, transparent 70%); }
.tg-scene-card {
    display: flex; flex-direction: column; gap: 8px; padding: 16px;
    border-radius: 12px; border: 1px solid rgba(255,255,255,0.06);
    background: rgba(255,255,255,0.02); cursor: pointer; transition: all 0.2s ease;
}
.tg-scene-card:hover { background: rgba(6,182,212,0.06); border-color: rgba(6,182,212,0.2); }
@keyframes tg-card-reveal {
    to { opacity: 1; transform: translateY(0); }
}
@keyframes tg-orb-float {
    0%, 100% { transform: translate(-50%, -50%) translateY(0); }
    50% { transform: translate(-50%, -50%) translateY(-20px); }
}
@media (max-width: 1024px) {
    .tg-dashboard { grid-template-columns: repeat(2, 1fr); }
    .tg-card-span-3 { grid-column: span 2; }
}
@media (max-width: 640px) {
    .tg-dashboard { grid-template-columns: 1fr; padding: 16px; }
    .tg-card-span-2, .tg-card-span-3 { grid-column: span 1; }
}`
}
