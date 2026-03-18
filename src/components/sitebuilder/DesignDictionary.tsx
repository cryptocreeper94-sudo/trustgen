/* ====== Lume Studio — Design Dictionary ======
 * Visual glossary for non-developers.
 * Shows layout/effect terms with descriptions, animated previews,
 * and "I want this" buttons that inject commands.
 */
import { useSiteBuilderStore } from '../../stores/useSiteBuilderStore'

interface DictEntry {
    term: string
    plain: string
    description: string
    command: string
    previewClass: string
}

const DICTIONARY_CATEGORIES: { label: string; icon: string; entries: DictEntry[] }[] = [
    {
        label: 'Layouts', icon: '📐',
        entries: [
            { term: 'Bento Grid', plain: 'Mixed-size cards in a grid', description: 'A grid where cards have different sizes — like a Japanese bento box with compartments of different sizes.', command: 'Add a feature grid', previewClass: 'dd-preview-bento' },
            { term: 'Split Screen', plain: 'Two halves side by side', description: 'The page is divided into two equal halves — content on one side, image on the other.', command: 'Add a hero section', previewClass: 'dd-preview-split' },
            { term: 'Full-Bleed', plain: 'Edge-to-edge, no margins', description: 'Content stretches all the way to the edges of the screen with no side margins.', command: 'Add a hero section with a gradient background', previewClass: 'dd-preview-bleed' },
            { term: 'Card Layout', plain: 'Info boxes in rows', description: 'Content organized into rectangular cards — like trading cards laid out on a table.', command: 'Add a 3-column feature card grid', previewClass: 'dd-preview-cards' },
        ],
    },
    {
        label: 'Sections', icon: '🧱',
        entries: [
            { term: 'Hero Section', plain: 'The big intro banner', description: 'The large, eye-catching banner at the top of a website — the first thing visitors see. Usually has a headline, subtitle, and buttons.', command: 'Add a hero section with a gradient background', previewClass: 'dd-preview-hero' },
            { term: 'Above the Fold', plain: 'What you see without scrolling', description: 'Everything visible on screen before you scroll down — the most important real estate on any page.', command: 'Add a hero section', previewClass: 'dd-preview-fold' },
            { term: 'CTA Block', plain: 'A "Sign Up Now" section', description: 'Call-to-Action — a section designed to get visitors to do something: sign up, buy, subscribe, or contact you.', command: 'Add a hero section', previewClass: 'dd-preview-cta' },
            { term: 'Pricing Table', plain: 'Plan comparison boxes', description: 'Side-by-side boxes showing different pricing tiers so customers can compare features and prices.', command: 'Add a pricing table', previewClass: 'dd-preview-pricing' },
            { term: 'Testimonial Cards', plain: 'Customer review quotes', description: 'Quotes from satisfied customers displayed in styled cards — builds trust and credibility.', command: 'Add a testimonial section', previewClass: 'dd-preview-testimonial' },
        ],
    },
    {
        label: 'Effects', icon: '✨',
        entries: [
            { term: 'Glassmorphism', plain: 'Frosted glass look', description: 'Elements that look like frosted glass — semi-transparent with a blurred background showing through. Very modern and premium.', command: 'Add a hero section', previewClass: 'dd-preview-glass' },
            { term: 'Gradient Background', plain: 'Colors that blend together', description: 'Instead of one solid color, two or more colors smoothly blend into each other across the background.', command: 'Add a hero section with a gradient background', previewClass: 'dd-preview-gradient' },
            { term: 'Orb Glow', plain: 'Floating color blobs', description: 'Soft, glowing circles of color that float in the background — adds depth and a premium feel.', command: 'Add a hero section', previewClass: 'dd-preview-orb' },
            { term: 'Box Shadow', plain: 'Cards that float above', description: 'A subtle shadow underneath elements that makes them look like they\'re floating above the page.', command: 'Add a feature grid', previewClass: 'dd-preview-shadow' },
        ],
    },
    {
        label: 'Animations', icon: '🎬',
        entries: [
            { term: 'Hover Lift', plain: 'Cards rise when you point', description: 'When you move your mouse over a card, it slides up slightly — like picking up a card from a table.', command: 'Add a feature grid', previewClass: 'dd-preview-hoverlift' },
            { term: 'Fade In on Scroll', plain: 'Things appear as you scroll', description: 'Content is invisible at first and smoothly fades into view as you scroll down the page.', command: 'Add a feature grid', previewClass: 'dd-preview-fadein' },
            { term: 'Typing Effect', plain: 'Text types itself out', description: 'Text appears one letter at a time, as if someone is typing it in real-time.', command: 'Add a heading that says "Welcome to the future"', previewClass: 'dd-preview-typing' },
            { term: 'Pulse', plain: 'A gentle breathing glow', description: 'An element gently glows brighter and dimmer in a rhythmic pattern — draws attention without being aggressive.', command: 'Add a hero section', previewClass: 'dd-preview-pulse' },
        ],
    },
    {
        label: 'Navigation', icon: '🧭',
        entries: [
            { term: 'Sticky Nav', plain: 'Menu follows as you scroll', description: 'The navigation bar stays fixed at the top of the screen even when you scroll down — always accessible.', command: 'Add a navigation bar', previewClass: 'dd-preview-sticky' },
            { term: 'Hamburger Menu', plain: 'The three-line mobile menu', description: 'On mobile, the full menu hides behind three horizontal lines (☰). Tap to expand, tap to collapse.', command: 'Add a navigation bar', previewClass: 'dd-preview-hamburger' },
            { term: 'Breadcrumbs', plain: 'Shows where you are', description: 'A trail showing your location in the site: Home > Products > Shoes — so you always know where you are.', command: 'Add a navigation bar', previewClass: 'dd-preview-breadcrumb' },
        ],
    },
    {
        label: 'Components', icon: '🧩',
        entries: [
            { term: 'Carousel / Slider', plain: 'Swipeable image slideshow', description: 'A row of images or content panels that you can swipe through, one at a time.', command: 'Add a testimonial section', previewClass: 'dd-preview-carousel' },
            { term: 'Accordion', plain: 'Expandable question list', description: 'Click a question to expand its answer. Click again to collapse it. Great for FAQs.', command: 'Add an FAQ section', previewClass: 'dd-preview-accordion' },
            { term: 'Modal / Dialog', plain: 'A popup box', description: 'A box that appears on top of the page — often used for confirmations, forms, or important messages.', command: 'Add a contact form', previewClass: 'dd-preview-modal' },
            { term: 'Toast Notification', plain: 'A brief pop-in message', description: 'A small notification that slides in from the corner, stays for a few seconds, then disappears. "Item added to cart!"', command: 'Add a contact form', previewClass: 'dd-preview-toast' },
        ],
    },
]

export function DesignDictionary() {
    const dictionaryOpen = useSiteBuilderStore(s => s.dictionaryOpen)
    const toggleDictionary = useSiteBuilderStore(s => s.toggleDictionary)
    const applyComponent = useSiteBuilderStore(s => s.applyComponent)

    if (!dictionaryOpen) return null

    return (
        <div className="sb-dict-overlay" onClick={toggleDictionary}>
            <div className="sb-dict" onClick={e => e.stopPropagation()}>
                <div className="sb-dict-header">
                    <div>
                        <h3>📖 Design Dictionary</h3>
                        <p className="sb-dict-subtitle">Browse design concepts — no prior knowledge needed</p>
                    </div>
                    <button className="sb-dict-close" onClick={toggleDictionary}>×</button>
                </div>
                <div className="sb-dict-body">
                    {DICTIONARY_CATEGORIES.map(cat => (
                        <div key={cat.label} className="sb-dict-category">
                            <h4 className="sb-dict-cat-label">
                                <span>{cat.icon}</span> {cat.label}
                            </h4>
                            <div className="sb-dict-entries">
                                {cat.entries.map(entry => (
                                    <div key={entry.term} className="sb-dict-entry">
                                        <div className={`sb-dict-preview ${entry.previewClass}`}>
                                            <div className="sb-dict-preview-inner" />
                                        </div>
                                        <div className="sb-dict-info">
                                            <div className="sb-dict-term">{entry.term}</div>
                                            <div className="sb-dict-plain">"{entry.plain}"</div>
                                            <div className="sb-dict-desc">{entry.description}</div>
                                        </div>
                                        <button
                                            className="sb-dict-use-btn"
                                            onClick={() => applyComponent(entry.command)}
                                        >
                                            I want this →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
