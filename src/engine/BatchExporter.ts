/* ====== TrustGen — Batch GLB Exporter ====== */
/* Exports composed prop scenes to GLB format for Chronicles integration */
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { composeFromRecipe } from './ProceduralComposer'
import type { PropRecipe } from './propTypes'

interface ExportResult {
    id: string
    name: string
    era: string
    success: boolean
    blob?: Blob
    error?: string
}

/**
 * Export a single prop recipe to GLB blob
 */
export async function exportRecipeToGLB(recipe: PropRecipe): Promise<ExportResult> {
    try {
        // Build the prop scene graph
        const group = composeFromRecipe(recipe)

        // Create a scene wrapper for export
        const scene = new THREE.Scene()
        scene.add(group)

        // Export to GLB
        const exporter = new GLTFExporter()
        const glb = await new Promise<ArrayBuffer>((resolve, reject) => {
            exporter.parse(
                scene,
                (result) => resolve(result as ArrayBuffer),
                (error) => reject(error),
                { binary: true }
            )
        })

        const blob = new Blob([glb], { type: 'application/octet-stream' })

        // Cleanup
        scene.traverse((obj) => {
            if (obj instanceof THREE.Mesh) {
                obj.geometry.dispose()
                if (obj.material instanceof THREE.Material) obj.material.dispose()
            }
        })

        return { id: recipe.id, name: recipe.name, era: recipe.era, success: true, blob }

    } catch (err) {
        return {
            id: recipe.id, name: recipe.name, era: recipe.era,
            success: false, error: String(err),
        }
    }
}

/**
 * Batch export all recipes, with progress callback
 */
export async function batchExportToGLB(
    recipes: PropRecipe[],
    onProgress?: (completed: number, total: number, current: ExportResult) => void,
): Promise<ExportResult[]> {
    const results: ExportResult[] = []
    const total = recipes.length

    for (let i = 0; i < recipes.length; i++) {
        const result = await exportRecipeToGLB(recipes[i])
        results.push(result)
        onProgress?.(i + 1, total, result)
    }

    return results
}

/**
 * Trigger browser download of a GLB blob
 */
export function downloadGLB(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
}

/**
 * Download all generated GLBs as a batch (one at a time to avoid browser blocking)
 */
export async function downloadAllGLBs(results: ExportResult[], delayMs = 500) {
    for (const result of results) {
        if (result.success && result.blob) {
            const filename = `${result.id}.glb`
            downloadGLB(result.blob, filename)
            await new Promise(r => setTimeout(r, delayMs))
        }
    }
}
