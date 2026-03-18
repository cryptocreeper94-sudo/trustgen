/* ====== Lume Studio — Site Preview ======
 * Sandboxed iframe that renders the generated HTML/CSS in real-time.
 * Supports desktop/tablet/mobile viewport switching.
 */
import { useEffect, useRef } from 'react'
import { useSiteBuilderStore } from '../../stores/useSiteBuilderStore'

const DEVICE_WIDTHS = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
}

export function SitePreview() {
    const getFullPageHTML = useSiteBuilderStore(s => s.getFullPageHTML)
    const pages = useSiteBuilderStore(s => s.pages)
    const activePageId = useSiteBuilderStore(s => s.activePageId)
    const previewDevice = useSiteBuilderStore(s => s.previewDevice)
    const setPreviewDevice = useSiteBuilderStore(s => s.setPreviewDevice)
    const previewFullscreen = useSiteBuilderStore(s => s.previewFullscreen)
    const togglePreviewFullscreen = useSiteBuilderStore(s => s.togglePreviewFullscreen)
    const setActivePage = useSiteBuilderStore(s => s.setActivePage)
    const addPage = useSiteBuilderStore(s => s.addPage)
    const removePage = useSiteBuilderStore(s => s.removePage)

    const iframeRef = useRef<HTMLIFrameElement>(null)

    // Update iframe content whenever pages change
    const activePage = pages.find(p => p.id === activePageId)
    useEffect(() => {
        if (iframeRef.current) {
            const doc = iframeRef.current.contentDocument
            if (doc) {
                doc.open()
                doc.write(getFullPageHTML())
                doc.close()
            }
        }
    }, [activePage?.html, activePage?.css, getFullPageHTML])

    const isEmpty = !activePage?.html?.trim()

    return (
        <div className={`sb-preview ${previewFullscreen ? 'sb-preview-fullscreen' : ''}`}>
            {/* Toolbar */}
            <div className="sb-preview-toolbar">
                <div className="sb-preview-pages">
                    {pages.map(p => (
                        <button
                            key={p.id}
                            className={`sb-page-tab ${p.id === activePageId ? 'active' : ''}`}
                            onClick={() => setActivePage(p.id)}
                        >
                            {p.name}
                            {pages.length > 1 && (
                                <span className="sb-page-close" onClick={e => {
                                    e.stopPropagation()
                                    removePage(p.id)
                                }}>×</span>
                            )}
                        </button>
                    ))}
                    <button className="sb-page-add" onClick={() => {
                        const name = prompt('Page name:')
                        if (name) addPage(name)
                    }}>+</button>
                </div>

                <div className="sb-preview-devices">
                    {(['desktop', 'tablet', 'mobile'] as const).map(d => (
                        <button
                            key={d}
                            className={`sb-device-btn ${previewDevice === d ? 'active' : ''}`}
                            onClick={() => setPreviewDevice(d)}
                            title={d}
                        >
                            {d === 'desktop' ? '🖥️' : d === 'tablet' ? '📱' : '📲'}
                        </button>
                    ))}
                    <button
                        className="sb-device-btn"
                        onClick={togglePreviewFullscreen}
                        title={previewFullscreen ? 'Exit fullscreen' : 'Fullscreen preview'}
                    >
                        {previewFullscreen ? '⊡' : '⛶'}
                    </button>
                </div>
            </div>

            {/* Preview Frame */}
            <div className="sb-preview-frame" style={{
                maxWidth: DEVICE_WIDTHS[previewDevice],
                margin: previewDevice !== 'desktop' ? '0 auto' : undefined,
            }}>
                {isEmpty ? (
                    <div className="sb-preview-empty">
                        <div className="sb-preview-empty-icon">◈</div>
                        <h3>Your website will appear here</h3>
                        <p>Start by describing what you want to build in the conversation panel.</p>
                    </div>
                ) : (
                    <iframe
                        ref={iframeRef}
                        className="sb-preview-iframe"
                        sandbox="allow-scripts"
                        title="Site Preview"
                    />
                )}
            </div>
        </div>
    )
}
