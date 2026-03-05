/* ====== TrustGen — Legal Hub ====== */
import { useNavigate } from 'react-router-dom'
import { Footer } from '../components/Footer'

const LEGAL_ITEMS = [
    {
        icon: '📜',
        title: 'Terms of Service',
        description: 'Usage terms, subscription policies, content ownership, and prohibited activities.',
        path: '/terms',
    },
    {
        icon: '🔒',
        title: 'Privacy Policy',
        description: 'How we collect, use, and protect your data. Trust Layer sharing, Twilio SMS, and Stripe billing.',
        path: '/privacy',
    },
    {
        icon: '⛓️',
        title: 'Trust Layer Compliance',
        description: 'Blockchain provenance, hallmark verification, and Signal (SIG) reward policies.',
        link: 'https://dwtl.io/legal',
    },
    {
        icon: '🛡️',
        title: 'TrustShield Protection',
        description: 'Security standards, data encryption, and infrastructure protection policies.',
        link: 'https://trustshield.tech',
    },
    {
        icon: '©️',
        title: 'Copyright & DMCA',
        description: 'Report copyright infringement. TrustGen respects intellectual property rights.',
        email: 'team@dwsc.io',
    },
    {
        icon: '📧',
        title: 'Contact Legal',
        description: 'Questions about our legal policies? Reach our legal team directly.',
        email: 'team@dwsc.io',
    },
]

export function LegalPage() {
    const navigate = useNavigate()

    const handleClick = (item: typeof LEGAL_ITEMS[0]) => {
        if (item.path) navigate(item.path)
        else if (item.link) window.open(item.link, '_blank')
        else if (item.email) window.location.href = `mailto:${item.email}`
    }

    return (
        <div className="explore-page">
            <div className="legal-page">
                <div className="legal-header">
                    <h1>Legal</h1>
                    <p className="legal-updated">DarkWave Studios LLC — TrustGen Platform</p>
                </div>

                <div className="legal-cards">
                    {LEGAL_ITEMS.map(item => (
                        <div
                            key={item.title}
                            className="legal-card"
                            onClick={() => handleClick(item)}
                        >
                            <div className="legal-card-icon">{item.icon}</div>
                            <div>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </div>
                            <span className="legal-card-arrow">→</span>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    )
}
