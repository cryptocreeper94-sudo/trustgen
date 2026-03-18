/* ====== Lume Studio — Component Gallery ======
 * Visual catalog of website components.
 * Click-to-add — injects the conversational command automatically.
 */
import { useSiteBuilderStore } from '../../stores/useSiteBuilderStore'

interface GalleryItem {
    name: string
    icon: string
    command: string
    description: string
}

const GALLERY_CATEGORIES: { label: string; items: GalleryItem[] }[] = [
    {
        label: 'Sections',
        items: [
            { name: 'Hero Section', icon: '🌟', command: 'Add a hero section with a gradient background', description: 'Full-width banner with headline, subtitle, and CTA buttons' },
            { name: 'Feature Grid', icon: '📦', command: 'Add a 3-column feature card grid', description: 'Cards showcasing key features or services' },
            { name: 'Testimonials', icon: '💬', command: 'Add a testimonial section', description: 'Customer quotes with avatars and star ratings' },
            { name: 'Pricing Table', icon: '💰', command: 'Add a pricing table', description: 'Side-by-side plan comparison with CTAs' },
            { name: 'FAQ Accordion', icon: '❓', command: 'Add an FAQ section', description: 'Expandable questions and answers' },
            { name: 'Footer', icon: '🦶', command: 'Add a footer', description: 'Multi-column footer with links and copyright' },
        ],
    },
    {
        label: 'Navigation',
        items: [
            { name: 'Nav Bar', icon: '🧭', command: 'Add a navigation bar with Home, About, Services, Contact', description: 'Sticky top bar with links and mobile hamburger' },
        ],
    },
    {
        label: 'Content',
        items: [
            { name: 'Heading', icon: '📝', command: 'Add a heading that says "Your Title Here"', description: 'Large centered section heading' },
            { name: 'Text Block', icon: '📄', command: 'Add a paragraph that says "Your content goes here"', description: 'Readable body text paragraph' },
        ],
    },
    {
        label: 'Forms',
        items: [
            { name: 'Contact Form', icon: '✉️', command: 'Add a contact form with name, email, and message', description: 'Input fields with submit button and focus states' },
            { name: 'Signup Form', icon: '📋', command: 'Add a signup form with name, email, and password', description: 'Registration form with styled inputs' },
        ],
    },
]

export function ComponentGallery() {
    const galleryOpen = useSiteBuilderStore(s => s.galleryOpen)
    const toggleGallery = useSiteBuilderStore(s => s.toggleGallery)
    const applyComponent = useSiteBuilderStore(s => s.applyComponent)

    if (!galleryOpen) return null

    return (
        <div className="sb-gallery-overlay" onClick={toggleGallery}>
            <div className="sb-gallery" onClick={e => e.stopPropagation()}>
                <div className="sb-gallery-header">
                    <h3>Component Gallery</h3>
                    <button className="sb-gallery-close" onClick={toggleGallery}>×</button>
                </div>
                <div className="sb-gallery-body">
                    {GALLERY_CATEGORIES.map(cat => (
                        <div key={cat.label} className="sb-gallery-category">
                            <h4 className="sb-gallery-cat-label">{cat.label}</h4>
                            <div className="sb-gallery-grid">
                                {cat.items.map(item => (
                                    <button
                                        key={item.name}
                                        className="sb-gallery-card"
                                        onClick={() => applyComponent(item.command)}
                                    >
                                        <span className="sb-gallery-icon">{item.icon}</span>
                                        <span className="sb-gallery-name">{item.name}</span>
                                        <span className="sb-gallery-desc">{item.description}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
