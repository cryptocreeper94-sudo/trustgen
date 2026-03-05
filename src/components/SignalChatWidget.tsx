/* ====== TrustGen — Signal Chat Widget ====== */
/* Side-tab → full chat modal, connects to dwtl.io Signal Chat WebSocket */
import { useState, useEffect, useRef, useCallback } from 'react'

const SIGNAL_API = 'https://dwtl.io'
const SIGNAL_WS = 'wss://dwtl.io/ws/chat'
const DEFAULT_CHANNEL = 'general'
const TOKEN_KEY = 'signal_chat_token'
const USER_KEY = 'signal_chat_user'
const MAX_MESSAGE_LENGTH = 2000

interface ChatUser {
    id: string
    username: string
    displayName: string
    avatarColor: string
    role: string
    trustLayerId: string
}

interface ChatMessage {
    id: string
    channelId: string
    userId: string
    username: string
    avatarColor: string
    content: string
    createdAt: string
    replyToId?: string
}

interface Channel {
    id: string
    name: string
    description: string
    category: string
}

export function SignalChatWidget() {
    const [open, setOpen] = useState(false)
    const [view, setView] = useState<'auth' | 'chat'>('auth')
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
    const [user, setUser] = useState<ChatUser | null>(null)
    const [token, setToken] = useState<string | null>(null)
    const [channels, setChannels] = useState<Channel[]>([])
    const [activeChannel, setActiveChannel] = useState(DEFAULT_CHANNEL)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const [typing, setTyping] = useState<string[]>([])
    const [onlineCount, setOnlineCount] = useState(0)
    const [authError, setAuthError] = useState('')
    const [authLoading, setAuthLoading] = useState(false)
    const [wsConnected, setWsConnected] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)

    const wsRef = useRef<WebSocket | null>(null)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // ── Restore session ──
    useEffect(() => {
        const savedToken = localStorage.getItem(TOKEN_KEY)
        const savedUser = localStorage.getItem(USER_KEY)
        if (savedToken && savedUser) {
            try {
                setToken(savedToken)
                setUser(JSON.parse(savedUser))
                setView('chat')
            } catch { /* bad data, stay on auth */ }
        }
    }, [])

    // ── Load channels ──
    useEffect(() => {
        fetch(`${SIGNAL_API}/api/chat/channels`)
            .then(r => r.json())
            .then(data => { if (Array.isArray(data)) setChannels(data) })
            .catch(() => { })
    }, [])

    // ── WebSocket connection ──
    const connectWS = useCallback(() => {
        if (!token || wsRef.current?.readyState === WebSocket.OPEN) return

        const ws = new WebSocket(SIGNAL_WS)
        wsRef.current = ws

        ws.onopen = () => {
            ws.send(JSON.stringify({
                type: 'join',
                token,
                channelId: activeChannel,
            }))
            setWsConnected(true)
        }

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data)
                switch (msg.type) {
                    case 'history':
                        setMessages(msg.messages || [])
                        break
                    case 'message':
                        setMessages(prev => [...prev, msg])
                        if (!open) setUnreadCount(c => c + 1)
                        break
                    case 'typing':
                        setTyping(prev => {
                            if (prev.includes(msg.username)) return prev
                            const next = [...prev, msg.username]
                            setTimeout(() => setTyping(p => p.filter(u => u !== msg.username)), 3000)
                            return next
                        })
                        break
                    case 'presence':
                        setOnlineCount(msg.onlineCount || 0)
                        break
                    case 'error':
                        console.warn('[Signal Chat]', msg.message)
                        break
                }
            } catch { /* ignore parse errors */ }
        }

        ws.onclose = () => {
            setWsConnected(false)
            // Auto-reconnect after 3s
            setTimeout(() => { if (token) connectWS() }, 3000)
        }

        ws.onerror = () => ws.close()
    }, [token, activeChannel, open])

    useEffect(() => {
        if (view === 'chat' && token && open) {
            connectWS()
        }
        return () => {
            // Don't close on cleanup — keep connection alive
        }
    }, [view, token, open, connectWS])

    // ── Auto-scroll ──
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // ── Auth ──
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setAuthLoading(true)
        setAuthError('')

        const form = e.target as HTMLFormElement
        const formData = new FormData(form)
        const endpoint = authMode === 'login' ? 'login' : 'register'
        const body: any = {
            username: formData.get('username'),
            password: formData.get('password'),
        }
        if (authMode === 'register') {
            body.email = formData.get('email')
            body.displayName = formData.get('displayName') || body.username
        }

        try {
            const res = await fetch(`${SIGNAL_API}/api/chat/auth/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
            const data = await res.json()

            if (!res.ok) {
                setAuthError(data.error || data.message || 'Authentication failed')
                setAuthLoading(false)
                return
            }

            localStorage.setItem(TOKEN_KEY, data.token)
            localStorage.setItem(USER_KEY, JSON.stringify(data.user))
            setToken(data.token)
            setUser(data.user)
            setView('chat')
        } catch (err: any) {
            setAuthError('Connection failed. Try again later.')
        }
        setAuthLoading(false)
    }

    // ── Send message ──
    const sendMessage = () => {
        if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return
        wsRef.current.send(JSON.stringify({
            type: 'message',
            content: input.trim().slice(0, MAX_MESSAGE_LENGTH),
        }))
        setInput('')
        inputRef.current?.focus()
    }

    // ── Send typing ──
    const handleTyping = () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
        wsRef.current?.send(JSON.stringify({ type: 'typing' }))
        typingTimeoutRef.current = setTimeout(() => { }, 2000)
    }

    // ── Switch channel ──
    const switchChannel = (channelName: string) => {
        setActiveChannel(channelName)
        setMessages([])
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'switch_channel',
                channelId: channelName,
            }))
        }
    }

    // ── Logout ──
    const logout = () => {
        wsRef.current?.close()
        wsRef.current = null
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setToken(null)
        setUser(null)
        setView('auth')
        setMessages([])
    }

    // ── Open handler ──
    const handleOpen = () => {
        setOpen(true)
        setUnreadCount(0)
    }

    const formatTime = (iso: string) => {
        try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
        catch { return '' }
    }

    return (
        <>
            {/* ═══ Side Tab ═══ */}
            {!open && (
                <button className="signal-tab" onClick={handleOpen} title="Signal Chat">
                    <span className="signal-tab-icon">💬</span>
                    <span className="signal-tab-label">Chat</span>
                    {unreadCount > 0 && (
                        <span className="signal-tab-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                </button>
            )}

            {/* ═══ Chat Modal ═══ */}
            {open && (
                <div className="signal-modal-backdrop" onClick={() => setOpen(false)}>
                    <div className="signal-modal" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="signal-header">
                            <div className="signal-header-left">
                                <span style={{ fontSize: 18 }}>💬</span>
                                <div>
                                    <div className="signal-header-title">Signal Chat</div>
                                    <div className="signal-header-status">
                                        {wsConnected ? (
                                            <><span className="signal-status-dot online" /> {onlineCount} online · #{activeChannel}</>
                                        ) : (
                                            <><span className="signal-status-dot offline" /> Connecting...</>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="signal-header-right">
                                {user && (
                                    <button className="signal-btn-icon" onClick={logout} title="Sign out">
                                        🚪
                                    </button>
                                )}
                                <button className="signal-btn-icon" onClick={() => setOpen(false)} title="Close">
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* ── Auth View ── */}
                        {view === 'auth' && (
                            <div className="signal-auth">
                                <div className="signal-auth-header">
                                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔐</div>
                                    <h3>{authMode === 'login' ? 'Sign In' : 'Create Account'}</h3>
                                    <p>Ecosystem-wide chat powered by Trust Layer</p>
                                </div>

                                <form onSubmit={handleAuth} className="signal-auth-form">
                                    <input
                                        name="username"
                                        type="text"
                                        placeholder="Username"
                                        required
                                        className="signal-input"
                                        autoComplete="username"
                                    />
                                    {authMode === 'register' && (
                                        <>
                                            <input
                                                name="email"
                                                type="email"
                                                placeholder="Email"
                                                required
                                                className="signal-input"
                                            />
                                            <input
                                                name="displayName"
                                                type="text"
                                                placeholder="Display Name"
                                                className="signal-input"
                                            />
                                        </>
                                    )}
                                    <input
                                        name="password"
                                        type="password"
                                        placeholder="Password"
                                        required
                                        className="signal-input"
                                        autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                                    />
                                    {authError && <div className="signal-error">{authError}</div>}
                                    <button type="submit" className="signal-btn-primary" disabled={authLoading}>
                                        {authLoading ? '⏳ Please wait...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                                    </button>
                                </form>

                                <div className="signal-auth-toggle">
                                    {authMode === 'login' ? (
                                        <>No account? <button onClick={() => { setAuthMode('register'); setAuthError('') }}>Register</button></>
                                    ) : (
                                        <>Have an account? <button onClick={() => { setAuthMode('login'); setAuthError('') }}>Sign In</button></>
                                    )}
                                </div>

                                <div className="signal-auth-footer">
                                    Or email <a href="mailto:team@dwsc.io">team@dwsc.io</a>
                                </div>
                            </div>
                        )}

                        {/* ── Chat View ── */}
                        {view === 'chat' && (
                            <div className="signal-chat-body">
                                {/* Channel sidebar */}
                                <div className="signal-channels">
                                    <div className="signal-channels-header">Channels</div>
                                    {channels.map(ch => (
                                        <button
                                            key={ch.id || ch.name}
                                            className={`signal-channel-item ${activeChannel === ch.name ? 'active' : ''}`}
                                            onClick={() => switchChannel(ch.name)}
                                        >
                                            # {ch.name}
                                        </button>
                                    ))}
                                    {channels.length === 0 && (
                                        <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '8px 12px' }}>
                                            Loading channels...
                                        </div>
                                    )}
                                </div>

                                {/* Messages */}
                                <div className="signal-messages-area">
                                    <div className="signal-messages">
                                        {messages.length === 0 && (
                                            <div className="signal-empty">
                                                <div style={{ fontSize: 32 }}>💬</div>
                                                <p>No messages yet in #{activeChannel}</p>
                                            </div>
                                        )}
                                        {messages.map(msg => (
                                            <div key={msg.id} className={`signal-message ${msg.userId === user?.id ? 'own' : ''}`}>
                                                <div
                                                    className="signal-avatar"
                                                    style={{ background: msg.avatarColor || '#8b5cf6' }}
                                                >
                                                    {(msg.username || '?')[0].toUpperCase()}
                                                </div>
                                                <div className="signal-message-body">
                                                    <div className="signal-message-header">
                                                        <span className="signal-message-name">{msg.username}</span>
                                                        <span className="signal-message-time">
                                                            {formatTime(msg.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div className="signal-message-content">
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>

                                    {/* Typing indicator */}
                                    {typing.length > 0 && (
                                        <div className="signal-typing">
                                            {typing.join(', ')} {typing.length === 1 ? 'is' : 'are'} typing...
                                        </div>
                                    )}

                                    {/* Input */}
                                    <div className="signal-input-bar">
                                        <input
                                            ref={inputRef}
                                            className="signal-input"
                                            placeholder={`Message #${activeChannel}...`}
                                            value={input}
                                            onChange={e => { setInput(e.target.value); handleTyping() }}
                                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                                            maxLength={MAX_MESSAGE_LENGTH}
                                        />
                                        <button
                                            className="signal-send-btn"
                                            onClick={sendMessage}
                                            disabled={!input.trim()}
                                        >
                                            ➤
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    )
}
