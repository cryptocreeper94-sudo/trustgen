/* ====== TrustGen — Command Palette ====== */
import { useState, useEffect, useRef, useCallback } from 'react'
import { useEngineStore } from '../store'
import { triggerModelImport } from './ModelImporter'
import { evaluateLumeIntent } from '../engine/lumeResolver'

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
    const [lumeIntent, setLumeIntent] = useState<any>(null)
    const [isListening, setIsListening] = useState(false)
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
        } else if (e.key === 'Enter' && filtered.length > 0 && filtered[activeIndex]) {
            executeCommand(filtered[activeIndex])
        } else if (e.key === 'Enter' && filtered.length === 0 && lumeIntent) {
            e.preventDefault()
            lumeIntent.action()
            setOpen(false)
            setQuery('')
            setLumeIntent(null)
        }
    }

    // ── Lume Auditory Mode (Voice-to-Code) ──
    const startListening = () => {
        // @ts-ignore
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (e: any) => {
            const transcript = e.results[0][0].transcript;
            setQuery(transcript);
            setLumeIntent(evaluateLumeIntent(transcript));
        };
        
        recognition.start();
    };

    if (!open) return null

    return (
        <div className="command-palette-overlay" onClick={() => setOpen(false)}>
            <div className="command-palette" onClick={e => e.stopPropagation()}>
                <div className="relative">
                    <input
                        ref={inputRef}
                        className="command-palette-input"
                        placeholder="Search commands or talk to Lume..."
                        value={query}
                        onChange={e => { 
                            setQuery(e.target.value); 
                            setActiveIndex(0);
                            // Live Lume compilation
                            if (e.target.value.trim().length > 3) {
                                setLumeIntent(evaluateLumeIntent(e.target.value));
                            } else {
                                setLumeIntent(null);
                            }
                        }}
                        onKeyDown={handleKeyDown}
                        style={{ paddingRight: '40px' }}
                    />
                    <button 
                        onClick={startListening}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-md transition-colors ${isListening ? 'bg-red-500/20 text-red-400 animate-pulse' : 'text-gray-400 hover:text-cyan-400 hover:bg-cyan-500/10'}`}
                        title="Voice-to-Code (Speak to Lume)"
                    >
                        🎤
                    </button>
                </div>
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
                    {filtered.length === 0 && lumeIntent && (
                        <div 
                            className="command-item active border border-cyan-500/30 bg-cyan-500/10"
                            onClick={() => {
                                lumeIntent.action();
                                setOpen(false);
                                setQuery('');
                            }}
                        >
                            <span className="command-item-icon">✨</span>
                            <div className="flex flex-col">
                                <span className="command-item-label text-cyan-300">Lume: {lumeIntent.intent}</span>
                                <span className="text-[10px] text-cyan-500/60 uppercase tracking-widest mt-1">
                                    Resolved by: {lumeIntent.layer} ({(lumeIntent.confidence * 100).toFixed(0)}%)
                                </span>
                            </div>
                        </div>
                    )}
                    {filtered.length === 0 && query.length > 5 && !lumeIntent && (
                        <div style={{ padding: '16px 20px' }}>
                            <div className="text-amber-400 text-sm font-semibold mb-1">⚠ Disambiguation Required</div>
                            <div className="text-xs text-white/50">Lume could not resolve this intent. Try rephrasing your command.</div>
                        </div>
                    )}
                    {filtered.length === 0 && query.length <= 5 && (
                        <div style={{ padding: '16px 20px', color: 'var(--text-muted)', fontSize: 13 }}>
                            No commands found
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
