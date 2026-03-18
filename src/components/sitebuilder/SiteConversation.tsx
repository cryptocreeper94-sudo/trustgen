/* ====== Lume Studio — Site Conversation Panel ======
 * Chat-style interface for conversational site building.
 * Users type or speak commands; system responds with what was built.
 */
import { useRef, useEffect } from 'react'
import { useSiteBuilderStore } from '../../stores/useSiteBuilderStore'

const SUGGESTIONS = [
    'Build me a hero section with a gradient background',
    'Add a navigation bar with Home, About, Services, Contact',
    'Create a 3-column feature card grid',
    'Add a contact form with name, email, and message',
    'Build a pricing table',
    'Add a testimonial section',
    'Create an FAQ accordion',
    'Add a footer',
]

export function SiteConversation() {
    const messages = useSiteBuilderStore(s => s.messages)
    const inputValue = useSiteBuilderStore(s => s.inputValue)
    const isProcessing = useSiteBuilderStore(s => s.isProcessing)
    const isListening = useSiteBuilderStore(s => s.isListening)
    const showSuggestions = useSiteBuilderStore(s => s.showSuggestions)
    const setInputValue = useSiteBuilderStore(s => s.setInputValue)
    const sendMessage = useSiteBuilderStore(s => s.sendMessage)
    const toggleVoice = useSiteBuilderStore(s => s.toggleVoice)
    const applyComponent = useSiteBuilderStore(s => s.applyComponent)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (inputValue.trim() && !isProcessing) {
            sendMessage(inputValue)
        }
    }

    return (
        <div className="sb-conversation">
            {/* Header */}
            <div className="sb-conv-header">
                <div className="sb-conv-title">
                    <span className="sb-conv-logo">◈</span>
                    <span>Lume Studio</span>
                    <span className="sb-conv-badge">English Mode</span>
                </div>
            </div>

            {/* Messages */}
            <div className="sb-conv-messages">
                {messages.length === 0 && showSuggestions && (
                    <div className="sb-conv-welcome">
                        <div className="sb-welcome-icon">◈</div>
                        <h3>What would you like to build?</h3>
                        <p>Describe your website in plain English — type it or speak it. I'll build it live.</p>
                        <div className="sb-suggestions">
                            {SUGGESTIONS.map((s, i) => (
                                <button key={i} className="sb-suggestion-chip" onClick={() => applyComponent(s)}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map(msg => (
                    <div key={msg.id} className={`sb-msg sb-msg-${msg.role}`}>
                        {msg.role === 'system' && <span className="sb-msg-avatar">◈</span>}
                        <div className="sb-msg-bubble">
                            <div className="sb-msg-content">{msg.content}</div>
                            {msg.componentUsed && (
                                <span className="sb-msg-tag">{msg.componentUsed}</span>
                            )}
                        </div>
                    </div>
                ))}

                {isProcessing && (
                    <div className="sb-msg sb-msg-system">
                        <span className="sb-msg-avatar">◈</span>
                        <div className="sb-msg-bubble sb-msg-typing">
                            <span className="sb-typing-dot" />
                            <span className="sb-typing-dot" />
                            <span className="sb-typing-dot" />
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form className="sb-conv-input-bar" onSubmit={handleSubmit}>
                <button
                    type="button"
                    className={`sb-voice-btn ${isListening ? 'sb-voice-active' : ''}`}
                    onClick={toggleVoice}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                >
                    {isListening ? '🔴' : '🎤'}
                </button>
                <input
                    ref={inputRef}
                    type="text"
                    className="sb-conv-input"
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder={isListening ? 'Listening...' : 'Describe what you want to build...'}
                    disabled={isProcessing}
                    autoFocus
                />
                <button
                    type="submit"
                    className="sb-send-btn"
                    disabled={!inputValue.trim() || isProcessing}
                >
                    →
                </button>
            </form>
        </div>
    )
}
