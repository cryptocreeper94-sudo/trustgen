/* ====== TrustGen — AI Generation Panel ====== */
/* In-house procedural generation — no external APIs */
// React not needed (JSX transform handles it)
import GeneratorPanel from './GeneratorPanel'

// ── Main AI Panel (now uses in-house generators) ──
export function AIGenerationPanel() {
    const handleGenerate = (type: string, config: any) => {
        // Dispatch to the scene engine
        const event = new CustomEvent('trustgen:generate', { detail: { type, config } })
        window.dispatchEvent(event)
    }

    return (
        <div style={{ height: '100%' }}>
            <GeneratorPanel onGenerate={handleGenerate} />
        </div>
    )
}

export default AIGenerationPanel
