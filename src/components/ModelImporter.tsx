/* ====== TrustGen — Model Importer (Drag & Drop + File Select) ====== */
import { useState, useCallback, useRef } from 'react'
import { useEngineStore } from '../store'

export function ModelImporter() {
    const [dragging, setDragging] = useState(false)
    const addNode = useEngineStore(s => s.addNode)
    const fileRef = useRef<HTMLInputElement>(null)

    const handleFiles = useCallback((files: FileList) => {
        for (const file of Array.from(files)) {
            const ext = file.name.split('.').pop()?.toLowerCase()
            if (!ext || !['glb', 'gltf', 'fbx', 'obj'].includes(ext)) continue
            const url = URL.createObjectURL(file)
            addNode({
                kind: 'model',
                name: file.name.replace(/\.[^.]+$/, ''),
                modelUrl: url,
                transform: {
                    position: { x: 0, y: 0, z: 0 },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: { x: 1, y: 1, z: 1 },
                },
            })
        }
    }, [addNode])

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragging(true)
    }, [])

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragging(false)
    }, [])

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragging(false)
        if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
    }, [handleFiles])

    return (
        <>
            {/* Drop zone overlay */}
            <div
                className={`model-drop-zone ${dragging ? 'active' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
            >
                {dragging && (
                    <div className="drop-overlay">
                        <div className="drop-icon">📦</div>
                        <div className="drop-text">Drop 3D Model</div>
                        <div className="drop-formats">GLB · GLTF · FBX · OBJ</div>
                    </div>
                )}
            </div>
            {/* Hidden file input */}
            <input
                ref={fileRef}
                type="file"
                accept=".glb,.gltf,.fbx,.obj"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                    if (e.target.files?.length) handleFiles(e.target.files)
                    e.target.value = ''
                }}
            />
        </>
    )
}

/** Trigger file select dialog (call from sidebar button) */
export function triggerModelImport() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.glb,.gltf,.fbx,.obj'
    input.multiple = true
    input.onchange = () => {
        if (input.files?.length) {
            const store = useEngineStore.getState()
            for (const file of Array.from(input.files)) {
                const ext = file.name.split('.').pop()?.toLowerCase()
                if (!ext || !['glb', 'gltf', 'fbx', 'obj'].includes(ext)) continue
                const url = URL.createObjectURL(file)
                store.addNode({
                    kind: 'model',
                    name: file.name.replace(/\.[^.]+$/, ''),
                    modelUrl: url,
                    transform: {
                        position: { x: 0, y: 0, z: 0 },
                        rotation: { x: 0, y: 0, z: 0 },
                        scale: { x: 1, y: 1, z: 1 },
                    },
                })
            }
        }
    }
    input.click()
}
