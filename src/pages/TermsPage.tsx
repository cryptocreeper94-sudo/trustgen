/* ====== TrustGen — Terms of Service ====== */
import { Footer } from '../components/Footer'

export function TermsPage() {
    return (
        <div className="explore-page">
            <div className="legal-page">
                <div className="legal-header">
                    <h1>Terms of Service</h1>
                    <p className="legal-updated">Last updated: March 5, 2026</p>
                </div>

                <div className="legal-content">
                    <section>
                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            By accessing or using TrustGen ("Service"), operated by DarkWave Studios LLC ("Company"),
                            you agree to be bound by these Terms of Service. If you do not agree to all the terms
                            and conditions, you may not access or use the Service.
                        </p>
                    </section>

                    <section>
                        <h2>2. Description of Service</h2>
                        <p>
                            TrustGen is a premium AI-powered 3D creation, animation, and export platform.
                            The Service includes 3D scene editing, in-house procedural AI model generation,
                            keyframe animation, post-processing effects, and model import/export capabilities.
                            TrustGen is a registered application within the Trust Layer ecosystem.
                        </p>
                    </section>

                    <section>
                        <h2>3. User Accounts</h2>
                        <p>
                            You must create an account to access the Service. You are responsible for maintaining
                            the confidentiality of your account credentials and for all activities under your account.
                            You must provide accurate, current, and complete information during registration.
                        </p>
                    </section>

                    <section>
                        <h2>4. Subscription Plans &amp; Billing</h2>
                        <p>
                            TrustGen offers Free, Pro, and Enterprise subscription tiers. Paid plans are billed
                            monthly via Stripe. You may cancel your subscription at any time. No refunds are
                            provided for partial months. Features available per tier are subject to change with notice.
                        </p>
                    </section>

                    <section>
                        <h2>5. Content Ownership</h2>
                        <p>
                            You retain all rights to 3D models, scenes, animations, and assets you create using
                            TrustGen. Procedurally generated models are created entirely in-house. By using the
                            Service, you grant DarkWave Studios a limited license to display your public creations
                            within the Trust Layer ecosystem.
                        </p>
                    </section>

                    <section>
                        <h2>6. Trust Layer Integration</h2>
                        <p>
                            TrustGen is integrated with the Trust Layer blockchain ecosystem. Creations may be
                            hallmarked on Trust Layer for provenance tracking. Trust Layer's own Terms of Service
                            apply to blockchain-related features. Signal (SIG) rewards are governed by Trust Layer
                            network policies.
                        </p>
                    </section>

                    <section>
                        <h2>7. Prohibited Uses</h2>
                        <p>
                            You agree not to: (a) use the Service to create illegal, harmful, or infringing content;
                            (b) reverse-engineer, decompile, or disassemble the Service; (c) resell or redistribute
                            the Service without authorization; (d) attempt to gain unauthorized access to any systems;
                            (e) use the AI generation features to produce content that violates applicable laws.
                        </p>
                    </section>

                    <section>
                        <h2>8. Limitation of Liability</h2>
                        <p>
                            DarkWave Studios LLC shall not be liable for any indirect, incidental, special, or
                            consequential damages arising from your use of the Service. Our total liability shall
                            not exceed the amount you paid for the Service in the twelve months preceding the claim.
                        </p>
                    </section>

                    <section>
                        <h2>9. Modifications</h2>
                        <p>
                            We reserve the right to modify these Terms at any time. We will notify users of material
                            changes via email or in-app notification. Continued use after changes constitutes acceptance
                            of the modified Terms.
                        </p>
                    </section>

                    <section>
                        <h2>10. Contact</h2>
                        <p>
                            For questions about these Terms, contact us at{' '}
                            <a href="mailto:team@dwsc.io">team@dwsc.io</a>.
                        </p>
                    </section>
                </div>
            </div>
            <Footer />
        </div>
    )
}
