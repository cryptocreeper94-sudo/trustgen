/* ====== Chronicles 3D Asset Pipeline — Unified Index ====== */
import { CHARACTERS, PETS } from './chroniclesAssets'
import { MODERN_ENVIRONMENT, MEDIEVAL_ENVIRONMENT, WILDWEST_ENVIRONMENT } from './chroniclesEnvironment'
import { MODERN_STOREFRONTS, MEDIEVAL_STOREFRONTS, WILDWEST_STOREFRONTS } from './chroniclesStorefronts'
import type { ChroniclesAsset, AssetEra, AssetCategory, AssetStatus } from './chroniclesAssets'

export type { ChroniclesAsset, AssetEra, AssetCategory, AssetStatus }

export const ALL_ASSETS: ChroniclesAsset[] = [
    ...CHARACTERS,
    ...PETS,
    ...MODERN_ENVIRONMENT,
    ...MEDIEVAL_ENVIRONMENT,
    ...WILDWEST_ENVIRONMENT,
    ...MODERN_STOREFRONTS,
    ...MEDIEVAL_STOREFRONTS,
    ...WILDWEST_STOREFRONTS,
]

export const ASSET_COUNTS = {
    total: ALL_ASSETS.length,
    byCategory: {
        character: ALL_ASSETS.filter(a => a.category === 'character').length,
        pet: ALL_ASSETS.filter(a => a.category === 'pet').length,
        environment: ALL_ASSETS.filter(a => a.category === 'environment').length,
        storefront: ALL_ASSETS.filter(a => a.category === 'storefront').length,
    },
    byEra: {
        modern: ALL_ASSETS.filter(a => a.era === 'modern').length,
        medieval: ALL_ASSETS.filter(a => a.era === 'medieval').length,
        'wild-west': ALL_ASSETS.filter(a => a.era === 'wild-west').length,
    },
    needsRigging: ALL_ASSETS.filter(a => a.needsRigging).length,
}

export const ERA_LABELS: Record<AssetEra, string> = {
    'modern': 'Modern',
    'medieval': 'Medieval',
    'wild-west': 'Wild West',
}

export const CATEGORY_LABELS: Record<AssetCategory, string> = {
    character: 'Characters',
    pet: 'Pets & Companions',
    environment: 'Environment Props',
    storefront: 'Business Storefronts',
}

export const STATUS_LABELS: Record<AssetStatus, string> = {
    pending: 'Pending',
    generating: 'Generating',
    generated: 'Generated',
    rigged: 'Rigged',
    complete: 'Complete',
}

export const STATUS_COLORS: Record<AssetStatus, string> = {
    pending: '#6b7280',
    generating: '#f59e0b',
    generated: '#3b82f6',
    rigged: '#8b5cf6',
    complete: '#10b981',
}

export const CATEGORY_ICONS: Record<AssetCategory, string> = {
    character: '🧑',
    pet: '🐾',
    environment: '🏗️',
    storefront: '🏪',
}

export const ERA_ICONS: Record<AssetEra, string> = {
    modern: '🏙️',
    medieval: '🏰',
    'wild-west': '🤠',
}
