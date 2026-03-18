/* ====== Lume Studio — Site Builder Page ======
 * Full-page layout for the speak-to-reality site builder.
 * Left: Conversation panel. Right: Live preview.
 * Supports light/dark mode toggle (scoped to this page only).
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSiteBuilderStore } from '../stores/useSiteBuilderStore'
import { SiteConversation } from '../components/sitebuilder/SiteConversation'
import { SitePreview } from '../components/sitebuilder/SitePreview'
import { ComponentGallery } from '../components/sitebuilder/ComponentGallery'
import { DesignDictionary } from '../components/sitebuilder/DesignDictionary'
import { ThemeSelector } from '../components/sitebuilder/ThemeSelector'
import { PublishPanel } from '../components/sitebuilder/PublishPanel'

export function SiteBuilderPage() {
    const uiTheme = useSiteBuilderStore(s => s.uiTheme)
    const toggleUITheme = useSiteBuilderStore(s => s.toggleUITheme)
    const toggleGallery = useSiteBuilderStore(s => s.toggleGallery)
    const toggleDictionary = useSiteBuilderStore(s => s.toggleDictionary)
    const toggleThemeSelector = useSiteBuilderStore(s => s.toggleThemeSelector)
    const togglePublishPanel = useSiteBuilderStore(s => s.togglePublishPanel)
    const previewFullscreen = useSiteBuilderStore(s => s.previewFullscreen)
    const navigate = useNavigate()

    // Set theme data attribute on mount/change
    useEffect(() => {
        document.body.setAttribute('data-studio-theme', uiTheme)
        return () => document.body.removeAttribute('data-studio-theme')
    }, [uiTheme])

    return (
        <div className={`sb-page sb-theme-${uiTheme}`}>
            {/* Top Bar */}
            <header className="sb-topbar">
                <div className="sb-topbar-left">
                    <button className="sb-back-btn" onClick={() => navigate('/explore')} title="Back to TrustGen">
                        ← Back
                    </button>
                    <div className="sb-topbar-brand">
                        <span className="sb-topbar-logo">◈</span>
                        <span className="sb-topbar-title">Lume Studio</span>
                    </div>
                </div>

                <div className="sb-topbar-actions">
                    <button className="sb-toolbar-btn" onClick={toggleGallery} title="Component Gallery">
                        🧩 <span className="sb-toolbar-label">Components</span>
                    </button>
                    <button className="sb-toolbar-btn" onClick={toggleDictionary} title="Design Dictionary">
                        📖 <span className="sb-toolbar-label">Dictionary</span>
                    </button>
                    <button className="sb-toolbar-btn" onClick={toggleThemeSelector} title="Theme Selector">
                        🎨 <span className="sb-toolbar-label">Theme</span>
                    </button>
                    <button className="sb-toolbar-btn sb-publish-trigger" onClick={togglePublishPanel} title="Publish Site">
                        🚀 <span className="sb-toolbar-label">Publish</span>
                    </button>

                    <div className="sb-theme-toggle" onClick={toggleUITheme} title={`Switch to ${uiTheme === 'dark' ? 'light' : 'dark'} mode`}>
                        <div className={`sb-theme-toggle-track ${uiTheme}`}>
                            <span className="sb-theme-toggle-icon">
                                {uiTheme === 'dark' ? '🌙' : '☀️'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className={`sb-main ${previewFullscreen ? 'sb-preview-fs' : ''}`}>
                <div className="sb-panel-conversation">
                    <SiteConversation />
                </div>
                <div className="sb-panel-preview">
                    <SitePreview />
                </div>
            </div>

            {/* Modals */}
            <ComponentGallery />
            <DesignDictionary />
            <ThemeSelector />
            <PublishPanel />
        </div>
    )
}
