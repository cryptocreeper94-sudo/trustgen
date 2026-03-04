/* ====== TrustGen — Viewport Toolbar ====== */
import React from 'react'
import { useEngineStore } from '../store'
import type { ToolMode } from '../types'

const TOOLS: { mode: ToolMode; icon: string; label: string; key: string }[] = [
    { mode: 'select', icon: '🖱️', label: 'Select', key: 'Q' },
    { mode: 'translate', icon: '↔️', label: 'Move', key: 'W' },
    { mode: 'rotate', icon: '🔄', label: 'Rotate', key: 'E' },
    { mode: 'scale', icon: '📏', label: 'Scale', key: 'R' },
]

export function ViewportToolbar() {
    const tool = useEngineStore(s => s.editor.tool)
    const setTool = useEngineStore(s => s.setTool)
    const showGrid = useEngineStore(s => s.editor.showGrid)
    const snapping = useEngineStore(s => s.editor.snapping)
    const showStats = useEngineStore(s => s.editor.showStats)
    const gizmoSpace = useEngineStore(s => s.editor.gizmoSpace)
    const canUndo = useEngineStore(s => s.canUndo)
    const canRedo = useEngineStore(s => s.canRedo)
    const undo = useEngineStore(s => s.undo)
    const redo = useEngineStore(s => s.redo)
    const copyNodes = useEngineStore(s => s.copyNodes)
    const pasteNodes = useEngineStore(s => s.pasteNodes)

    // Keyboard shortcuts
    React.useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return
            const ctrl = e.ctrlKey || e.metaKey
            switch (e.key.toLowerCase()) {
                case 'q': setTool('select'); break
                case 'w': if (!ctrl) setTool('translate'); break
                case 'e': setTool('rotate'); break
                case 'r': setTool('scale'); break
                case 'c': if (ctrl) { e.preventDefault(); copyNodes() } break
                case 'v': if (ctrl) { e.preventDefault(); pasteNodes() } break
                case 'd': if (ctrl) {
                    e.preventDefault()
                    const sel = useEngineStore.getState().editor.selectedNodeId
                    if (sel) useEngineStore.getState().duplicateNode(sel)
                    break
                } break
                case 'z': if (ctrl) { e.preventDefault(); e.shiftKey ? redo() : undo() } break
                case 'delete': case 'backspace': {
                    const sel = useEngineStore.getState().editor.selectedNodeId
                    if (sel) useEngineStore.getState().removeNode(sel)
                    break
                }
            }
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [setTool, undo, redo, copyNodes, pasteNodes])

    return (
        <div className="viewport-toolbar">
            <div className="toolbar-group glass-card">
                {TOOLS.map(t => (
                    <button
                        key={t.mode}
                        className={`toolbar-btn ${tool === t.mode ? 'active' : ''}`}
                        onClick={() => setTool(t.mode)}
                        title={`${t.label} (${t.key})`}
                    >
                        {t.icon}
                    </button>
                ))}
            </div>

            <div className="toolbar-group glass-card">
                <button
                    className={`toolbar-btn ${showGrid ? 'active' : ''}`}
                    onClick={() => useEngineStore.setState(s => ({ editor: { ...s.editor, showGrid: !s.editor.showGrid } }))}
                    title="Toggle Grid"
                >
                    #
                </button>
                <button
                    className={`toolbar-btn ${snapping ? 'active' : ''}`}
                    onClick={() => useEngineStore.getState().setSnapping(!snapping)}
                    title="Toggle Snapping"
                >
                    🧲
                </button>
                <button
                    className="toolbar-btn"
                    onClick={() => useEngineStore.getState().setGizmoSpace(gizmoSpace === 'world' ? 'local' : 'world')}
                    title={`Space: ${gizmoSpace}`}
                >
                    {gizmoSpace === 'world' ? '🌐' : '📍'}
                </button>
            </div>

            <div className="toolbar-group glass-card">
                <button className={`toolbar-btn ${!canUndo ? 'disabled' : ''}`} onClick={undo} title="Undo (Ctrl+Z)">↩</button>
                <button className={`toolbar-btn ${!canRedo ? 'disabled' : ''}`} onClick={redo} title="Redo (Ctrl+Shift+Z)">↪</button>
            </div>

            <div className="toolbar-group glass-card">
                <button
                    className={`toolbar-btn ${showStats ? 'active' : ''}`}
                    onClick={() => useEngineStore.getState().toggleStats()}
                    title="Performance Stats"
                >
                    📊
                </button>
            </div>
        </div>
    )
}
