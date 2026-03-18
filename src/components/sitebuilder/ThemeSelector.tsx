/* ====== Lume Studio — Theme Selector ======
 * Theme presets + custom color overrides for sites being built.
 */
import { useSiteBuilderStore, THEME_PRESETS } from '../../stores/useSiteBuilderStore'

export function ThemeSelector() {
    const themeSelectorOpen = useSiteBuilderStore(s => s.themeSelectorOpen)
    const toggleThemeSelector = useSiteBuilderStore(s => s.toggleThemeSelector)
    const siteTheme = useSiteBuilderStore(s => s.siteTheme)
    const setSiteTheme = useSiteBuilderStore(s => s.setSiteTheme)

    if (!themeSelectorOpen) return null

    return (
        <div className="sb-theme-overlay" onClick={toggleThemeSelector}>
            <div className="sb-theme-panel" onClick={e => e.stopPropagation()}>
                <div className="sb-theme-header">
                    <h3>🎨 Choose a Theme</h3>
                    <button className="sb-theme-close" onClick={toggleThemeSelector}>×</button>
                </div>
                <div className="sb-theme-body">
                    <div className="sb-theme-grid">
                        {THEME_PRESETS.map(preset => (
                            <button
                                key={preset.id}
                                className={`sb-theme-card ${siteTheme.id === preset.id ? 'active' : ''}`}
                                onClick={() => {
                                    setSiteTheme(preset)
                                    toggleThemeSelector()
                                }}
                            >
                                <div className="sb-theme-preview" style={{
                                    background: preset.colors.background,
                                    borderColor: preset.colors.primary + '30',
                                }}>
                                    <div className="sb-theme-preview-nav" style={{ background: preset.colors.surface }}>
                                        <span style={{ color: preset.colors.text, fontSize: '8px', fontWeight: 700 }}>Nav</span>
                                    </div>
                                    <div className="sb-theme-preview-hero" style={{
                                        background: `linear-gradient(135deg, ${preset.colors.primary}20, ${preset.colors.secondary}20)`,
                                    }}>
                                        <div style={{
                                            width: '40px', height: '4px', borderRadius: '2px',
                                            background: preset.colors.text, marginBottom: '3px',
                                        }} />
                                        <div style={{
                                            width: '28px', height: '3px', borderRadius: '2px',
                                            background: preset.colors.textSecondary,
                                        }} />
                                    </div>
                                    <div className="sb-theme-preview-cards" style={{ display: 'flex', gap: '3px', padding: '4px 6px' }}>
                                        {[0, 1, 2].map(i => (
                                            <div key={i} style={{
                                                flex: 1, height: '16px', borderRadius: '3px',
                                                background: preset.colors.surface,
                                                border: `1px solid ${preset.colors.text}10`,
                                            }} />
                                        ))}
                                    </div>
                                </div>
                                <div className="sb-theme-label">{preset.name}</div>
                                <div className="sb-theme-palette">
                                    {Object.values(preset.colors).slice(0, 5).map((c, i) => (
                                        <span key={i} className="sb-theme-swatch" style={{ background: c }} />
                                    ))}
                                </div>
                                {siteTheme.id === preset.id && <span className="sb-theme-active-badge">Active</span>}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
