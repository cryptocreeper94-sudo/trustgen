/* ====== TrustGen — Privacy Policy ====== */
import { Footer } from '../components/Footer'

export function PrivacyPage() {
    return (
        <div className="explore-page">
            <div className="legal-page">
                <div className="legal-header">
                    <h1>Privacy Policy</h1>
                    <p className="legal-updated">Last updated: March 5, 2026</p>
                </div>

                <div className="legal-content">
                    <section>
                        <h2>1. Information We Collect</h2>
                        <p>
                            <strong>Account Information:</strong> Name, email address, and password hash when you register.
                        </p>
                        <p>
                            <strong>Usage Data:</strong> Pages visited, features used, session duration, device type,
                            browser, and approximate geographic location (country/city via IP lookup). IP addresses
                            are hashed and never stored in raw form.
                        </p>
                        <p>
                            <strong>Content Data:</strong> 3D models, scenes, animations, and project data you create.
                        </p>
                        <p>
                            <strong>Payment Information:</strong> Processed securely by Stripe. We do not store
                            credit card numbers or banking information on our servers.
                        </p>
                        <p>
                            <strong>SMS Data:</strong> If you opt in to SMS notifications, your phone number is
                            stored and used exclusively for service notifications via Twilio. You may opt out at any time.
                        </p>
                    </section>

                    <section>
                        <h2>2. How We Use Your Information</h2>
                        <p>We use your information to:</p>
                        <ul>
                            <li>Provide and improve the TrustGen Service</li>
                            <li>Process payments and manage subscriptions</li>
                            <li>Send service notifications (email and SMS with consent)</li>
                            <li>Analyze usage patterns to improve user experience</li>
                            <li>Register creations on the Trust Layer blockchain (with your consent)</li>
                            <li>Detect and prevent fraud or abuse</li>
                        </ul>
                    </section>

                    <section>
                        <h2>3. Trust Layer Data Sharing</h2>
                        <p>
                            As a Trust Layer ecosystem application, certain data is shared with the Trust Layer
                            network for accountability and provenance purposes:
                        </p>
                        <ul>
                            <li>Your TrustGen user ID (linked to your TLID identity)</li>
                            <li>Creation metadata (titles, timestamps, hallmark hashes)</li>
                            <li>Trust stamps and badges earned</li>
                        </ul>
                        <p>
                            This data is governed by Trust Layer's privacy policy at{' '}
                            <a href="https://dwtl.io/privacy" target="_blank" rel="noopener noreferrer">dwtl.io/privacy</a>.
                        </p>
                    </section>

                    <section>
                        <h2>4. SMS Communications (Twilio)</h2>
                        <p>
                            SMS notifications are provided through Twilio. By opting in, you consent to receive
                            service-related text messages. Message frequency varies. Message and data rates may apply.
                            You can opt out at any time by replying STOP or visiting your SMS settings.
                            For help, reply HELP or contact support.
                        </p>
                    </section>

                    <section>
                        <h2>5. Data Security</h2>
                        <p>
                            We implement industry-standard security measures including encrypted connections (TLS),
                            hashed passwords (bcrypt), and environment-isolated API keys. Your data is stored on
                            secure, managed PostgreSQL databases with automated backups.
                        </p>
                    </section>

                    <section>
                        <h2>6. Data Retention</h2>
                        <p>
                            Account data is retained as long as your account is active. You may request deletion
                            of your account and associated data at any time. Analytics data is anonymized and
                            retained for up to 24 months for service improvement. Blockchain records on Trust Layer
                            are immutable by design.
                        </p>
                    </section>

                    <section>
                        <h2>7. Third-Party Services</h2>
                        <p>We use the following third-party services:</p>
                        <ul>
                            <li><strong>Stripe</strong> — Payment processing</li>
                            <li><strong>Twilio</strong> — SMS notifications</li>
                            <li><strong>TrustGen Engine</strong> — In-house procedural 3D generation</li>
                            <li><strong>Trust Layer</strong> — Blockchain provenance</li>
                            <li><strong>Vercel</strong> — Frontend hosting</li>
                            <li><strong>Render</strong> — Backend hosting</li>
                        </ul>
                    </section>

                    <section>
                        <h2>8. Your Rights</h2>
                        <p>
                            You have the right to: access your personal data, correct inaccuracies, request deletion,
                            export your data, and withdraw consent for optional communications. Contact us at{' '}
                            <a href="mailto:team@dwsc.io">team@dwsc.io</a>.
                        </p>
                    </section>

                    <section>
                        <h2>9. Children's Privacy</h2>
                        <p>
                            TrustGen is not intended for users under 13 years of age. We do not knowingly collect
                            information from children under 13.
                        </p>
                    </section>

                    <section>
                        <h2>10. Contact</h2>
                        <p>
                            DarkWave Studios LLC<br />
                            Email: <a href="mailto:team@dwsc.io">team@dwsc.io</a>
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    )
}
