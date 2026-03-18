/* ====== Lume Studio Agent — mode:studio Compiler Patterns ======
 * Deterministic compiler patterns for website vocabulary.
 * No AI API calls — the compiler IS the intelligence.
 *
 * Each pattern matches natural language → generates HTML + CSS.
 * Patterns are organized by category: layout, content, style, forms,
 * navigation, media, interactive, page, theme.
 */

import type { SiteThemePreset } from '../stores/useSiteBuilderStore'

// ── Types ──

export interface StudioContext {
    currentHTML: string
    currentCSS: string
    theme: SiteThemePreset
}

export interface StudioResult {
    html: string
    css: string
    message: string
    patternUsed: string
}

// ── Pattern Matching Engine ──

interface StudioPattern {
    id: string
    category: string
    triggers: RegExp
    generate: (match: RegExpMatchArray, ctx: StudioContext) => { html: string; css: string; explain: string }
}

const PATTERNS: StudioPattern[] = [

    // ═══════════════════════════════════════
    //  HERO SECTIONS
    // ═══════════════════════════════════════

    {
        id: 'hero-gradient',
        category: 'sections',
        triggers: /(?:add|create|make|build|put|insert)\s+(?:a\s+)?hero\s+(?:section\s+)?(?:with\s+)?(?:a\s+)?(?:gradient|blue|purple|green|red|orange|pink|cyan|dark|colorful)?\s*(?:background)?/i,
        generate: (_match, ctx) => ({
            html: `<section class="hero-section">
  <div class="hero-content">
    <h1 class="hero-title">Welcome to Your Website</h1>
    <p class="hero-subtitle">Build something amazing. Describe what you want and watch it come to life.</p>
    <div class="hero-actions">
      <a href="#" class="hero-btn hero-btn-primary">Get Started</a>
      <a href="#" class="hero-btn hero-btn-secondary">Learn More</a>
    </div>
  </div>
</section>`,
            css: `.hero-section {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 24px;
  background: linear-gradient(135deg, ${ctx.theme.colors.primary}22, ${ctx.theme.colors.secondary}22, ${ctx.theme.colors.background});
  position: relative;
  overflow: hidden;
}
.hero-section::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at 30% 50%, ${ctx.theme.colors.primary}15, transparent 50%),
              radial-gradient(circle at 70% 50%, ${ctx.theme.colors.secondary}10, transparent 50%);
  animation: heroFloat 20s ease-in-out infinite;
}
@keyframes heroFloat {
  0%, 100% { transform: translate(0, 0) rotate(0deg); }
  33% { transform: translate(2%, -2%) rotate(1deg); }
  66% { transform: translate(-1%, 1%) rotate(-1deg); }
}
.hero-content { position: relative; z-index: 1; max-width: 720px; }
.hero-title {
  font-size: clamp(2.5rem, 6vw, 4rem);
  font-weight: 800;
  letter-spacing: -1.5px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, ${ctx.theme.colors.text}, ${ctx.theme.colors.primary});
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-subtitle {
  font-size: clamp(1rem, 2.5vw, 1.25rem);
  color: var(--text-secondary);
  max-width: 560px;
  margin: 0 auto 32px;
  line-height: 1.7;
}
.hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }
.hero-btn {
  padding: 14px 32px;
  border-radius: var(--radius);
  font-weight: 600;
  font-size: 1rem;
  text-decoration: none;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.hero-btn-primary {
  background: var(--primary);
  color: white;
  box-shadow: 0 4px 20px ${ctx.theme.colors.primary}40;
}
.hero-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 30px ${ctx.theme.colors.primary}50;
  text-decoration: none;
}
.hero-btn-secondary {
  background: transparent;
  color: var(--text);
  border: 1px solid ${ctx.theme.colors.text}20;
}
.hero-btn-secondary:hover { border-color: var(--primary); color: var(--primary); text-decoration: none; }
@media (max-width: 640px) {
  .hero-section { min-height: 70vh; padding: 60px 20px; }
  .hero-actions { flex-direction: column; align-items: center; }
  .hero-btn { width: 100%; max-width: 280px; justify-content: center; }
}`,
            explain: '✨ Added a hero section with gradient background, animated orb effects, and responsive CTA buttons.',
        }),
    },

    // ═══════════════════════════════════════
    //  NAVIGATION
    // ═══════════════════════════════════════

    {
        id: 'navbar',
        category: 'navigation',
        triggers: /(?:add|create|make|build|put|insert)\s+(?:a\s+)?(?:nav\s*bar|navigation\s*bar|header|top\s*bar|menu\s*bar)(?:\s+with\s+(.+))?/i,
        generate: (match, ctx) => {
            const linksRaw = match[1] || 'Home, About, Services, Contact'
            const links = linksRaw.split(/[,&]|and/).map(l => l.trim()).filter(Boolean)
            const linkHTML = links.map(l =>
                `      <a href="#${l.toLowerCase().replace(/\s+/g, '-')}" class="nav-link">${l}</a>`
            ).join('\n')
            return {
                html: `<nav class="site-nav">
  <div class="nav-container">
    <a href="/" class="nav-brand">YourBrand</a>
    <div class="nav-links">
${linkHTML}
    </div>
    <button class="nav-mobile-toggle" onclick="this.parentElement.classList.toggle('nav-open')">☰</button>
  </div>
</nav>`,
                css: `.site-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: ${ctx.theme.colors.background}ee;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid ${ctx.theme.colors.text}08;
  padding: 0 24px;
}
.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}
.nav-brand {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text);
  text-decoration: none;
  letter-spacing: -0.5px;
}
.nav-links { display: flex; gap: 8px; align-items: center; }
.nav-link {
  padding: 8px 16px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s ease;
}
.nav-link:hover { color: var(--primary); background: ${ctx.theme.colors.primary}10; text-decoration: none; }
.nav-mobile-toggle {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text);
  cursor: pointer;
}
@media (max-width: 768px) {
  .nav-mobile-toggle { display: block; }
  .nav-links {
    display: none;
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    background: ${ctx.theme.colors.surface};
    flex-direction: column;
    padding: 16px;
    border-bottom: 1px solid ${ctx.theme.colors.text}10;
  }
  .nav-open .nav-links { display: flex; }
  .nav-link { width: 100%; padding: 12px 16px; }
}`,
                explain: `🧭 Added a navigation bar with ${links.length} links: ${links.join(', ')}. Sticky with glassmorphism blur, responsive mobile hamburger menu.`,
            }
        },
    },

    // ═══════════════════════════════════════
    //  FEATURE GRID / CARDS
    // ═══════════════════════════════════════

    {
        id: 'feature-grid',
        category: 'sections',
        triggers: /(?:add|create|make|build)\s+(?:a\s+)?(?:feature|bento|card)\s*(?:grid|section|cards|layout)(?:\s+with\s+(\d)\s*(?:columns?|cols?))?/i,
        generate: (match, ctx) => {
            const cols = match[1] || '3'
            return {
                html: `<section class="features-section">
  <div class="features-container">
    <h2 class="features-heading">Why Choose Us</h2>
    <p class="features-subheading">Everything you need, nothing you don't.</p>
    <div class="features-grid">
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3>Lightning Fast</h3>
        <p>Built for speed from the ground up. No bloat, no compromises.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🔒</div>
        <h3>Secure by Default</h3>
        <p>Enterprise-grade security baked into every layer.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">🎨</div>
        <h3>Beautiful Design</h3>
        <p>Premium aesthetics that make a lasting impression.</p>
      </div>
    </div>
  </div>
</section>`,
            css: `.features-section { padding: 100px 24px; }
.features-container { max-width: 1100px; margin: 0 auto; text-align: center; }
.features-heading {
  font-size: clamp(2rem, 4vw, 2.75rem);
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: -1px;
}
.features-subheading {
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 60px;
}
.features-grid {
  display: grid;
  grid-template-columns: repeat(${cols}, 1fr);
  gap: 24px;
  text-align: left;
}
.feature-card {
  background: var(--surface);
  border: 1px solid ${ctx.theme.colors.text}08;
  border-radius: var(--radius);
  padding: 32px;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.feature-card:hover {
  transform: translateY(-4px);
  border-color: ${ctx.theme.colors.primary}30;
  box-shadow: 0 12px 40px ${ctx.theme.colors.primary}10;
}
.feature-icon {
  font-size: 2rem;
  margin-bottom: 16px;
  width: 56px;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${ctx.theme.colors.primary}12;
  border-radius: 12px;
}
.feature-card h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 8px;
}
.feature-card p {
  color: var(--text-secondary);
  font-size: 0.95rem;
  line-height: 1.6;
}
@media (max-width: 768px) {
  .features-grid { grid-template-columns: 1fr; }
  .features-section { padding: 60px 20px; }
}`,
                explain: `📦 Added a ${cols}-column feature card grid with hover effects. Responsive — stacks to single column on mobile.`,
            }
        },
    },

    // ═══════════════════════════════════════
    //  CONTACT FORM
    // ═══════════════════════════════════════

    {
        id: 'contact-form',
        category: 'forms',
        triggers: /(?:add|create|make|build)\s+(?:a\s+)?(?:contact\s+form|form|signup\s+form|email\s+form)(?:\s+with\s+(.+))?/i,
        generate: (match, ctx) => {
            const fieldsRaw = match[1] || 'name, email, message'
            const fields = fieldsRaw.split(/[,&]|and/).map(f => f.trim().toLowerCase()).filter(Boolean)

            const fieldsHTML = fields.map(f => {
                const label = f.charAt(0).toUpperCase() + f.slice(1)
                if (f.includes('message') || f.includes('comment') || f.includes('description')) {
                    return `      <div class="form-group">
        <label class="form-label">${label}</label>
        <textarea class="form-textarea" placeholder="Your ${f}..." rows="4"></textarea>
      </div>`
                }
                const type = f.includes('email') ? 'email' : f.includes('phone') ? 'tel' : f.includes('password') ? 'password' : 'text'
                return `      <div class="form-group">
        <label class="form-label">${label}</label>
        <input type="${type}" class="form-input" placeholder="Your ${f}..." />
      </div>`
            }).join('\n')

            return {
                html: `<section class="contact-section">
  <div class="contact-container">
    <h2 class="contact-heading">Get in Touch</h2>
    <p class="contact-subheading">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
    <form class="contact-form" onsubmit="event.preventDefault()">
${fieldsHTML}
      <button type="submit" class="form-submit">Send Message</button>
    </form>
  </div>
</section>`,
                css: `.contact-section { padding: 100px 24px; }
.contact-container { max-width: 600px; margin: 0 auto; text-align: center; }
.contact-heading { font-size: 2.25rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.5px; }
.contact-subheading { color: var(--text-secondary); margin-bottom: 40px; font-size: 1.05rem; }
.contact-form { text-align: left; }
.form-group { margin-bottom: 20px; }
.form-label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 6px; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
.form-input, .form-textarea {
  width: 100%;
  padding: 14px 16px;
  background: var(--surface);
  border: 1px solid ${ctx.theme.colors.text}12;
  border-radius: 8px;
  color: var(--text);
  font-family: var(--font-body);
  font-size: 1rem;
  outline: none;
  transition: all 0.2s ease;
}
.form-input:focus, .form-textarea:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px ${ctx.theme.colors.primary}20;
}
.form-textarea { resize: vertical; min-height: 120px; }
.form-submit {
  width: 100%;
  padding: 16px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 8px;
}
.form-submit:hover { transform: translateY(-2px); box-shadow: 0 8px 25px ${ctx.theme.colors.primary}40; }
@media (max-width: 640px) { .contact-section { padding: 60px 20px; } }`,
                explain: `📝 Added a contact form with ${fields.length} fields: ${fields.join(', ')}. Styled with focus states and responsive layout.`,
            }
        },
    },

    // ═══════════════════════════════════════
    //  FOOTER
    // ═══════════════════════════════════════

    {
        id: 'footer',
        category: 'sections',
        triggers: /(?:add|create|make|build|put)\s+(?:a\s+)?footer/i,
        generate: (_match, ctx) => ({
            html: `<footer class="site-footer">
  <div class="footer-container">
    <div class="footer-grid">
      <div class="footer-col">
        <h4 class="footer-brand">YourBrand</h4>
        <p class="footer-desc">Building the future, one pixel at a time.</p>
      </div>
      <div class="footer-col">
        <h5 class="footer-heading">Product</h5>
        <a href="#" class="footer-link">Features</a>
        <a href="#" class="footer-link">Pricing</a>
        <a href="#" class="footer-link">Documentation</a>
      </div>
      <div class="footer-col">
        <h5 class="footer-heading">Company</h5>
        <a href="#" class="footer-link">About</a>
        <a href="#" class="footer-link">Blog</a>
        <a href="#" class="footer-link">Careers</a>
      </div>
      <div class="footer-col">
        <h5 class="footer-heading">Legal</h5>
        <a href="#" class="footer-link">Privacy</a>
        <a href="#" class="footer-link">Terms</a>
        <a href="#" class="footer-link">Cookie Policy</a>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© ${new Date().getFullYear()} YourBrand. All rights reserved.</p>
    </div>
  </div>
</footer>`,
            css: `.site-footer {
  padding: 80px 24px 32px;
  background: var(--surface);
  border-top: 1px solid ${ctx.theme.colors.text}08;
  margin-top: 80px;
}
.footer-container { max-width: 1100px; margin: 0 auto; }
.footer-grid { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 48px; }
.footer-brand { font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; }
.footer-desc { color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; }
.footer-heading { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 1px; color: var(--text-secondary); margin-bottom: 16px; font-weight: 600; }
.footer-link { display: block; color: var(--text-secondary); text-decoration: none; padding: 4px 0; font-size: 0.9rem; transition: color 0.2s ease; }
.footer-link:hover { color: var(--primary); text-decoration: none; }
.footer-bottom { padding-top: 32px; border-top: 1px solid ${ctx.theme.colors.text}08; text-align: center; }
.footer-bottom p { color: var(--text-secondary); font-size: 0.85rem; }
@media (max-width: 768px) {
  .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
}
@media (max-width: 480px) {
  .footer-grid { grid-template-columns: 1fr; }
}`,
            explain: '🦶 Added a 4-column footer with brand, product, company, and legal links. Responsive grid.',
        }),
    },

    // ═══════════════════════════════════════
    //  TESTIMONIALS
    // ═══════════════════════════════════════

    {
        id: 'testimonials',
        category: 'sections',
        triggers: /(?:add|create|make|build)\s+(?:a\s+)?(?:testimonial|review|quote)\s*(?:section|carousel|cards?)?/i,
        generate: (_match, ctx) => ({
            html: `<section class="testimonials-section">
  <div class="testimonials-container">
    <h2 class="testimonials-heading">What People Say</h2>
    <div class="testimonials-grid">
      <div class="testimonial-card">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-text">"This completely transformed how we work. Can't imagine going back."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">JD</div>
          <div><strong>Jane Doe</strong><br/><span>CEO, TechCorp</span></div>
        </div>
      </div>
      <div class="testimonial-card">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-text">"The best investment we've made this year. Results speak for themselves."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">AS</div>
          <div><strong>Alex Smith</strong><br/><span>CTO, StartupXYZ</span></div>
        </div>
      </div>
      <div class="testimonial-card">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-text">"Incredible quality and attention to detail. Our customers love it."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">MJ</div>
          <div><strong>Maria Johnson</strong><br/><span>Director, Creative Co</span></div>
        </div>
      </div>
    </div>
  </div>
</section>`,
            css: `.testimonials-section { padding: 100px 24px; }
.testimonials-container { max-width: 1100px; margin: 0 auto; text-align: center; }
.testimonials-heading { font-size: 2.25rem; font-weight: 800; margin-bottom: 48px; letter-spacing: -0.5px; }
.testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; text-align: left; }
.testimonial-card {
  background: var(--surface);
  border: 1px solid ${ctx.theme.colors.text}08;
  border-radius: var(--radius);
  padding: 32px;
  transition: all 0.3s ease;
}
.testimonial-card:hover { transform: translateY(-2px); border-color: ${ctx.theme.colors.primary}20; }
.testimonial-stars { color: #f59e0b; margin-bottom: 16px; font-size: 1.1rem; letter-spacing: 2px; }
.testimonial-text { font-size: 1rem; line-height: 1.7; margin-bottom: 24px; color: var(--text-secondary); font-style: italic; }
.testimonial-author { display: flex; align-items: center; gap: 12px; }
.testimonial-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, ${ctx.theme.colors.primary}, ${ctx.theme.colors.secondary});
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: 700; font-size: 0.8rem;
}
.testimonial-author strong { font-size: 0.95rem; }
.testimonial-author span { font-size: 0.8rem; color: var(--text-secondary); }
@media (max-width: 768px) { .testimonials-grid { grid-template-columns: 1fr; } }`,
            explain: '💬 Added a testimonials section with 3 review cards, star ratings, and avatars.',
        }),
    },

    // ═══════════════════════════════════════
    //  PRICING TABLE
    // ═══════════════════════════════════════

    {
        id: 'pricing',
        category: 'sections',
        triggers: /(?:add|create|make|build)\s+(?:a\s+)?pricing\s*(?:table|section|cards?|plans?)?/i,
        generate: (_match, ctx) => ({
            html: `<section class="pricing-section">
  <div class="pricing-container">
    <h2 class="pricing-heading">Simple Pricing</h2>
    <p class="pricing-subheading">No hidden fees. No surprises. Pick your plan.</p>
    <div class="pricing-grid">
      <div class="pricing-card">
        <h3 class="pricing-plan">Starter</h3>
        <div class="pricing-price">$9<span>/mo</span></div>
        <ul class="pricing-features">
          <li>✓ 5 Projects</li>
          <li>✓ Basic Analytics</li>
          <li>✓ Email Support</li>
        </ul>
        <a href="#" class="pricing-btn">Choose Plan</a>
      </div>
      <div class="pricing-card pricing-featured">
        <div class="pricing-badge">Most Popular</div>
        <h3 class="pricing-plan">Pro</h3>
        <div class="pricing-price">$29<span>/mo</span></div>
        <ul class="pricing-features">
          <li>✓ Unlimited Projects</li>
          <li>✓ Advanced Analytics</li>
          <li>✓ Priority Support</li>
          <li>✓ Custom Domain</li>
        </ul>
        <a href="#" class="pricing-btn pricing-btn-primary">Choose Plan</a>
      </div>
      <div class="pricing-card">
        <h3 class="pricing-plan">Enterprise</h3>
        <div class="pricing-price">$99<span>/mo</span></div>
        <ul class="pricing-features">
          <li>✓ Everything in Pro</li>
          <li>✓ Dedicated Manager</li>
          <li>✓ SLA Guarantee</li>
          <li>✓ Custom Integrations</li>
        </ul>
        <a href="#" class="pricing-btn">Contact Sales</a>
      </div>
    </div>
  </div>
</section>`,
            css: `.pricing-section { padding: 100px 24px; }
.pricing-container { max-width: 1100px; margin: 0 auto; text-align: center; }
.pricing-heading { font-size: 2.25rem; font-weight: 800; margin-bottom: 12px; }
.pricing-subheading { color: var(--text-secondary); font-size: 1.05rem; margin-bottom: 60px; }
.pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; align-items: start; }
.pricing-card {
  background: var(--surface);
  border: 1px solid ${ctx.theme.colors.text}08;
  border-radius: var(--radius);
  padding: 40px 32px;
  position: relative;
  transition: all 0.3s ease;
}
.pricing-card:hover { transform: translateY(-4px); }
.pricing-featured {
  border-color: var(--primary);
  box-shadow: 0 8px 40px ${ctx.theme.colors.primary}15;
}
.pricing-badge {
  position: absolute; top: -12px; left: 50%; transform: translateX(-50%);
  background: var(--primary); color: white; font-size: 0.75rem; font-weight: 700;
  padding: 4px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px;
}
.pricing-plan { font-size: 1.1rem; font-weight: 600; margin-bottom: 8px; color: var(--text-secondary); }
.pricing-price { font-size: 3rem; font-weight: 800; margin-bottom: 24px; letter-spacing: -2px; }
.pricing-price span { font-size: 1rem; font-weight: 400; color: var(--text-secondary); }
.pricing-features { list-style: none; text-align: left; margin-bottom: 32px; }
.pricing-features li { padding: 8px 0; font-size: 0.95rem; color: var(--text-secondary); border-bottom: 1px solid ${ctx.theme.colors.text}06; }
.pricing-btn {
  display: block; width: 100%; padding: 14px; text-align: center;
  border: 1px solid ${ctx.theme.colors.text}15; border-radius: var(--radius);
  color: var(--text); text-decoration: none; font-weight: 600; transition: all 0.2s ease;
}
.pricing-btn:hover { border-color: var(--primary); color: var(--primary); text-decoration: none; }
.pricing-btn-primary { background: var(--primary); color: white; border-color: var(--primary); }
.pricing-btn-primary:hover { box-shadow: 0 4px 20px ${ctx.theme.colors.primary}40; color: white; }
@media (max-width: 768px) { .pricing-grid { grid-template-columns: 1fr; max-width: 400px; margin: 0 auto; } }`,
            explain: '💰 Added a 3-tier pricing table with Starter, Pro (featured), and Enterprise plans.',
        }),
    },

    // ═══════════════════════════════════════
    //  HEADING / TEXT
    // ═══════════════════════════════════════

    {
        id: 'heading',
        category: 'content',
        triggers: /(?:add|put|write|insert)\s+(?:a\s+)?(?:heading|title|headline)\s+(?:that\s+says?\s+)?[""''"](.+?)[""''"]/i,
        generate: (match, _ctx) => ({
            html: `<div class="text-block"><h2 class="section-heading">${match[1]}</h2></div>`,
            css: `.text-block { padding: 60px 24px; text-align: center; }
.section-heading { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; letter-spacing: -0.5px; }`,
            explain: `📝 Added heading: "${match[1]}"`,
        }),
    },

    {
        id: 'paragraph',
        category: 'content',
        triggers: /(?:add|put|write|insert)\s+(?:a\s+)?(?:paragraph|text|description|copy)\s+(?:that\s+says?\s+|about\s+)?[""''"](.+?)[""''"]/i,
        generate: (match, _ctx) => ({
            html: `<div class="text-content"><p>${match[1]}</p></div>`,
            css: `.text-content { max-width: 680px; margin: 0 auto; padding: 20px 24px; }
.text-content p { font-size: 1.05rem; line-height: 1.8; color: var(--text-secondary); }`,
            explain: `📝 Added paragraph text.`,
        }),
    },

    // ═══════════════════════════════════════
    //  FAQ ACCORDION
    // ═══════════════════════════════════════

    {
        id: 'faq',
        category: 'sections',
        triggers: /(?:add|create|make|build)\s+(?:a\s+)?(?:faq|frequently\s+asked|questions?)\s*(?:section|accordion)?/i,
        generate: (_match, ctx) => ({
            html: `<section class="faq-section">
  <div class="faq-container">
    <h2 class="faq-heading">Frequently Asked Questions</h2>
    <div class="faq-list">
      <details class="faq-item">
        <summary class="faq-question">How does this work?</summary>
        <p class="faq-answer">Simply describe what you want in plain English and our AI-powered compiler builds it instantly. No coding required.</p>
      </details>
      <details class="faq-item">
        <summary class="faq-question">Can I customize the design?</summary>
        <p class="faq-answer">Absolutely! You can change colors, fonts, layouts, and more — just tell us what you want changed.</p>
      </details>
      <details class="faq-item">
        <summary class="faq-question">Is my data secure?</summary>
        <p class="faq-answer">Yes. We use enterprise-grade encryption and never share your data with third parties.</p>
      </details>
      <details class="faq-item">
        <summary class="faq-question">Can I export my website?</summary>
        <p class="faq-answer">Yes! Export clean HTML/CSS at any time, or deploy with one click to your own domain.</p>
      </details>
    </div>
  </div>
</section>`,
            css: `.faq-section { padding: 100px 24px; }
.faq-container { max-width: 700px; margin: 0 auto; }
.faq-heading { text-align: center; font-size: 2.25rem; font-weight: 800; margin-bottom: 48px; }
.faq-item {
  border: 1px solid ${ctx.theme.colors.text}08;
  border-radius: var(--radius);
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.2s ease;
}
.faq-item[open] { border-color: ${ctx.theme.colors.primary}25; }
.faq-question {
  padding: 20px 24px;
  font-weight: 600;
  cursor: pointer;
  list-style: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.faq-question::-webkit-details-marker { display: none; }
.faq-question::after { content: '+'; font-size: 1.5rem; color: var(--text-secondary); transition: transform 0.2s ease; }
.faq-item[open] .faq-question::after { content: '−'; }
.faq-answer { padding: 0 24px 20px; color: var(--text-secondary); line-height: 1.7; }`,
            explain: '❓ Added an FAQ accordion section with 4 expandable questions.',
        }),
    },

    // ═══════════════════════════════════════
    //  STYLE MODIFICATIONS
    // ═══════════════════════════════════════

    {
        id: 'change-background',
        category: 'style',
        triggers: /(?:change|set|make)\s+(?:the\s+)?(?:background|bg)\s+(?:to|color\s+to)?\s*(#[0-9a-fA-F]{3,8}|\w+)/i,
        generate: (match, _ctx) => ({
            html: '',
            css: `body { background: ${match[1]}; }`,
            explain: `🎨 Changed background color to ${match[1]}.`,
        }),
    },

    {
        id: 'change-text-color',
        category: 'style',
        triggers: /(?:change|set|make)\s+(?:the\s+)?(?:text|font)\s*(?:color)?\s+(?:to\s+)?(#[0-9a-fA-F]{3,8}|\w+)/i,
        generate: (match, _ctx) => ({
            html: '',
            css: `body { color: ${match[1]}; }`,
            explain: `🎨 Changed text color to ${match[1]}.`,
        }),
    },
]

// ── Fallback Pattern ──

function fallbackResponse(input: string): StudioResult {
    return {
        html: '',
        css: '',
        message: `🤔 I'm not sure how to interpret "${input}". Try something like:\n• "Add a hero section"\n• "Create a navigation bar with Home, About, Contact"\n• "Add a contact form with name and email"\n• "Build a pricing table"\n\nOr open the **Design Dictionary** 📖 to browse available components!`,
        patternUsed: 'fallback',
    }
}

// ── Main Compiler ──

export function compileStudioCommand(input: string, ctx: StudioContext): StudioResult {
    const trimmed = input.trim()

    // Match against all patterns
    for (const pattern of PATTERNS) {
        const match = trimmed.match(pattern.triggers)
        if (match) {
            const { html, css, explain } = pattern.generate(match, ctx)

            return {
                html: html ? (ctx.currentHTML + '\n' + html) : ctx.currentHTML,
                css: css ? (ctx.currentCSS + '\n' + css) : ctx.currentCSS,
                message: explain,
                patternUsed: pattern.id,
            }
        }
    }

    return fallbackResponse(trimmed)
}

// ── Exported Pattern List (for gallery/dictionary) ──

export function getStudioPatterns() {
    return PATTERNS.map(p => ({
        id: p.id,
        category: p.category,
    }))
}
