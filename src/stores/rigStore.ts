/* ====== TrustGen — Rig Store ====== */
import { create } from 'zustand'
import type { JointMarker, RigTemplateName, RigMode, BoneDefinition } from '../types/rigTypes'
import { RIG_TEMPLATES, DEFAULT_RIG_STATE } from '../types/rigTypes'
import { createMarkersFromTemplate, mirrorPosition } from '../engine/autoRigEngine'
import type { Vec3 } from '../types'

interface RigStore {
    /* ── State ── */
    active: boolean
    mode: RigMode
    template: RigTemplateName
    markers: JointMarker[]
    activeMarkerId: string | null
    mirrorMode: boolean
    showBones: boolean
    showEnvelopes: boolean
    placementIndex: number
    bones: BoneDefinition[]
    /** Node ID being rigged */
    targetNodeId: string | null

    /* ── Actions ── */
    startRigging: (nodeId: string, template?: RigTemplateName) => void
    cancelRigging: () => void
    setTemplate: (template: RigTemplateName) => void
    setActiveMarker: (id: string | null) => void
    placeMarker: (id: string, position: Vec3) => void
    placeNextMarker: (position: Vec3) => void
    moveMarker: (id: string, position: Vec3) => void
    toggleMirrorMode: () => void
    toggleShowBones: () => void
    toggleShowEnvelopes: () => void
    setMode: (mode: RigMode) => void
    setBones: (bones: BoneDefinition[]) => void
    resetMarkers: () => void
}

export const useRigStore = create<RigStore>((set, get) => ({
    ...DEFAULT_RIG_STATE,
    targetNodeId: null,

    startRigging: (nodeId, template = 'humanoid') => {
        const tmpl = RIG_TEMPLATES[template]
        const markers = createMarkersFromTemplate(tmpl.joints)
        set({
            active: true,
            mode: 'placing',
            template,
            markers,
            activeMarkerId: markers.length > 0 ? markers[0].id : null,
            placementIndex: 0,
            bones: [],
            targetNodeId: nodeId,
        })
    },

    cancelRigging: () => {
        set({
            ...DEFAULT_RIG_STATE,
            targetNodeId: null,
        })
    },

    setTemplate: (template) => {
        const tmpl = RIG_TEMPLATES[template]
        const markers = createMarkersFromTemplate(tmpl.joints)
        set({
            template,
            markers,
            activeMarkerId: markers.length > 0 ? markers[0].id : null,
            placementIndex: 0,
            bones: [],
            mode: 'placing',
        })
    },

    setActiveMarker: (id) => set({ activeMarkerId: id }),

    placeMarker: (id, position) => {
        const { markers, mirrorMode } = get()
        const updated = markers.map(m => {
            if (m.id === id) {
                return { ...m, position, placed: true }
            }
            return m
        })

        // Mirror mode: auto-place the mirrored joint
        if (mirrorMode) {
            const sourceMarker = markers.find(m => m.id === id)
            if (sourceMarker?.mirrorId) {
                const mirroredPos = mirrorPosition(position)
                for (let i = 0; i < updated.length; i++) {
                    if (updated[i].id === sourceMarker.mirrorId) {
                        updated[i] = { ...updated[i], position: mirroredPos, placed: true }
                    }
                }
            }
        }

        set({ markers: updated })
    },

    placeNextMarker: (position) => {
        const { markers, placementIndex, mirrorMode } = get()
        // Find next unplaced marker
        const unplaced = markers.filter(m => !m.placed)
        if (unplaced.length === 0) return

        const target = unplaced[0]
        const updated = markers.map(m => {
            if (m.id === target.id) {
                return { ...m, position, placed: true }
            }
            return m
        })

        // Mirror mode
        if (mirrorMode && target.mirrorId) {
            const mirroredPos = mirrorPosition(position)
            for (let i = 0; i < updated.length; i++) {
                if (updated[i].id === target.mirrorId && !updated[i].placed) {
                    updated[i] = { ...updated[i], position: mirroredPos, placed: true }
                }
            }
        }

        // Advance to next unplaced
        const nextUnplaced = updated.find(m => !m.placed)
        set({
            markers: updated,
            activeMarkerId: nextUnplaced?.id || null,
            placementIndex: placementIndex + 1,
            mode: nextUnplaced ? 'placing' : 'adjusting',
        })
    },

    moveMarker: (id, position) => {
        const { markers, mirrorMode } = get()
        const updated = markers.map(m => {
            if (m.id === id) return { ...m, position }
            return m
        })

        if (mirrorMode) {
            const source = markers.find(m => m.id === id)
            if (source?.mirrorId) {
                const mirroredPos = mirrorPosition(position)
                for (let i = 0; i < updated.length; i++) {
                    if (updated[i].id === source.mirrorId) {
                        updated[i] = { ...updated[i], position: mirroredPos }
                    }
                }
            }
        }

        set({ markers: updated })
    },

    toggleMirrorMode: () => set(s => ({ mirrorMode: !s.mirrorMode })),
    toggleShowBones: () => set(s => ({ showBones: !s.showBones })),
    toggleShowEnvelopes: () => set(s => ({ showEnvelopes: !s.showEnvelopes })),
    setMode: (mode) => set({ mode }),
    setBones: (bones) => set({ bones }),

    resetMarkers: () => {
        const { template } = get()
        const tmpl = RIG_TEMPLATES[template]
        const markers = createMarkersFromTemplate(tmpl.joints)
        set({
            markers,
            activeMarkerId: markers.length > 0 ? markers[0].id : null,
            placementIndex: 0,
            bones: [],
            mode: 'placing',
        })
    },
}))
