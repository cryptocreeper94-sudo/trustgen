/* ====== TrustGen — Webhook / Event System ====== */
/* Event emitter for external service notifications */

export type TrustGenEvent =
    | 'scene.exported'
    | 'project.created'
    | 'project.deleted'
    | 'asset.uploaded'
    | 'asset.deleted'
    | 'user.registered'
    | 'user.login'
    | 'subscription.changed'
    | 'nft.minted'

export interface EventPayload {
    event: TrustGenEvent
    timestamp: number
    userId?: string
    tenantId?: string
    data: Record<string, any>
}

type EventHandler = (payload: EventPayload) => void

const handlers: Map<TrustGenEvent, Set<EventHandler>> = new Map()

export function onEvent(event: TrustGenEvent, handler: EventHandler): () => void {
    if (!handlers.has(event)) handlers.set(event, new Set())
    handlers.get(event)!.add(handler)
    return () => { handlers.get(event)?.delete(handler) }
}

export function emitEvent(event: TrustGenEvent, data: Record<string, any> = {}) {
    const payload: EventPayload = {
        event,
        timestamp: Date.now(),
        userId: localStorage.getItem('trustgen-user-id') || undefined,
        tenantId: localStorage.getItem('trustgen-tenant-id') || undefined,
        data,
    }

    // Dispatch to local handlers
    handlers.get(event)?.forEach(h => {
        try { h(payload) } catch (err) { console.error(`[TrustGen Event] Error in handler for ${event}:`, err) }
    })

    // Log for debugging
    console.log(`[TrustGen Event] ${event}`, payload)
}

export function clearAllHandlers() {
    handlers.clear()
}
