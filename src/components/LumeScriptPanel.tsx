/* ====== TrustGen — Lume Script Panel ======
 * Embedded editor for writing Lume scripts in English Mode.
 * Features:
 * - Multi-line script editor with syntax hints
 * - Single-command input bar (REPL-style)
 * - Voice direction button (speak → execute)
 * - Command output log with success/error states
 * - Verb autocomplete reference
 */
import { useState, useRef, useCallback, useEffect } from 'react'
import { InfoBubble } from './Tooltip'
import {
    parseEnglish, compileIntent, compileScript, executeScript,
    startVoiceDirection, getAvailableVerbs,
    type LumeCommand, type LumeExecutionResult
} from '../engine/LumeEngine'

interface CommandLog {
    input: string
    command: LumeCommand
    result: LumeExecutionResult | null
    timestamp: number
}

type PanelMode = 'repl' | 'script' | 'voice' | 'reference'

export function LumeScriptPanel() {
    const [mode, setMode] = useState<PanelMode>('repl')
    const [replInput, setReplInput] = useState('')
    const [scriptSource, setScriptSource] = useState(EXAMPLE_SCRIPT)
    const [log, setLog] = useState<CommandLog[]>([])
    const [isVoiceActive, setIsVoiceActive] = useState(false)
    const [isRunning, setIsRunning] = useState(false)
    const voiceRef = useRef<{ stop: () => void } | null>(null)
    const logEndRef = useRef<HTMLDivElement>(null)

    // Auto-scroll log
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [log])

    // Mock executor (in production, wired to actual engine stores)
    const mockExecutor = useCallback(async (cmd: LumeCommand) => {
        // Simulate engine execution
        await new Promise(r => setTimeout(r, 100 + Math.random() * 200))
        return { executed: true, call: cmd.engineCall }
    }, [])

    // Execute a single REPL command
    const executeCommand = useCallback(async (input: string) => {
        if (!input.trim()) return
        const intent = parseEnglish(input)
        const command = compileIntent(intent)

        const entry: CommandLog = { input, command, result: null, timestamp: Date.now() }
        setLog(prev => [...prev, entry])

        try {
            const start = performance.now()
            const result = await mockExecutor(command)
            const execResult: LumeExecutionResult = {
                success: true, command, result, durationMs: performance.now() - start,
            }
            setLog(prev => prev.map((e, i) =>
                i === prev.length - 1 ? { ...e, result: execResult } : e
            ))
        } catch (err: any) {
            const execResult: LumeExecutionResult = {
                success: false, command, error: err.message, durationMs: 0,
            }
            setLog(prev => prev.map((e, i) =>
                i === prev.length - 1 ? { ...e, result: execResult } : e
            ))
        }
    }, [mockExecutor])

    // Execute full script
    const runScript = useCallback(async () => {
        setIsRunning(true)
        const script = compileScript(scriptSource)
        await executeScript(script, mockExecutor, {
            delayMs: 300,
            onProgress: (index, total, result) => {
                const cmd = script.commands[index]
                setLog(prev => [...prev, {
                    input: cmd.intent.raw,
                    command: cmd,
                    result,
                    timestamp: Date.now(),
                }])
            },
        })
        setIsRunning(false)
    }, [scriptSource, mockExecutor])

    // Voice control
    const toggleVoice = useCallback(() => {
        if (isVoiceActive && voiceRef.current) {
            voiceRef.current.stop()
            voiceRef.current = null
            setIsVoiceActive(false)
        } else {
            const voice = startVoiceDirection(async (cmd) => {
                setLog(prev => [...prev, {
                    input: cmd.intent.raw,
                    command: cmd,
                    result: null,
                    timestamp: Date.now(),
                }])
                try {
                    const start = performance.now()
                    const result = await mockExecutor(cmd)
                    const execResult: LumeExecutionResult = {
                        success: true, command: cmd, result, durationMs: performance.now() - start,
                    }
                    setLog(prev => {
                        const updated = [...prev]
                        updated[updated.length - 1] = { ...updated[updated.length - 1], result: execResult }
                        return updated
                    })
                } catch (_) { /* logged */ }
            })
            voiceRef.current = voice
            setIsVoiceActive(voice.isListening)
        }
    }, [isVoiceActive, mockExecutor])

    const verbs = getAvailableVerbs()

    return (
        <div className="lume-panel">
            {/* Header */}
            <div className="lume-header">
                <div className="lume-title">
                    <span className="lume-logo">◈</span>
                    <span>Lume</span>
                    <span className="lume-mode-badge">English Mode</span>
                    <InfoBubble text="Lume is Trust Layer's native language. English Mode lets you control TrustGen with natural language — type or speak commands like 'place a wooden desk in the center' and the engine executes them." />
                </div>
            </div>

            {/* Mode tabs */}
            <div className="lume-tabs">
                {([
                    { id: 'repl' as const, label: '⌨️ Command' },
                    { id: 'script' as const, label: '📜 Script' },
                    { id: 'voice' as const, label: '🎤 Voice' },
                    { id: 'reference' as const, label: '📖 Verbs' },
                ]).map(tab => (
                    <button
                        key={tab.id}
                        className={`lume-tab ${mode === tab.id ? 'active' : ''}`}
                        onClick={() => setMode(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── REPL Mode ── */}
            {mode === 'repl' && (
                <div className="lume-repl">
                    <div className="lume-log">
                        {log.length === 0 && (
                            <div className="lume-log-empty">
                                Type a command in English below.<br />
                                Example: <em>"place a wooden table in the center"</em>
                            </div>
                        )}
                        {log.map((entry, i) => (
                            <div key={i} className={`lume-log-entry ${entry.result?.success === false ? 'error' : ''}`}>
                                <div className="lume-log-input">▸ {entry.input}</div>
                                <div className="lume-log-explain">{entry.command.explain}</div>
                                <div className="lume-log-call">{entry.command.engineCall}({JSON.stringify(entry.command.args).slice(0, 60)}…)</div>
                                {entry.result && (
                                    <div className={`lume-log-status ${entry.result.success ? 'success' : 'error'}`}>
                                        {entry.result.success ? '✓' : '✗'} {entry.result.durationMs.toFixed(0)}ms
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                    <form
                        className="lume-input-bar"
                        onSubmit={e => { e.preventDefault(); executeCommand(replInput); setReplInput('') }}
                    >
                        <span className="lume-prompt">◈</span>
                        <input
                            type="text"
                            value={replInput}
                            onChange={e => setReplInput(e.target.value)}
                            placeholder="Type a command in English..."
                            className="lume-input"
                            autoFocus
                        />
                        <button type="submit" className="lume-run-btn" disabled={!replInput.trim()}>Run</button>
                    </form>
                </div>
            )}

            {/* ── Script Mode ── */}
            {mode === 'script' && (
                <div className="lume-script">
                    <textarea
                        value={scriptSource}
                        onChange={e => setScriptSource(e.target.value)}
                        className="lume-script-editor"
                        rows={12}
                        placeholder="Write your Lume script here...&#10;Each line is one command.&#10;&#10;Example:&#10;set environment to office&#10;place a desk in the center&#10;place a chair behind the desk&#10;narrate 'Welcome to TrustGen'"
                        spellCheck={false}
                    />
                    <div className="lume-script-actions">
                        <span className="lume-line-count">
                            {scriptSource.split('\n').filter(l => l.trim() && !l.startsWith('//')).length} commands
                        </span>
                        <button
                            className="lume-run-script-btn"
                            onClick={runScript}
                            disabled={isRunning || !scriptSource.trim()}
                        >
                            {isRunning ? '⏳ Running...' : '▶ Run Script'}
                        </button>
                    </div>
                </div>
            )}

            {/* ── Voice Mode ── */}
            {mode === 'voice' && (
                <div className="lume-voice">
                    <div className="lume-voice-status">
                        <div className={`lume-voice-indicator ${isVoiceActive ? 'active' : ''}`}>
                            <div className="lume-voice-ring" />
                            <div className="lume-voice-ring delay" />
                            <span className="lume-voice-icon">{isVoiceActive ? '🔴' : '🎤'}</span>
                        </div>
                        <h4>{isVoiceActive ? 'Listening...' : 'Voice Direction'}</h4>
                        <p>{isVoiceActive
                            ? 'Speak commands like "place a table" or "zoom in on the desk"'
                            : 'Click the button to start voice-controlled scene direction'
                        }</p>
                    </div>
                    <button
                        className={`lume-voice-btn ${isVoiceActive ? 'recording' : ''}`}
                        onClick={toggleVoice}
                    >
                        {isVoiceActive ? '⏹ Stop Listening' : '🎤 Start Voice Direction'}
                    </button>
                    {log.length > 0 && (
                        <div className="lume-voice-log">
                            {log.slice(-5).map((entry, i) => (
                                <div key={i} className="lume-voice-entry">
                                    <span className="lume-voice-transcript">"{entry.input}"</span>
                                    <span className="lume-voice-action">→ {entry.command.explain}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* ── Reference Mode ── */}
            {mode === 'reference' && (
                <div className="lume-reference">
                    <div className="lume-ref-intro">
                        <strong>16 verbs</strong> • <strong>80+ aliases</strong> • <strong>6 categories</strong>
                    </div>
                    {(['scene', 'animation', 'camera', 'audio', 'pipeline', 'query'] as const).map(cat => (
                        <div key={cat} className="lume-ref-category">
                            <div className="lume-ref-cat-label">{cat}</div>
                            {verbs.filter(v => v.category === cat).map(v => (
                                <div key={v.verb} className="lume-ref-verb">
                                    <span className="lume-ref-verb-name">{v.verb}</span>
                                    <span className="lume-ref-verb-desc">{v.description}</span>
                                    <span className="lume-ref-verb-aliases">
                                        {v.aliases.slice(0, 3).join(', ')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

// ── Example Script ──

const EXAMPLE_SCRIPT = `// My First TrustGen Scene
// Each line is a Lume English Mode command

set environment to office
place a wooden desk in the center
place a leather chair behind the desk
place a lamp on the desk

// Camera setup
focus on the desk from front
zoom in slowly over 3 seconds

// Narration
narrate "Welcome to TrustGen — where every creation is verified on the blockchain." with narrator voice

// Export
render at 1080p
publish to youtube`
