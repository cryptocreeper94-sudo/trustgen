/* ====== Lume Studio — Publish Panel ======
 * Deploy sites via .tlid.io subdomain, custom domain, or export.
 * Domain search integrates with dwtl.io (Namecheap reseller API placeholder).
 */
import { useSiteBuilderStore } from '../../stores/useSiteBuilderStore'

export function PublishPanel() {
    const publishPanelOpen = useSiteBuilderStore(s => s.publishPanelOpen)
    const togglePublishPanel = useSiteBuilderStore(s => s.togglePublishPanel)
    const publishMethod = useSiteBuilderStore(s => s.publishMethod)
    const setPublishMethod = useSiteBuilderStore(s => s.setPublishMethod)
    const subdomain = useSiteBuilderStore(s => s.subdomain)
    const setSubdomain = useSiteBuilderStore(s => s.setSubdomain)
    const subdomainAvailable = useSiteBuilderStore(s => s.subdomainAvailable)
    const checkSubdomain = useSiteBuilderStore(s => s.checkSubdomain)
    const publishStatus = useSiteBuilderStore(s => s.publishStatus)
    const publishedUrl = useSiteBuilderStore(s => s.publishedUrl)
    const publishSite = useSiteBuilderStore(s => s.publishSite)
    const exportSite = useSiteBuilderStore(s => s.exportSite)
    const customDomain = useSiteBuilderStore(s => s.customDomain)
    const setCustomDomain = useSiteBuilderStore(s => s.setCustomDomain)
    const domainSearchQuery = useSiteBuilderStore(s => s.domainSearchQuery)
    const setDomainSearchQuery = useSiteBuilderStore(s => s.setDomainSearchQuery)
    const domainSearchResults = useSiteBuilderStore(s => s.domainSearchResults)
    const searchDomains = useSiteBuilderStore(s => s.searchDomains)
    const siteName = useSiteBuilderStore(s => s.siteName)
    const setSiteName = useSiteBuilderStore(s => s.setSiteName)
    const pages = useSiteBuilderStore(s => s.pages)

    if (!publishPanelOpen) return null

    const hasContent = pages.some(p => p.html.trim().length > 0)

    return (
        <div className="sb-publish-overlay" onClick={togglePublishPanel}>
            <div className="sb-publish" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="sb-publish-header">
                    <div>
                        <h3>🚀 Publish Your Site</h3>
                        <p className="sb-publish-subtitle">Make your website live for the world to see</p>
                    </div>
                    <button className="sb-publish-close" onClick={togglePublishPanel}>×</button>
                </div>

                {/* Site Name */}
                <div className="sb-publish-body">
                    <div className="sb-publish-site-name">
                        <label className="sb-publish-label">Site Name</label>
                        <input
                            type="text"
                            className="sb-publish-input"
                            value={siteName}
                            onChange={e => setSiteName(e.target.value)}
                            placeholder="Your Website Name"
                        />
                    </div>

                    {/* Method Tabs */}
                    <div className="sb-publish-tabs">
                        <button
                            className={`sb-publish-tab ${publishMethod === 'subdomain' ? 'active' : ''}`}
                            onClick={() => setPublishMethod('subdomain')}
                        >
                            🌐 Free (.tlid.io)
                        </button>
                        <button
                            className={`sb-publish-tab ${publishMethod === 'custom' ? 'active' : ''}`}
                            onClick={() => setPublishMethod('custom')}
                        >
                            🔗 Custom Domain
                        </button>
                        <button
                            className={`sb-publish-tab ${publishMethod === 'export' ? 'active' : ''}`}
                            onClick={() => setPublishMethod('export')}
                        >
                            📦 Export
                        </button>
                    </div>

                    {/* ── Free Subdomain ── */}
                    {publishMethod === 'subdomain' && (
                        <div className="sb-publish-section">
                            <p className="sb-publish-info">
                                Get your site live instantly with a free <strong>.tlid.io</strong> subdomain.
                                No setup required — just pick a name and publish.
                            </p>
                            <div className="sb-subdomain-picker">
                                <div className="sb-subdomain-input-wrap">
                                    <span className="sb-subdomain-prefix">https://</span>
                                    <input
                                        type="text"
                                        className="sb-subdomain-input"
                                        value={subdomain}
                                        onChange={e => setSubdomain(e.target.value)}
                                        onBlur={checkSubdomain}
                                        placeholder="yoursite"
                                        maxLength={32}
                                    />
                                    <span className="sb-subdomain-suffix">.tlid.io</span>
                                </div>
                                {subdomain.length >= 3 && subdomainAvailable !== null && (
                                    <div className={`sb-subdomain-status ${subdomainAvailable ? 'available' : 'taken'}`}>
                                        {subdomainAvailable
                                            ? `✅ ${subdomain}.tlid.io is available!`
                                            : `❌ ${subdomain}.tlid.io is not available`}
                                    </div>
                                )}
                                {subdomain.length > 0 && subdomain.length < 3 && (
                                    <div className="sb-subdomain-status hint">
                                        Subdomain must be at least 3 characters
                                    </div>
                                )}
                            </div>

                            <button
                                className="sb-publish-btn"
                                disabled={!hasContent || !subdomain || subdomain.length < 3 || subdomainAvailable === false || publishStatus === 'publishing'}
                                onClick={publishSite}
                            >
                                {publishStatus === 'publishing' ? (
                                    <span className="sb-publish-spinner">Publishing...</span>
                                ) : (
                                    '🚀 Publish to .tlid.io'
                                )}
                            </button>
                        </div>
                    )}

                    {/* ── Custom Domain ── */}
                    {publishMethod === 'custom' && (
                        <div className="sb-publish-section">
                            {/* Domain Search — Buy through dwtl.io */}
                            <div className="sb-domain-search">
                                <h4 className="sb-publish-section-title">🛒 Buy a Domain</h4>
                                <p className="sb-publish-info">
                                    Search and register a domain through <a href="https://dwtl.io" target="_blank" rel="noopener noreferrer">dwtl.io</a> — our domain registry powered by Namecheap.
                                </p>
                                <div className="sb-domain-search-bar">
                                    <input
                                        type="text"
                                        className="sb-publish-input"
                                        value={domainSearchQuery}
                                        onChange={e => setDomainSearchQuery(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && searchDomains()}
                                        placeholder="Search for a domain name..."
                                    />
                                    <button className="sb-domain-search-btn" onClick={searchDomains}>
                                        Search
                                    </button>
                                </div>
                                {domainSearchResults.length > 0 && (
                                    <div className="sb-domain-results">
                                        {domainSearchResults.map(r => (
                                            <div key={r.domain} className={`sb-domain-result ${r.available ? 'available' : 'taken'}`}>
                                                <div className="sb-domain-name">
                                                    <span className="sb-domain-indicator">{r.available ? '✅' : '❌'}</span>
                                                    {r.domain}
                                                </div>
                                                <div className="sb-domain-meta">
                                                    {r.available ? (
                                                        <>
                                                            <span className="sb-domain-price">{r.price}</span>
                                                            <a
                                                                href={`https://dwtl.io/domains/${r.domain}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="sb-domain-buy-btn"
                                                            >
                                                                Register →
                                                            </a>
                                                        </>
                                                    ) : (
                                                        <span className="sb-domain-taken">Taken</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Connect Existing Domain */}
                            <div className="sb-domain-connect">
                                <h4 className="sb-publish-section-title">🔗 Connect Existing Domain</h4>
                                <p className="sb-publish-info">
                                    Already have a domain? Point it to your site with these DNS records.
                                </p>
                                <input
                                    type="text"
                                    className="sb-publish-input"
                                    value={customDomain}
                                    onChange={e => setCustomDomain(e.target.value)}
                                    placeholder="yourdomain.com"
                                />
                                {customDomain && (
                                    <div className="sb-dns-guide">
                                        <div className="sb-dns-title">DNS Configuration</div>
                                        <div className="sb-dns-records">
                                            <div className="sb-dns-record">
                                                <div className="sb-dns-row">
                                                    <span className="sb-dns-label">Type</span>
                                                    <span className="sb-dns-value">CNAME</span>
                                                </div>
                                                <div className="sb-dns-row">
                                                    <span className="sb-dns-label">Name</span>
                                                    <span className="sb-dns-value">www</span>
                                                </div>
                                                <div className="sb-dns-row">
                                                    <span className="sb-dns-label">Value</span>
                                                    <span className="sb-dns-value sb-dns-mono">sites.tlid.io</span>
                                                </div>
                                            </div>
                                            <div className="sb-dns-record">
                                                <div className="sb-dns-row">
                                                    <span className="sb-dns-label">Type</span>
                                                    <span className="sb-dns-value">A</span>
                                                </div>
                                                <div className="sb-dns-row">
                                                    <span className="sb-dns-label">Name</span>
                                                    <span className="sb-dns-value">@</span>
                                                </div>
                                                <div className="sb-dns-row">
                                                    <span className="sb-dns-label">Value</span>
                                                    <span className="sb-dns-value sb-dns-mono">76.76.21.21</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="sb-dns-note">
                                            Add these records at your domain registrar (Namecheap, GoDaddy, etc.).
                                            DNS changes can take up to 48 hours to propagate.
                                        </p>
                                    </div>
                                )}
                                <button
                                    className="sb-publish-btn"
                                    disabled={!hasContent || !customDomain || publishStatus === 'publishing'}
                                    onClick={publishSite}
                                >
                                    {publishStatus === 'publishing' ? 'Publishing...' : '🚀 Publish with Custom Domain'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ── Export ── */}
                    {publishMethod === 'export' && (
                        <div className="sb-publish-section">
                            <p className="sb-publish-info">
                                Download your website as clean HTML & CSS files. Host them anywhere —
                                Netlify, Vercel, GitHub Pages, your own server, or any web host.
                            </p>
                            <div className="sb-export-preview">
                                <div className="sb-export-file">
                                    <span className="sb-export-icon">📄</span>
                                    <div>
                                        <div className="sb-export-filename">index.html</div>
                                        <div className="sb-export-size">Main page with inline styles</div>
                                    </div>
                                </div>
                                {pages.length > 1 && pages.slice(1).map(p => (
                                    <div key={p.id} className="sb-export-file">
                                        <span className="sb-export-icon">📄</span>
                                        <div>
                                            <div className="sb-export-filename">{p.slug.slice(1)}.html</div>
                                            <div className="sb-export-size">{p.name} page</div>
                                        </div>
                                    </div>
                                ))}
                                <div className="sb-export-file">
                                    <span className="sb-export-icon">🎨</span>
                                    <div>
                                        <div className="sb-export-filename">styles.css</div>
                                        <div className="sb-export-size">Theme variables and base styles</div>
                                    </div>
                                </div>
                            </div>
                            <button
                                className="sb-publish-btn sb-export-btn"
                                disabled={!hasContent}
                                onClick={exportSite}
                            >
                                📦 Download Files
                            </button>
                        </div>
                    )}

                    {/* Published Success */}
                    {publishStatus === 'published' && publishedUrl && (
                        <div className="sb-publish-success">
                            <div className="sb-publish-success-icon">🎉</div>
                            <h4>Your site is live!</h4>
                            <a
                                href={publishedUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="sb-publish-url"
                            >
                                {publishedUrl}
                            </a>
                            <p className="sb-publish-success-note">
                                Share this link with anyone — your website is now accessible worldwide.
                            </p>
                        </div>
                    )}

                    {/* No Content Warning */}
                    {!hasContent && (
                        <div className="sb-publish-warning">
                            ⚠️ Your site is empty. Add some content first by describing what you want
                            in the conversation panel.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
