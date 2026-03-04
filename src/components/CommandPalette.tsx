/* ====== TrustGen — Command Palette ====== */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useEngineStore } from '../store'
import { triggerModelImport } from './ModelImporter'
import type { ToolMode } from '../types'

interface Command {
    id: string
    icon: string
    label: string
    shortcut?: string
    action: () => void
    category: string
}

export function CommandPalette() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [activeIndex, setActiveIndex] = useState(0)
    const inputRef = useRef<HTMLInputElement>(null)

    const commands: Command[] = [
        // Tools
        { id: 'tool-select', icon: '🖱️', label: 'Select Tool', shortcut: 'Q', action: () => useEngineStore.getState().setTool('select'), category: 'Tools' },
        { id: 'tool-move', icon: '↔️', label: 'Move Tool', shortcut: 'W', action: () => useEngineStore.getState().setTool('translate'), category: 'Tools' },
        { id: 'tool-rotate', icon: '🔄', label: 'Rotate Tool', shortcut: 'E', action: () => useEngineStore.getState().setTool('rotate'), category: 'Tools' },
        { id: 'tool-scale', icon: '📏', label: 'Scale Tool', shortcut: 'R', action: () => useEngineStore.getState().setTool('scale'), category: 'Tools' },
        // Add objects
        { id: 'add-cube', icon: '🧊', label: 'Add Cube', action: () => useEngineStore.getState().addNode({ kind: 'mesh', name: 'Cube', primitive: 'box' }), category: 'Add' },
        { id: 'add-sphere', icon: '🔵', label: 'Add Sphere', action: () => useEngineStore.getState().addNode({ kind: 'mesh', name: 'Sphere', primitive: 'sphere' }), category: 'Add' },
        { id: 'add-cylinder', icon: '🫙', label: 'Add Cylinder', action: () => useEngineStore.getState().addNode({ kind: 'mesh', name: 'Cylinder', primitive: 'cylinder' }), category: 'Add' },
        { id: 'add-light', icon: '💡', label: 'Add Point Light', action: () => useEngineStore.getState().addNode({ kind: 'light', name: 'Light' }), category: 'Add' },
        { id: 'add-group', icon: '📁', label: 'Add Group', action: () => useEngineStore.getState().addNode({ kind: 'group', name: 'Group' }), category: 'Add' },
        { id: 'import-model', icon: '📦', label: 'Import 3D Model', action: () => triggerModelImport(), category: 'Add' },
        // Actions
        { id: 'undo', icon: '↩', label: 'Undo', shortcut: 'Ctrl+Z', action: () => useEngineStore.getState().undo(), category: 'Actions' },
        { id: 'redo', icon: '↪', label: 'Redo', shortcut: 'Ctrl+Shift+Z', action: () => useEngineStore.getState().redo(), category: 'Actions' },
        { id: 'copy', icon: '📋', label: 'Copy Selected', shortcut: 'Ctrl+C', action: () => useEngineStore.getState().copyNodes(), category: 'Actions' },
        { id: 'paste', icon: '📌', label: 'Paste', shortcut: 'Ctrl+V', action: () => useEngineStore.getState().pasteNodes(), category: 'Actions' },
        // View
        { id: 'toggle-grid', icon: '#', label: 'Toggle Grid', action: () => useEngineStore.setState(s => ({ editor: { ...s.editor, showGrid: !s.editor.showGrid } })), category: 'View' },
        { id: 'toggle-stats', icon: '📊', label: 'Toggle Stats', action: () => useEngineStore.getState().toggleStats(), category: 'View' },
        { id: 'toggle-sidebar', icon: '📐', label: 'Toggle Sidebar', action: () => useEngineStore.getState().toggleSidebar(), category: 'View' },
    ]

    const filtered = query
        ? commands.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
        : commands

    const executeCommand = useCallback((cmd: Command) => {
        cmd.action()
        setOpen(false)
        setQuery('')
        setActiveIndex(0)
    }, [])

    // Ctrl+K listener
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                setOpen(v => !v)
                setQuery('')
                setActiveIndex(0)
            }
            if (e.key === 'Escape') setOpen(false)
        }
        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [])

    // Focus input when opened
    useEffect(() => {
        if (open) setTimeout(() => inputRef.current?.focus(), 50)
    }, [open])

    // Arrow key navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex(i => Math.max(i - 1, 0))
        } else if (e.key === 'Enter' && filtered[activeIndex]) {
            executeCommand(filtered[activeIndex])
        }
    }

    if (!open) return null

    return (
        <div className="command-palette-overlay" onClick={() => setOpen(false)}>
            <div className="command-palette" onClick={e => e.stopPropagation()}>
                <input
                    ref={inputRef}
                    className="command-palette-input"
                    placeholder="Search commands..."
                    value={query}
                    onChange={e => { setQuery(e.target.value); setActiveIndex(0) }}
                    onKeyDown={handleKeyDown}
                />
                <div className="command-palette-results">
                    {filtered.map((cmd, i) => (
                        <div
                            key={cmd.id}
                            className={`command-item ${i === activeIndex ? 'active' : ''}`}
                            onClick={() => executeCommand(cmd)}
                            onMouseEnter={() => setActiveIndex(i)}
                        >
                            <span className="command-item-icon">{cmd.icon}</span>
                            <span className="command-item-label">{cmd.label}</span>
                            {cmd.shortcut && <span className="command-item-shortcut">{cmd.shortcut}</span>}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                            No commands found
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
