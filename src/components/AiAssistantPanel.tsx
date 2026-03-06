/* ====== TrustGen — Studio AI Assistant Panel ====== */
/* Chat interface with code blocks, apply-to-editor, and agent mode */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useStudioStore } from '../stores/studioStore'

// ── Types ──
interface AiMessage {
    id: string
    role: 'user' | 'assistant' | 'system'
    content: string
    timestamp: Date
    codeBlocks?: { language: string; code: string }[]
    thinking?: boolean
}

// ── Code block extractor ──
function extractCodeBlocks(text: string): { language: string; code: string }[] {
    const blocks: { language: string; code: string }[] = []
    const regex = /```(\w+)?\n([\s\S]*?)```/g
    let match
    while ((match = regex.exec(text)) !== null) {
        blocks.push({ language: match[1] || 'plaintext', code: match[2].trim() })
    }
    return blocks
}

// ── Render markdown-lite ──
function renderContent(text: string): string {
    return text
        .replace(/```(\w+)?\n([\s\S]*?)```/g, '') // remove code blocks (rendered separately)
        .replace(/`([^`]+)`/g, '<code class="ai-inline-code">$1</code>')
        .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
        .replace(/\n/g, '<br/>')
        .trim()
}

// ── Code Block Component ──
function CodeBlock({ block }: { block: { language: string; code: string } }) {
    const [copied, setCopied] = useState(false)
    const { activeFileId, setEditorContent, editorContent } = useStudioStore()

    const handleCopy = () => {
        navigator.clipboard.writeText(block.code)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleApply = () => {
        if (!activeFileId) return
        setEditorContent(block.code)
        useStudioStore.getState().addConsoleOutput('output', '🧠 AI code applied to editor')
    }

    const handleInsert = () => {
        if (!activeFileId) return
        setEditorContent(editorContent + '\n' + block.code)
        useStudioStore.getState().addConsoleOutput('output', '🧠 AI code inserted at end')
    }

    return (
        <div className="ai-code-block">
            <div className="ai-code-header">
                <span className="ai-code-lang">{block.language}</span>
                <div className="ai-code-actions">
                    <button onClick={handleCopy} className="ai-code-btn" title="Copy">
                        {copied ? '✅' : '📋'}
                    </button>
                    {activeFileId && (
                        <>
                            <button onClick={handleApply} className="ai-code-btn" title="Replace editor content">
                                ↩️
                            </button>
                            <button onClick={handleInsert} className="ai-code-btn" title="Insert at end">
                                ⬇️
                            </button>
                        </>
                    )}
                </div>
            </div>
            <pre className="ai-code-content"><code>{block.code}</code></pre>
        </div>
    )
}

// ── Message Component ──
function MessageBubble({ message }: { message: AiMessage }) {
    const isUser = message.role === 'user'
    const codeBlocks = message.codeBlocks || extractCodeBlocks(message.content)
    const textContent = renderContent(message.content)

    return (
        <div className={`ai-message ${isUser ? 'user' : 'assistant'}`}>
            <div className="ai-message-avatar">
                {isUser ? '👤' : message.thinking ? '💭' : '🧠'}
            </div>
            <div className="ai-message-body">
                {message.thinking ? (
                    <div className="ai-thinking">
                        <div className="ai-thinking-dots">
                            <span /><span /><span />
                        </div>
                        <span>Thinking...</span>
                    </div>
                ) : (
                    <>
                        {textContent && (
                            <div
                                className="ai-message-text"
                                dangerouslySetInnerHTML={{ __html: textContent }}
                            />
                        )}
                        {codeBlocks.map((block, i) => (
                            <CodeBlock key={i} block={block} />
                        ))}
                    </>
                )}
                <div className="ai-message-time">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>
        </div>
    )
}

// ══════════════════════════════════════════════
//  AI ASSISTANT PANEL
// ══════════════════════════════════════════════

export function AiAssistantPanel() {
    const { aiPanelOpen, editorContent, files, activeFileId } = useStudioStore()
    const [messages, setMessages] = useState<AiMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: "Hi! I'm your **TrustGen AI Assistant**. I can help you write code, debug issues, explain concepts, and generate 3D scenes.\n\nTry asking me:\n- \"Write a React component for...\"\n- \"Debug this error...\"\n- \"Generate a Three.js scene with...\"\n- \"Explain how this code works\"",
            timestamp: new Date(),
        },
    ])
    const [input, setInput] = useState('')
    const [agentMode, setAgentMode] = useState(false)
    const [streaming, setStreaming] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const sendMessage = useCallback(async () => {
        if (!input.trim() || streaming) return

        const userMsg: AiMessage = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input,
            timestamp: new Date(),
        }

        const thinkingMsg: AiMessage = {
            id: `thinking-${Date.now()}`,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            thinking: true,
        }

        setMessages(prev => [...prev, userMsg, thinkingMsg])
        setInput('')
        setStreaming(true)

        try {
            // Build context for the AI
            const activeFile = files.find(f => f.id === activeFileId)
            const context = {
                prompt: input,
                agentMode,
                currentFile: activeFile ? {
                    name: activeFile.name,
                    language: activeFile.language,
                    content: editorContent.slice(0, 4000), // Limit context
                } : null,
                projectFiles: files.filter(f => !f.is_folder).map(f => f.name).slice(0, 20),
            }

            // Call AI endpoint (uses existing apiClient)
            const { api } = await import('../api/apiClient')
            const response = await api.post<{ content: string; codeBlocks?: { language: string; code: string }[] }>(
                '/api/studio/ai/chat',
                context,
            )

            const assistantMsg: AiMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: response.content || "I couldn't generate a response. Please try again.",
                timestamp: new Date(),
                codeBlocks: response.codeBlocks,
            }

            setMessages(prev => prev.filter(m => !m.thinking).concat(assistantMsg))
        } catch {
            // Fallback: generate a helpful response locally
            const fallbackMsg: AiMessage = {
                id: `assistant-${Date.now()}`,
                role: 'assistant',
                content: generateFallbackResponse(input),
                timestamp: new Date(),
            }
            setMessages(prev => prev.filter(m => !m.thinking).concat(fallbackMsg))
        }

        setStreaming(false)
    }, [input, streaming, agentMode, files, activeFileId, editorContent])

    if (!aiPanelOpen) return null

    return (
        <div className="ai-panel">
            <div className="ai-panel-header">
                <span className="ai-panel-title">🧠 AI Assistant</span>
                <div className="ai-panel-controls">
                    <button
                        className={`ai-agent-toggle ${agentMode ? 'active' : ''}`}
                        onClick={() => setAgentMode(!agentMode)}
                        title={agentMode ? 'Agent mode: AI can edit files autonomously' : 'Chat mode: AI responds with suggestions'}
                    >
                        {agentMode ? '🤖 Agent' : '💬 Chat'}
                    </button>
                    <button
                        className="ai-close-btn"
                        onClick={() => useStudioStore.getState().toggleAiPanel()}
                    >×</button>
                </div>
            </div>

            <div className="ai-messages" ref={scrollRef}>
                {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
            </div>

            <div className="ai-input-area">
                {agentMode && (
                    <div className="ai-agent-badge">
                        🤖 Agent Mode — AI can read context and suggest edits
                    </div>
                )}
                <div className="ai-input-row">
                    <textarea
                        className="ai-input"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={agentMode ? 'Tell the agent what to do...' : 'Ask me anything...'}
                        rows={2}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault()
                                sendMessage()
                            }
                        }}
                    />
                    <button
                        className="ai-send-btn"
                        onClick={sendMessage}
                        disabled={!input.trim() || streaming}
                    >
                        {streaming ? '⏳' : '🚀'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ── Fallback response generator (when backend is unavailable) ──
function generateFallbackResponse(input: string): string {
    const lower = input.toLowerCase()

    if (lower.includes('component') || lower.includes('react')) {
        return `Here's a starter React component:\n\n\`\`\`typescript\nimport { useState } from 'react'\n\nexport function MyComponent() {\n  const [count, setCount] = useState(0)\n\n  return (\n    <div className="component">\n      <h2>My Component</h2>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(c => c + 1)}>+</button>\n    </div>\n  )\n}\n\`\`\`\n\nWould you like me to customize this further?`
    }

    if (lower.includes('three') || lower.includes('3d') || lower.includes('scene')) {
        return `Here's a basic Three.js scene setup:\n\n\`\`\`typescript\nimport * as THREE from 'three'\n\nconst scene = new THREE.Scene()\nconst camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)\nconst renderer = new THREE.WebGLRenderer({ antialias: true })\n\nconst geometry = new THREE.BoxGeometry(1, 1, 1)\nconst material = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.5 })\nconst cube = new THREE.Mesh(geometry, material)\nscene.add(cube)\n\ncamera.position.z = 5\n\`\`\`\n\nShall I add lighting, animation, or post-processing?`
    }

    if (lower.includes('debug') || lower.includes('fix') || lower.includes('error')) {
        return `I'd be happy to help debug! To give you the best assistance, I need:\n\n1. **The error message** — paste the full stack trace\n2. **The relevant code** — open the file in the editor and I'll have context\n3. **What you expected** vs what happened\n\n💡 **Tip**: With **Agent Mode** enabled, I can read the currently open file automatically for better context.`
    }

    if (lower.includes('shader') || lower.includes('glsl')) {
        return `Here's a simple GLSL fragment shader:\n\n\`\`\`glsl\nprecision mediump float;\nuniform float u_time;\nuniform vec2 u_resolution;\n\nvoid main() {\n  vec2 uv = gl_FragCoord.xy / u_resolution.xy;\n  vec3 color = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0, 2, 4));\n  gl_FragColor = vec4(color, 1.0);\n}\n\`\`\`\n\nThis creates an animated color gradient. Want me to make it more complex?`
    }

    return `I can help with that! Here are some things I excel at:\n\n- **Code generation** — React, TypeScript, Python, Rust, Go\n- **3D & shaders** — Three.js, R3F, GLSL, WebGPU\n- **Debugging** — Error analysis, performance profiling\n- **Architecture** — Design patterns, API design\n\nCould you provide more details about what you need?`
}

export default AiAssistantPanel
