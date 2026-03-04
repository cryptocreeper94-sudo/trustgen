/* ====== TrustGen — Project Store ====== */
import { create } from 'zustand'
import { api } from '../api/apiClient'

export interface Project {
    id: string
    name: string
    description?: string
    thumbnailUrl?: string
    sceneData?: string // serialized JSON
    createdAt: string
    updatedAt: string
}

interface ProjectState {
    projects: Project[]
    currentProject: Project | null
    loading: boolean

    loadProjects: () => Promise<void>
    createProject: (name: string, description?: string) => Promise<Project>
    openProject: (id: string) => Promise<void>
    deleteProject: (id: string) => Promise<void>
    saveProject: (sceneData: string) => Promise<void>
    setCurrentProject: (project: Project | null) => void
}

export const useProjectStore = create<ProjectState>((set, get) => ({
    projects: [],
    currentProject: null,
    loading: false,

    loadProjects: async () => {
        set({ loading: true })
        try {
            const projects = await api.get<Project[]>('/api/projects')
            set({ projects, loading: false })
        } catch {
            set({ loading: false })
        }
    },

    createProject: async (name, description) => {
        const project = await api.post<Project>('/api/projects', { name, description })
        set(s => ({ projects: [project, ...s.projects] }))
        return project
    },

    openProject: async (id) => {
        const project = await api.get<Project>(`/api/projects/${id}`)
        set({ currentProject: project })
    },

    deleteProject: async (id) => {
        await api.delete(`/api/projects/${id}`)
        set(s => ({
            projects: s.projects.filter(p => p.id !== id),
            currentProject: s.currentProject?.id === id ? null : s.currentProject,
        }))
    },

    saveProject: async (sceneData) => {
        const current = get().currentProject
        if (!current) return
        const updated = await api.put<Project>(`/api/projects/${current.id}`, { sceneData })
        set(s => ({
            currentProject: updated,
            projects: s.projects.map(p => p.id === updated.id ? updated : p),
        }))
    },

    setCurrentProject: (project) => set({ currentProject: project }),
}))
