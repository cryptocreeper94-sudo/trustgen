/* ====== TrustGen — Express Backend Server ====== */
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Pool } from 'pg'
import { registerHallmarkRoutes } from "./hallmark.js";
import { registerAffiliateRoutes } from "./affiliate.js";
import { registerEcosystemRoutes } from "./ecosystem.js";

// ── Environment ──
const PORT = process.env.PORT || 4000

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
    console.error('FATAL: JWT_SECRET must be set in production')
    process.exit(1)
}
const JWT_SECRET = process.env.JWT_SECRET || 'trustgen-dev-secret-change-me'
const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID || ''
const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN || ''
const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER || ''
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || ''
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/trustgen'
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

// ── Database ──
const pool = new Pool({ connectionString: DATABASE_URL })

async function initDB() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS tenants (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            brand_color TEXT DEFAULT '#6c5ce7',
            logo_url TEXT,
            features JSONB DEFAULT '{"aiGeneration":true,"particleSystem":true,"postProcessing":true,"maxProjects":100,"maxAssets":500}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            tenant_id UUID REFERENCES tenants(id),
            avatar TEXT,
            email_verified BOOLEAN DEFAULT false,
            sms_opt_in BOOLEAN DEFAULT false,
            phone TEXT,
            subscription_tier TEXT DEFAULT 'free',
            stripe_customer_id TEXT,
            verification_token TEXT,
            trust_layer_id TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Add trust_layer_id if missing (migration)
        ALTER TABLE users ADD COLUMN IF NOT EXISTS trust_layer_id TEXT;

        CREATE TABLE IF NOT EXISTS projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID REFERENCES tenants(id),
            user_id UUID REFERENCES users(id),
            name TEXT NOT NULL,
            description TEXT,
            thumbnail_url TEXT,
            scene_data JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS sms_consents (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id),
            phone TEXT NOT NULL,
            consented BOOLEAN DEFAULT false,
            verification_code TEXT,
            verified BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS subscriptions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id),
            stripe_subscription_id TEXT,
            stripe_customer_id TEXT,
            tier TEXT DEFAULT 'free',
            status TEXT DEFAULT 'active',
            current_period_start TIMESTAMPTZ,
            current_period_end TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS hallmarks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id TEXT NOT NULL,
            hallmark_id TEXT UNIQUE NOT NULL,
            hallmark_type TEXT DEFAULT 'creation',
            product_name TEXT NOT NULL,
            metadata JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS trust_stamps (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id),
            stamp_id TEXT,
            category TEXT NOT NULL,
            data JSONB,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS referral_codes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) UNIQUE,
            code TEXT UNIQUE NOT NULL,
            user_hash TEXT UNIQUE NOT NULL,
            clicks INTEGER DEFAULT 0,
            signups INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS referrals (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            referrer_id UUID REFERENCES users(id),
            referred_id UUID REFERENCES users(id),
            referral_code TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            ip_address TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS affiliate_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id) UNIQUE,
            tier TEXT DEFAULT 'explorer',
            lifetime_earnings NUMERIC DEFAULT 0,
            pending_commission NUMERIC DEFAULT 0,
            total_clicks INTEGER DEFAULT 0,
            total_signups INTEGER DEFAULT 0,
            total_conversions INTEGER DEFAULT 0,
            payout_method TEXT DEFAULT 'sig',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
        -- ══════════════════════════════════════
        --  STUDIO IDE TABLES
        -- ══════════════════════════════════════

        CREATE TABLE IF NOT EXISTS studio_projects (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id),
            name TEXT NOT NULL,
            description TEXT,
            language TEXT NOT NULL DEFAULT 'javascript',
            is_public BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS studio_files (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
            path TEXT NOT NULL,
            name TEXT NOT NULL,
            content TEXT NOT NULL DEFAULT '',
            language TEXT NOT NULL DEFAULT 'plaintext',
            is_folder BOOLEAN NOT NULL DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS studio_secrets (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            environment TEXT NOT NULL DEFAULT 'shared',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS studio_configs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            environment TEXT NOT NULL DEFAULT 'shared',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS studio_commits (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
            hash TEXT NOT NULL,
            parent_hash TEXT,
            message TEXT NOT NULL,
            author_id UUID REFERENCES users(id),
            branch TEXT NOT NULL DEFAULT 'main',
            files_snapshot TEXT NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS studio_deployments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'pending',
            url TEXT,
            custom_domain TEXT,
            version TEXT NOT NULL DEFAULT '1',
            commit_hash TEXT,
            build_logs TEXT DEFAULT '',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS studio_code_stamps (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            project_id UUID REFERENCES studio_projects(id) ON DELETE CASCADE,
            user_id UUID REFERENCES users(id),
            commit_hash TEXT,
            tree_hash TEXT NOT NULL,
            provenance_id TEXT NOT NULL,
            tx_hash TEXT NOT NULL,
            block_number INTEGER NOT NULL,
            message TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- ══════════════════════════════════════
        --  LUME STUDIO SITES
        -- ══════════════════════════════════════

        CREATE TABLE IF NOT EXISTS studio_sites (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(id),
            subdomain TEXT UNIQUE,
            custom_domain TEXT,
            site_name TEXT NOT NULL DEFAULT 'My Website',
            theme_id TEXT DEFAULT 'modern-dark',
            pages JSONB NOT NULL DEFAULT '[]',
            theme_config JSONB,
            is_published BOOLEAN DEFAULT false,
            published_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `)
    console.log('✅ Database tables initialized')
}

// ── App ──
const app = express()
app.use(helmet())
app.use(cors({ origin: CLIENT_URL, credentials: true }))
app.use(express.json())

registerHallmarkRoutes(app)
registerAffiliateRoutes(app)
registerEcosystemRoutes(app)

// ── Auth Middleware ──
function authMiddleware(req: any, res: any, next: any) {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) return res.status(401).json({ error: 'No token provided' })
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as any
        req.userId = decoded.userId
        req.tenantId = decoded.tenantId
        next()
    } catch {
        res.status(401).json({ error: 'Invalid token' })
    }
}

// ── Subscription Tier Gating Middleware ──
const TIER_LEVELS: Record<string, number> = { free: 0, pro: 1, enterprise: 2 }

/**
 * Requires user to have at least `minTier` subscription.
 * Must be used after `authMiddleware` (needs req.userId).
 *
 * Usage: app.post('/api/premium', authMiddleware, requireTier('pro'), handler)
 */
function requireTier(minTier: 'pro' | 'enterprise') {
    return async (req: any, res: any, next: any) => {
        try {
            const result = await pool.query(
                'SELECT subscription_tier FROM users WHERE id = $1',
                [req.userId]
            )
            const userTier = result.rows[0]?.subscription_tier || 'free'
            const userLevel = TIER_LEVELS[userTier] ?? 0
            const requiredLevel = TIER_LEVELS[minTier] ?? 1

            if (userLevel < requiredLevel) {
                return res.status(403).json({
                    error: 'Upgrade required',
                    message: `This feature requires a ${minTier} subscription. You are currently on the ${userTier} plan.`,
                    currentTier: userTier,
                    requiredTier: minTier,
                    upgradeUrl: '/billing',
                })
            }
            req.subscriptionTier = userTier
            next()
        } catch (err) {
            console.error('Tier check error:', err)
            res.status(500).json({ error: 'Failed to verify subscription' })
        }
    }
}

function makeToken(userId: string, tenantId: string) {
    return jwt.sign({ userId, tenantId }, JWT_SECRET, { expiresIn: '7d' })
}

function userResponse(user: any) {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantId: user.tenant_id,
        avatar: user.avatar,
        emailVerified: user.email_verified,
        smsOptIn: user.sms_opt_in,
        phone: user.phone,
        subscriptionTier: user.subscription_tier,
        stripeCustomerId: user.stripe_customer_id,
        trustLayerId: user.trust_layer_id,
        mustChangePassword: user.must_change_password ?? false,
    }
}

// ════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body
        if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' })

        // Enforce ecosystem password policy
        const tl = await import('./trustLayerApi.js')
        const pwCheck = tl.validateEcosystemPassword(password)
        if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.message })

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
        if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' })

        // Create tenant for user
        const slug = email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()
        const tenant = await pool.query(
            'INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id',
            [name + "'s Workspace", slug + '-' + Date.now().toString(36)]
        )
        const tenantId = tenant.rows[0].id

        // Generate Trust Layer ID
        const trustLayerId = tl.generateTrustLayerId()

        const hash = await bcrypt.hash(password, 12)
        const user = await pool.query(
            'INSERT INTO users (email, password_hash, name, tenant_id, trust_layer_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [email, hash, name, tenantId, trustLayerId]
        )

        const token = makeToken(user.rows[0].id, tenantId)

        // Sync user to ecosystem (non-blocking)
        tl.syncUserToEcosystem(email, password, name).catch(err =>
            console.error('Ecosystem sync error (non-critical):', err.message)
        )

        // Create affiliate profile with referral code
        await createAffiliateProfile(user.rows[0].id)

        // Send welcome email (Resend)
        if (RESEND_API_KEY) {
            try {
                const { Resend } = await import('resend')
                const resend = new Resend(RESEND_API_KEY)
                await resend.emails.send({
                    from: 'TrustGen <noreply@trustgen.io>',
                    to: email,
                    subject: 'Welcome to TrustGen 3D',
                    html: `<h2>Welcome, ${name}! 🎨</h2><p>Your TrustGen 3D workspace is ready.</p>`,
                })
            } catch (err) { console.error('Resend email error:', err) }
        }

        res.json({ token, user: userResponse(user.rows[0]) })
    } catch (err: any) {
        console.error('Register error:', err)
        res.status(500).json({ error: 'Registration failed' })
    }
})

// ── Auto-create affiliate profile on registration ──
async function createAffiliateProfile(userId: string) {
    try {
        const hashBytes = crypto.randomBytes(4).toString('hex').toUpperCase()
        const userHash = `TN-${hashBytes}`
        const code = `trustgen-${hashBytes.toLowerCase()}`

        await pool.query(
            'INSERT INTO referral_codes (user_id, code, user_hash) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING',
            [userId, code, userHash]
        )
        await pool.query(
            'INSERT INTO affiliate_profiles (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
            [userId]
        )
    } catch (err) {
        console.error('Affiliate profile creation error (non-critical):', err)
    }
}

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])

        // Local auth first
        if (result.rows.length > 0) {
            const user = result.rows[0]
            const valid = await bcrypt.compare(password, user.password_hash)
            if (valid) {
                const token = makeToken(user.id, user.tenant_id)
                return res.json({ token, user: userResponse(user) })
            }
        }

        // Ecosystem credential fallback — try Trust Layer if local auth fails
        try {
            const tl = await import('./trustLayerApi.js')
            const ecoResult = await tl.verifyEcosystemCredentials(email, password)
            if (ecoResult.valid) {
                // User exists in ecosystem — find or auto-provision locally
                let user = result.rows[0]
                if (!user) {
                    // Auto-create local user from ecosystem credentials
                    const slug = email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()
                    const tenant = await pool.query(
                        'INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id',
                        [ecoResult.displayName + "'s Workspace", slug + '-' + Date.now().toString(36)]
                    )
                    const hash = await bcrypt.hash(password, 12)
                    const newUser = await pool.query(
                        'INSERT INTO users (email, password_hash, name, tenant_id, trust_layer_id, email_verified) VALUES ($1, $2, $3, $4, $5, true) RETURNING *',
                        [email, hash, ecoResult.displayName, tenant.rows[0].id, ecoResult.trustLayerId]
                    )
                    user = newUser.rows[0]
                } else {
                    // User exists locally but password was wrong — update to ecosystem password
                    const hash = await bcrypt.hash(password, 12)
                    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id])
                }
                const token = makeToken(user.id, user.tenant_id)
                return res.json({ token, user: userResponse(user) })
            }
        } catch (ecoErr: any) {
            console.log('Ecosystem fallback skipped:', ecoErr.message)
            if (ecoErr.message.includes('timeout') || ecoErr.message.includes('unreachable')) {
                return res.status(503).json({ error: 'Trust Layer SSO is temporarily unreachable (Degraded Mode). Local credentials also failed.' })
            }
        }

        res.status(401).json({ error: 'Invalid credentials' })
    } catch (err: any) {
        console.error('Login error:', err)
        res.status(500).json({ error: 'Login failed' })
    }
})

app.get('/api/auth/me', authMiddleware, async (req: any, res) => {
    try {
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId])
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' })
        res.json({ user: userResponse(result.rows[0]) })
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to get user' })
    }
})

// ── Password Change with Ecosystem Sync ──
app.post('/api/auth/change-password', authMiddleware, async (req: any, res) => {
    try {
        const { currentPassword, newPassword } = req.body
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing fields' })

        const tl = await import('./trustLayerApi.js')
        const pwCheck = tl.validateEcosystemPassword(newPassword)
        if (!pwCheck.valid) return res.status(400).json({ error: pwCheck.message })

        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId])
        if (userResult.rows.length === 0) return res.status(404).json({ error: 'User not found' })

        const user = userResult.rows[0]
        const valid = await bcrypt.compare(currentPassword, user.password_hash)
        if (!valid) return res.status(401).json({ error: 'Current password is incorrect' })

        const hash = await bcrypt.hash(newPassword, 12)
        await pool.query('UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2', [hash, req.userId])

        // Sync password change to ecosystem (non-blocking)
        tl.syncPasswordChange(user.email, newPassword).catch(err =>
            console.error('Ecosystem password sync error (non-critical):', err.message)
        )

        res.json({ success: true })
    } catch (err: any) {
        console.error('Password change error:', err)
        res.status(500).json({ error: 'Password change failed' })
    }
})

// ════════════════════════════════
//  SMS OPT-IN
// ════════════════════════════════
app.post('/api/auth/sms-opt-in', authMiddleware, async (req: any, res) => {
    try {
        const { phone } = req.body
        const code = Math.floor(100000 + Math.random() * 900000).toString()

        await pool.query(
            `INSERT INTO sms_consents (user_id, phone, consented, verification_code)
             VALUES ($1, $2, true, $3)
             ON CONFLICT (user_id) WHERE user_id = $1
             DO UPDATE SET phone = $2, verification_code = $3, verified = false`,
            [req.userId, phone, code]
        )

        // Send SMS via Twilio
        if (TWILIO_SID && TWILIO_AUTH) {
            try {
                const twilio = await import('twilio')
                const client = twilio.default(TWILIO_SID, TWILIO_AUTH)
                await client.messages.create({
                    body: `Your TrustGen verification code: ${code}`,
                    from: TWILIO_PHONE,
                    to: phone,
                })
            } catch (err) { console.error('Twilio error:', err) }
        }

        res.json({ success: true })
    } catch (err: any) {
        console.error('SMS opt-in error:', err)
        res.status(500).json({ error: 'Failed to send verification' })
    }
})

app.post('/api/auth/verify-sms', authMiddleware, async (req: any, res) => {
    try {
        const { phone, code } = req.body
        const result = await pool.query(
            'SELECT * FROM sms_consents WHERE user_id = $1 AND phone = $2 AND verification_code = $3',
            [req.userId, phone, code]
        )
        if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid code' })

        await pool.query('UPDATE sms_consents SET verified = true WHERE user_id = $1', [req.userId])
        await pool.query('UPDATE users SET sms_opt_in = true, phone = $1 WHERE id = $2', [phone, req.userId])

        res.json({ success: true })
    } catch (err: any) {
        res.status(500).json({ error: 'Verification failed' })
    }
})

// ════════════════════════════════
//  MESSAGING
// ════════════════════════════════
app.post('/api/messaging/send-email', authMiddleware, async (req: any, res) => {
    try {
        const { to, subject, html } = req.body
        if (!RESEND_API_KEY) return res.status(503).json({ error: 'Email service not configured' })

        const { Resend } = await import('resend')
        const resend = new Resend(RESEND_API_KEY)
        await resend.emails.send({
            from: 'TrustGen <noreply@trustgen.io>',
            to, subject, html,
        })
        res.json({ success: true })
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to send email' })
    }
})

app.post('/api/messaging/send-sms', authMiddleware, async (req: any, res) => {
    try {
        const { to, message } = req.body
        if (!TWILIO_SID) return res.status(503).json({ error: 'SMS service not configured' })

        const twilio = await import('twilio')
        const client = twilio.default(TWILIO_SID, TWILIO_AUTH)
        await client.messages.create({ body: message, from: TWILIO_PHONE, to })
        res.json({ success: true })
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to send SMS' })
    }
})

// ════════════════════════════════
//  TENANTS
// ════════════════════════════════
app.get('/api/tenants/:id', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tenants WHERE id = $1', [req.params.id])
        if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' })
        const t = result.rows[0]
        res.json({
            id: t.id, name: t.name, slug: t.slug,
            brandColor: t.brand_color, logoUrl: t.logo_url,
            features: t.features,
        })
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to get tenant' })
    }
})

// ════════════════════════════════
//  PROJECTS
// ════════════════════════════════
app.get('/api/projects', authMiddleware, async (req: any, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM projects WHERE user_id = $1 ORDER BY updated_at DESC',
            [req.userId]
        )
        res.json(result.rows.map(p => ({
            id: p.id, name: p.name, description: p.description,
            thumbnailUrl: p.thumbnail_url, sceneData: p.scene_data,
            createdAt: p.created_at, updatedAt: p.updated_at,
        })))
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to list projects' })
    }
})

app.post('/api/projects', authMiddleware, async (req: any, res) => {
    try {
        const { name, description } = req.body
        const result = await pool.query(
            'INSERT INTO projects (tenant_id, user_id, name, description) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.tenantId, req.userId, name, description || null]
        )
        const p = result.rows[0]
        res.json({
            id: p.id, name: p.name, description: p.description,
            thumbnailUrl: p.thumbnail_url, sceneData: p.scene_data,
            createdAt: p.created_at, updatedAt: p.updated_at,
        })
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to create project' })
    }
})

app.get('/api/projects/:id', authMiddleware, async (req: any, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        )
        if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' })
        const p = result.rows[0]
        res.json({
            id: p.id, name: p.name, description: p.description,
            thumbnailUrl: p.thumbnail_url, sceneData: p.scene_data,
            createdAt: p.created_at, updatedAt: p.updated_at,
        })
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to get project' })
    }
})

app.put('/api/projects/:id', authMiddleware, async (req: any, res) => {
    try {
        const { name, description, sceneData, thumbnailUrl } = req.body
        const result = await pool.query(
            `UPDATE projects SET
                name = COALESCE($1, name),
                description = COALESCE($2, description),
                scene_data = COALESCE($3, scene_data),
                thumbnail_url = COALESCE($4, thumbnail_url),
                updated_at = NOW()
             WHERE id = $5 AND user_id = $6 RETURNING *`,
            [name, description, sceneData, thumbnailUrl, req.params.id, req.userId]
        )
        if (result.rows.length === 0) return res.status(404).json({ error: 'Project not found' })
        const p = result.rows[0]
        res.json({
            id: p.id, name: p.name, description: p.description,
            thumbnailUrl: p.thumbnail_url, sceneData: p.scene_data,
            createdAt: p.created_at, updatedAt: p.updated_at,
        })
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to update project' })
    }
})

app.delete('/api/projects/:id', authMiddleware, async (req: any, res) => {
    try {
        await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
        res.status(204).end()
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to delete project' })
    }
})

// ════════════════════════════════
//  BILLING (Stripe)
// ════════════════════════════════
app.post('/api/billing/create-checkout', authMiddleware, async (req: any, res) => {
    try {
        if (!STRIPE_SECRET) return res.status(503).json({ error: 'Stripe not configured' })

        const stripe = (await import('stripe')).default
        const stripeClient = new stripe(STRIPE_SECRET)
        const { tier } = req.body

        // Get or create Stripe customer
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.userId])
        const user = userResult.rows[0]

        let customerId = user.stripe_customer_id
        if (!customerId) {
            const customer = await stripeClient.customers.create({
                email: user.email,
                name: user.name,
                metadata: { userId: user.id, tenantId: user.tenant_id },
            })
            customerId = customer.id
            await pool.query('UPDATE users SET stripe_customer_id = $1 WHERE id = $2', [customerId, user.id])
        }

        // Price IDs should come from env vars in production
        const priceIds: Record<string, string> = {
            pro: process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder',
            enterprise: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise_placeholder',
        }

        const session = await stripeClient.checkout.sessions.create({
            customer: customerId,
            mode: 'subscription',
            line_items: [{ price: priceIds[tier], quantity: 1 }],
            success_url: `${CLIENT_URL}/dashboard?checkout=success`,
            cancel_url: `${CLIENT_URL}/billing?checkout=cancel`,
            metadata: { userId: user.id, tier },
        })

        res.json({ url: session.url })
    } catch (err: any) {
        console.error('Stripe checkout error:', err)
        res.status(500).json({ error: 'Failed to create checkout session' })
    }
})

app.post('/api/billing/portal', authMiddleware, async (req: any, res) => {
    try {
        if (!STRIPE_SECRET) return res.status(503).json({ error: 'Stripe not configured' })

        const stripe = (await import('stripe')).default
        const stripeClient = new stripe(STRIPE_SECRET)

        const userResult = await pool.query('SELECT stripe_customer_id FROM users WHERE id = $1', [req.userId])
        const customerId = userResult.rows[0]?.stripe_customer_id
        if (!customerId) return res.status(400).json({ error: 'No subscription found' })

        const session = await stripeClient.billingPortal.sessions.create({
            customer: customerId,
            return_url: `${CLIENT_URL}/billing`,
        })

        res.json({ url: session.url })
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to create portal session' })
    }
})

app.get('/api/billing/subscription', authMiddleware, async (req: any, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM subscriptions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
            [req.userId]
        )
        res.json(result.rows[0] || { tier: 'free', status: 'active' })
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to get subscription' })
    }
})

// Stripe webhook (raw body needed)
app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    try {
        if (!STRIPE_SECRET || !STRIPE_WEBHOOK_SECRET) return res.status(503).end()

        const stripe = (await import('stripe')).default
        const stripeClient = new stripe(STRIPE_SECRET)

        const sig = req.headers['stripe-signature'] as string
        const event = stripeClient.webhooks.constructEvent(req.body, sig, STRIPE_WEBHOOK_SECRET)

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as any
                const userId = session.metadata?.userId
                const tier = session.metadata?.tier
                if (userId && tier) {
                    await pool.query('UPDATE users SET subscription_tier = $1 WHERE id = $2', [tier, userId])
                    await pool.query(
                        `INSERT INTO subscriptions (user_id, stripe_subscription_id, stripe_customer_id, tier, status)
                         VALUES ($1, $2, $3, $4, 'active')`,
                        [userId, session.subscription, session.customer, tier]
                    )
                }
                break
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object as any
                await pool.query(
                    "UPDATE subscriptions SET status = 'canceled' WHERE stripe_subscription_id = $1",
                    [sub.id]
                )
                // Downgrade user to free
                const subResult = await pool.query(
                    'SELECT user_id FROM subscriptions WHERE stripe_subscription_id = $1',
                    [sub.id]
                )
                if (subResult.rows[0]) {
                    await pool.query("UPDATE users SET subscription_tier = 'free' WHERE id = $1", [subResult.rows[0].user_id])
                }
                break
            }
        }

        res.json({ received: true })
    } catch (err: any) {
        console.error('Webhook error:', err)
        res.status(400).json({ error: 'Webhook failed' })
    }
})

// ── Start Server ──
app.listen(PORT, async () => {
    await initDB()
    console.log(`🚀 TrustGen API running on http://localhost:${PORT}`)

    // ── Genesis Hallmark (first boot check) ──
    try {
        const genesisCheck = await pool.query(
            "SELECT id FROM hallmarks WHERE hallmark_type = 'genesis' LIMIT 1"
        )
        if (genesisCheck.rows.length === 0 && process.env.TRUSTLAYER_API_KEY) {
            const tl = await import('./trustLayerApi.js')
            const result = await tl.createGenesisHallmark()
            await pool.query(
                `INSERT INTO hallmarks (user_id, hallmark_id, hallmark_type, product_name, metadata)
                 VALUES ('00000000-0000-0000-0000-000000000000', $1, 'genesis', 'TrustGen 3D Engine', $2)`,
                [result.hallmark.hallmarkId, JSON.stringify(result.hallmark)]
            )
            console.log(`◈ Genesis hallmark created: ${result.hallmark.hallmarkId}`)
        }
    } catch (err) {
        console.log('⚠ Genesis hallmark skipped (Trust Layer not configured yet)')
    }
})

// ════════════════════════════════
//  TRUST LAYER — SSO TOKEN EXCHANGE
// ════════════════════════════════
app.post('/api/auth/sso-exchange', async (req, res) => {
    try {
        const { hubSessionToken } = req.body
        if (!hubSessionToken) return res.status(400).json({ error: 'Missing hubSessionToken' })

        const tl = await import('./trustLayerApi.js')
        const result = await tl.exchangeSSOToken(hubSessionToken)

        // Find or create user from SSO data
        let user = (await pool.query('SELECT * FROM users WHERE email = $1', [result.email])).rows[0]

        if (!user) {
            // Auto-provision user from Trust Layer SSO
            const slug = result.email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()
            const tenant = await pool.query(
                'INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id',
                [result.displayName + "'s Workspace", slug + '-' + Date.now().toString(36)]
            )
            const hash = await bcrypt.hash(crypto.randomUUID(), 12) // random password for SSO users
            const newUser = await pool.query(
                'INSERT INTO users (email, password_hash, name, tenant_id, email_verified) VALUES ($1, $2, $3, $4, true) RETURNING *',
                [result.email, hash, result.displayName, tenant.rows[0].id]
            )
            user = newUser.rows[0]

            // Anchor identity to blockchain
            try {
                await tl.anchorIdentity(user.id, result.email, result.displayName)
            } catch (err) { console.error('Identity anchor error:', err) }
        }

        const token = makeToken(user.id, user.tenant_id)

        // Store ecosystem token for later Trust Layer API calls
        await pool.query(
            'UPDATE users SET verification_token = $1 WHERE id = $2',
            [result.ecosystemToken, user.id]
        )

        res.json({
            token,
            ecosystemToken: result.ecosystemToken,
            user: userResponse(user),
        })
    } catch (err: any) {
        console.error('SSO exchange error:', err)
        res.status(500).json({ error: 'SSO token exchange failed' })
    }
})

// ════════════════════════════════
//  HALLMARKS
// ════════════════════════════════
app.post('/api/hallmark/generate', authMiddleware, async (req: any, res) => {
    try {
        const { productName, modelType, polyCount, format } = req.body
        const user = (await pool.query('SELECT * FROM users WHERE id = $1', [req.userId])).rows[0]

        const tl = await import('./trustLayerApi.js')
        const result = await tl.hallmarkCreation(productName, req.userId, {
            modelType: modelType || '3d-model',
            polyCount: polyCount || 0,
            format: format || 'glb',
            creator: user.email,
        })

        // Store hallmark locally
        await pool.query(
            `INSERT INTO hallmarks (user_id, hallmark_id, hallmark_type, product_name, metadata)
             VALUES ($1, $2, 'creation', $3, $4)`,
            [req.userId, result.hallmark.hallmarkId, productName, JSON.stringify(result.hallmark)]
        )

        // Create trust stamp for the creation
        const ecosystemToken = user.verification_token
        if (ecosystemToken) {
            try {
                await tl.createTrustStamp(ecosystemToken, 'trustgen-create', {
                    modelId: result.hallmark.hallmarkId,
                    modelName: productName,
                    polyCount: polyCount || 0,
                })
            } catch (err) { console.error('Trust stamp error:', err) }
        }

        res.json(result)
    } catch (err: any) {
        console.error('Hallmark error:', err)
        res.status(500).json({ error: 'Failed to generate hallmark' })
    }
})

app.get('/api/hallmark/:hallmarkId/verify', async (req, res) => {
    try {
        const tl = await import('./trustLayerApi.js')
        const result = await tl.verifyHallmark(req.params.hallmarkId)
        res.json(result)
    } catch (err: any) {
        res.status(500).json({ error: 'Verification failed' })
    }
})

app.get('/api/hallmarks', authMiddleware, async (req: any, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM hallmarks WHERE user_id = $1 ORDER BY created_at DESC',
            [req.userId]
        )
        res.json(result.rows)
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to list hallmarks' })
    }
})

// ════════════════════════════════
//  TRUST STAMPS
// ════════════════════════════════
app.post('/api/trust-stamp', authMiddleware, async (req: any, res) => {
    try {
        const { category, data } = req.body
        const user = (await pool.query('SELECT verification_token FROM users WHERE id = $1', [req.userId])).rows[0]
        if (!user?.verification_token) return res.status(401).json({ error: 'No ecosystem token — sign in via SSO' })

        const tl = await import('./trustLayerApi.js')
        const result = await tl.createTrustStamp(user.verification_token, category, data)

        // Store locally
        await pool.query(
            'INSERT INTO trust_stamps (user_id, category, data, stamp_id) VALUES ($1, $2, $3, $4)',
            [req.userId, category, JSON.stringify(data), result.stampId]
        )

        res.json(result)
    } catch (err: any) {
        console.error('Trust stamp error:', err)
        res.status(500).json({ error: 'Failed to create trust stamp' })
    }
})

// ════════════════════════════════
//  WALLET / SIG BALANCE
// ════════════════════════════════
app.get('/api/wallet/balance', authMiddleware, async (req: any, res) => {
    try {
        const tl = await import('./trustLayerApi.js')
        const address = tl.deriveWalletAddress(req.userId)
        const balance = await tl.getWalletBalance(address)
        res.json({ address, ...balance })
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to get wallet balance' })
    }
})

// ════════════════════════════════
//  WEBHOOK RECEIVER (Trust Layer → TrustGen)
// ════════════════════════════════
app.post('/api/webhooks/trustlayer', async (req, res) => {
    try {
        const { event, data } = req.body
        console.log(`◈ Trust Layer webhook: ${event}`, JSON.stringify(data).slice(0, 200))

        switch (event) {
            case 'identity.updated':
                if (data.email) {
                    await pool.query('UPDATE users SET name = $1 WHERE email = $2', [data.displayName, data.email])
                }
                break
            case 'payment.completed':
                console.log(`◈ Payment from Trust Layer: ${data.amount} ${data.currency}`)
                break
            case 'hallmark.verified':
                console.log(`◈ Hallmark verified: ${data.hallmarkId}`)
                break
        }

        res.json({ received: true })
    } catch (err: any) {
        console.error('Webhook error:', err)
        res.status(500).json({ error: 'Webhook processing failed' })
    }
})

// ════════════════════════════════
//  PUBLIC CREATIONS (for Explore Hub)
// ════════════════════════════════
app.get('/api/public/creations', async (_req, res) => {
    try {
        const result = await pool.query(
            `SELECT p.id, p.name, p.description, p.thumbnail_url, p.created_at,
                    u.name AS creator_name, h.hallmark_id
             FROM projects p
             JOIN users u ON p.user_id = u.id
             LEFT JOIN hallmarks h ON h.user_id = p.user_id AND h.hallmark_type = 'creation'
             WHERE p.thumbnail_url IS NOT NULL
             ORDER BY p.created_at DESC
             LIMIT 50`
        )
        res.json(result.rows.map(r => ({
            id: r.id,
            name: r.name,
            description: r.description,
            thumbnailUrl: r.thumbnail_url,
            creatorName: r.creator_name,
            hallmarkId: r.hallmark_id,
            createdAt: r.created_at,
        })))
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to list public creations' })
    }
})

// ════════════════════════════════
//  NETWORK STATS (proxy to Trust Layer)
// ════════════════════════════════
app.get('/api/network/stats', async (_req, res) => {
    try {
        const tl = await import('./trustLayerApi.js')
        const stats = await tl.getNetworkStats()
        res.json(stats)
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to get network stats' })
    }
})

// ════════════════════════════════
//  TRUSTVAULT — ASSET STORAGE
// ════════════════════════════════

// Export scene to TrustVault (auto-hallmark)
app.post('/api/vault/export', authMiddleware, async (req: any, res) => {
    try {
        const { sceneName, sceneData, format } = req.body
        if (!sceneName || !sceneData) return res.status(400).json({ error: 'Missing scene data' })

        const user = (await pool.query('SELECT * FROM users WHERE id = $1', [req.userId])).rows[0]
        if (!user?.verification_token) return res.status(401).json({ error: 'SSO token required — sign in via Trust Layer' })

        const tl = await import('./trustLayerApi.js')
        const ecosystemToken = user.verification_token

        // 1. Get presigned upload URL
        const filename = `${sceneName.replace(/[^a-z0-9]/gi, '-')}-${Date.now()}.${format || 'json'}`
        const presigned = await tl.getPresignedUploadUrl(ecosystemToken, filename, 'application/json')

        // 2. Upload scene data
        const blob = JSON.stringify(sceneData)
        await fetch(presigned.uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: blob,
        })

        // 3. Generate hallmark
        const hallmarkResult = await tl.hallmarkCreation(sceneName, req.userId, {
            modelType: '3d-scene',
            format: format || 'json',
            creator: user.email,
        })

        // Store hallmark locally
        await pool.query(
            `INSERT INTO hallmarks (user_id, hallmark_id, hallmark_type, product_name, metadata)
             VALUES ($1, $2, 'creation', $3, $4)`,
            [req.userId, hallmarkResult.hallmark.hallmarkId, sceneName, JSON.stringify(hallmarkResult.hallmark)]
        )

        // 4. Register asset in vault
        const asset = await tl.registerVaultAsset(ecosystemToken, presigned.assetId, {
            name: sceneName,
            type: '3d-scene',
            size: blob.length,
            hallmarkId: hallmarkResult.hallmark.hallmarkId,
            format: format || 'json',
        })

        res.json({
            success: true,
            assetUrl: presigned.publicUrl,
            hallmarkId: hallmarkResult.hallmark.hallmarkId,
            asset: asset.asset,
        })
    } catch (err: any) {
        console.error('Vault export error:', err)
        res.status(500).json({ error: 'Vault export failed' })
    }
})

// List user's vault assets
app.get('/api/vault/assets', authMiddleware, async (req: any, res) => {
    try {
        const user = (await pool.query('SELECT verification_token FROM users WHERE id = $1', [req.userId])).rows[0]
        if (!user?.verification_token) return res.status(401).json({ error: 'SSO token required' })

        const tl = await import('./trustLayerApi.js')
        const result = await tl.getVaultAssets(user.verification_token)
        res.json(result)
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to list vault assets' })
    }
})

// ════════════════════════════════
//  REFERRAL / AFFILIATE PROGRAM
// ════════════════════════════════

// 1. Record a referral signup
app.post('/api/referrals/signup', authMiddleware, async (req: any, res) => {
    try {
        const { referralCode } = req.body
        if (!referralCode) return res.status(400).json({ error: 'Missing referral code' })

        // Find referrer
        const codeResult = await pool.query('SELECT * FROM referral_codes WHERE code = $1', [referralCode])
        if (codeResult.rows.length === 0) return res.status(404).json({ error: 'Invalid referral code' })

        const referrerId = codeResult.rows[0].user_id

        // Fraud: self-referral check
        if (referrerId === req.userId) return res.status(400).json({ error: 'Cannot refer yourself' })

        // Fraud: duplicate check
        const dup = await pool.query(
            'SELECT id FROM referrals WHERE referrer_id = $1 AND referred_id = $2',
            [referrerId, req.userId]
        )
        if (dup.rows.length > 0) return res.status(409).json({ error: 'Referral already recorded' })

        await pool.query(
            'INSERT INTO referrals (referrer_id, referred_id, referral_code, status, ip_address) VALUES ($1, $2, $3, $4, $5)',
            [referrerId, req.userId, referralCode, 'completed', req.ip]
        )

        // Update counters
        await pool.query('UPDATE referral_codes SET signups = signups + 1 WHERE code = $1', [referralCode])
        await pool.query(
            'UPDATE affiliate_profiles SET total_signups = total_signups + 1 WHERE user_id = $1',
            [referrerId]
        )

        res.json({ success: true })
    } catch (err: any) {
        console.error('Referral signup error:', err)
        res.status(500).json({ error: 'Failed to record referral' })
    }
})

// 2. Track a referral link click
app.post('/api/referrals/track-click', async (req, res) => {
    try {
        const { code } = req.body
        if (!code) return res.status(400).json({ error: 'Missing code' })

        await pool.query('UPDATE referral_codes SET clicks = clicks + 1 WHERE code = $1', [code])
        const codeRow = await pool.query('SELECT user_id FROM referral_codes WHERE code = $1', [code])
        if (codeRow.rows.length > 0) {
            await pool.query(
                'UPDATE affiliate_profiles SET total_clicks = total_clicks + 1 WHERE user_id = $1',
                [codeRow.rows[0].user_id]
            )
        }

        res.json({ success: true })
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to track click' })
    }
})

// 3. Get user's referral code + stats
app.get('/api/referrals/code', authMiddleware, async (req: any, res) => {
    try {
        const result = await pool.query('SELECT * FROM referral_codes WHERE user_id = $1', [req.userId])
        if (result.rows.length === 0) {
            // Auto-create if missing
            await createAffiliateProfile(req.userId)
            const retry = await pool.query('SELECT * FROM referral_codes WHERE user_id = $1', [req.userId])
            return res.json(retry.rows[0] || { error: 'No referral code found' })
        }
        res.json(result.rows[0])
    } catch (err: any) {
        res.status(500).json({ error: 'Failed to get referral code' })
    }
})

// 4. Full affiliate dashboard stats
app.get('/api/referrals/stats', authMiddleware, async (req: any, res) => {
    try {
        const profile = await pool.query('SELECT * FROM affiliate_profiles WHERE user_id = $1', [req.userId])
        const code = await pool.query('SELECT * FROM referral_codes WHERE user_id = $1', [req.userId])
        const recentReferrals = await pool.query(
            `SELECT r.*, u.email AS referred_email, u.name AS referred_name
             FROM referrals r
             LEFT JOIN users u ON r.referred_id = u.id
             WHERE r.referrer_id = $1
             ORDER BY r.created_at DESC LIMIT 20`,
            [req.userId]
        )

        // Tier calculation
        const totalSignups = profile.rows[0]?.total_signups || 0
        let tier = 'explorer'
        if (totalSignups >= 50) tier = 'oracle'
        else if (totalSignups >= 20) tier = 'architect'
        else if (totalSignups >= 5) tier = 'builder'

        // Commission rates by tier
        const commissionRates: Record<string, number> = {
            explorer: 0.05, builder: 0.08, architect: 0.12, oracle: 0.18,
        }

        res.json({
            profile: profile.rows[0] || { tier: 'explorer' },
            code: code.rows[0] || null,
            recentReferrals: recentReferrals.rows,
            tier,
            commissionRate: commissionRates[tier],
            nextTier: tier === 'explorer' ? 'builder' : tier === 'builder' ? 'architect' : tier === 'architect' ? 'oracle' : null,
            nextTierThreshold: tier === 'explorer' ? 5 : tier === 'builder' ? 20 : tier === 'architect' ? 50 : 0,
        })
    } catch (err: any) {
        console.error('Affiliate stats error:', err)
        res.status(500).json({ error: 'Failed to get affiliate stats' })
    }
})

// 5. Cross-platform affiliate lookup by hash
app.get('/api/affiliates/lookup/:hash', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT rc.user_hash, rc.code, ap.tier, u.name
             FROM referral_codes rc
             JOIN affiliate_profiles ap ON rc.user_id = ap.user_id
             JOIN users u ON rc.user_id = u.id
             WHERE rc.user_hash = $1`,
            [req.params.hash]
        )
        if (result.rows.length === 0) return res.status(404).json({ error: 'Affiliate not found' })
        res.json(result.rows[0])
    } catch (err: any) {
        res.status(500).json({ error: 'Affiliate lookup failed' })
    }
})

// ════════════════════════════════
//  HEALTH CHECK
// ════════════════════════════════
app.get('/api/health', async (_req, res) => {
    try {
        await pool.query('SELECT 1')
        res.json({ status: 'ok', timestamp: new Date().toISOString() })
    } catch {
        res.status(503).json({ status: 'unhealthy', timestamp: new Date().toISOString() })
    }
})

// ════════════════════════════════
//  ADMIN ROUTES (Developer Portal)
// ════════════════════════════════
const serverStartTime = Date.now()

app.get('/api/admin/health', async (_req, res) => {
    try {
        const dbStart = Date.now()
        await pool.query('SELECT 1')
        const dbLatency = Date.now() - dbStart
        const mem = process.memoryUsage()
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - serverStartTime) / 1000),
            memory: {
                used: Math.round(mem.heapUsed / 1024 / 1024),
                total: Math.round(mem.heapTotal / 1024 / 1024),
                rss: Math.round(mem.rss / 1024 / 1024),
            },
            dbConnected: true,
            dbLatencyMs: dbLatency,
        })
    } catch (err: any) {
        res.json({
            status: 'degraded',
            timestamp: new Date().toISOString(),
            dbConnected: false,
            error: err.message,
        })
    }
})

app.get('/api/admin/stats', async (_req, res) => {
    try {
        const tables: Record<string, number> = {}
        for (const t of ['tenants', 'users', 'projects', 'trust_stamps', 'subscriptions']) {
            try {
                const r = await pool.query(`SELECT COUNT(*) FROM ${t}`)
                tables[t] = parseInt(r.rows[0].count)
            } catch { tables[t] = -1 }
        }
        res.json({ tables, timestamp: new Date().toISOString() })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

app.get('/api/admin/env-status', (_req, res) => {
    const vars = [
        'DATABASE_URL', 'JWT_SECRET', 'RESEND_API_KEY',
        'TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER',
        'STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_PRICE_PRO', 'STRIPE_PRICE_ENTERPRISE',
        'TRUSTLAYER_API_KEY', 'TRUSTLAYER_API_SECRET', 'TRUSTLAYER_BASE_URL',
        'CLIENT_URL', 'PORT',
    ]
    const variables: Record<string, boolean> = {}
    vars.forEach(v => { variables[v] = !!process.env[v] })
    res.json({ variables, timestamp: new Date().toISOString() })
})

// ════════════════════════════════
//  BLOG ROUTES
// ════════════════════════════════

// Blog posts table (created in initDB extension)
async function initBlogTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS blog_posts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            slug TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            excerpt TEXT,
            category TEXT DEFAULT 'general',
            tags TEXT[] DEFAULT '{}',
            author TEXT DEFAULT 'TrustGen Team',
            thumbnail_url TEXT,
            published BOOLEAN DEFAULT false,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
    `)
}

app.get('/api/blog', async (req, res) => {
    try {
        const publishedOnly = req.query.all !== 'true'
        const where = publishedOnly ? 'WHERE published = true' : ''
        const result = await pool.query(
            `SELECT id, slug, title, excerpt, category, tags, author, thumbnail_url, published, created_at, updated_at
             FROM blog_posts ${where} ORDER BY created_at DESC LIMIT 50`
        )
        res.json(result.rows)
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

app.get('/api/blog/:slug', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM blog_posts WHERE slug = $1', [req.params.slug])
        if (result.rows.length === 0) return res.status(404).json({ error: 'Post not found' })
        res.json(result.rows[0])
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

app.post('/api/blog', async (req, res) => {
    try {
        const { slug, title, content, excerpt, category, tags, author, thumbnail_url, published } = req.body
        if (!slug || !title || !content) return res.status(400).json({ error: 'slug, title, content required' })
        const result = await pool.query(
            `INSERT INTO blog_posts (slug, title, content, excerpt, category, tags, author, thumbnail_url, published)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [slug, title, content, excerpt || '', category || 'general', tags || [], author || 'TrustGen Team', thumbnail_url || '', published || false]
        )
        res.status(201).json(result.rows[0])
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

app.put('/api/blog/:id', async (req, res) => {
    try {
        const { slug, title, content, excerpt, category, tags, author, thumbnail_url, published } = req.body
        const result = await pool.query(
            `UPDATE blog_posts SET slug=COALESCE($1,slug), title=COALESCE($2,title), content=COALESCE($3,content),
             excerpt=COALESCE($4,excerpt), category=COALESCE($5,category), tags=COALESCE($6,tags),
             author=COALESCE($7,author), thumbnail_url=COALESCE($8,thumbnail_url), published=COALESCE($9,published),
             updated_at=NOW() WHERE id=$10 RETURNING *`,
            [slug, title, content, excerpt, category, tags, author, thumbnail_url, published, req.params.id]
        )
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
        res.json(result.rows[0])
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

app.delete('/api/blog/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM blog_posts WHERE id = $1', [req.params.id])
        res.json({ ok: true })
    } catch (err: any) {
        res.status(500).json({ error: err.message })
    }
})

// ════════════════════════════════
//  STUDIO IDE API
// ════════════════════════════════

// ── Studio: Project CRUD ──
app.get('/api/studio/projects', authMiddleware, async (req: any, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM studio_projects WHERE user_id = $1 ORDER BY updated_at DESC',
            [req.userId]
        )
        res.json(result.rows)
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.post('/api/studio/projects', authMiddleware, async (req: any, res) => {
    try {
        const { name, description, language } = req.body
        if (!name) return res.status(400).json({ error: 'Name required' })
        const result = await pool.query(
            `INSERT INTO studio_projects (user_id, name, description, language) VALUES ($1, $2, $3, $4) RETURNING *`,
            [req.userId, name, description || '', language || 'javascript']
        )
        const project = result.rows[0]

        // Template-specific starter files
        const files: { name: string; path: string; content: string; lang: string }[] = []
        const lang = language || 'javascript'

        if (lang === 'python') {
            files.push({ name: 'main.py', path: '/main.py', lang: 'python', content: '"""TrustGen Studio Project"""\nfrom flask import Flask, jsonify\n\napp = Flask(__name__)\n\n@app.route("/")\ndef index():\n    return jsonify({"message": "Hello from TrustGen!"})\n\nif __name__ == "__main__":\n    app.run(debug=True, port=3000)\n' })
            files.push({ name: 'requirements.txt', path: '/requirements.txt', lang: 'plaintext', content: 'flask>=3.0\ngunicorn>=21.2\n' })
        } else if (lang === 'go') {
            files.push({ name: 'main.go', path: '/main.go', lang: 'go', content: 'package main\n\nimport (\n\t"fmt"\n\t"net/http"\n)\n\nfunc main() {\n\thttp.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {\n\t\tfmt.Fprintf(w, "Hello from TrustGen!")\n\t})\n\tfmt.Println("Server running on :3000")\n\thttp.ListenAndServe(":3000", nil)\n}\n' })
            files.push({ name: 'go.mod', path: '/go.mod', lang: 'go', content: 'module trustgen-project\n\ngo 1.21\n' })
        } else if (lang === 'rust') {
            files.push({ name: 'main.rs', path: '/src/main.rs', lang: 'rust', content: 'use actix_web::{web, App, HttpServer, Responder};\n\nasync fn index() -> impl Responder {\n    "Hello from TrustGen!"\n}\n\n#[actix_web::main]\nasync fn main() -> std::io::Result<()> {\n    HttpServer::new(|| App::new().route("/", web::get().to(index)))\n        .bind("0.0.0.0:3000")?\n        .run()\n        .await\n}\n' })
            files.push({ name: 'Cargo.toml', path: '/Cargo.toml', lang: 'toml', content: '[package]\nname = "trustgen-project"\nversion = "0.1.0"\nedition = "2021"\n\n[dependencies]\nactix-web = "4"\ntokio = { version = "1", features = ["full"] }\n' })
        } else {
            // JavaScript / TypeScript templates
            const ext = lang === 'typescript' ? 'tsx' : 'js'
            const isReactish = ['react', 'nextjs', 'vue'].some(k => name.toLowerCase().includes(k)) || lang === 'typescript'

            if (isReactish) {
                files.push({ name: `App.${ext}`, path: `/App.${ext}`, lang: lang, content: `// TrustGen Studio — ${name}\nimport { useState } from 'react'\n\nexport default function App() {\n  const [count, setCount] = useState(0)\n\n  return (\n    <div style={{ padding: 40, fontFamily: 'Inter, sans-serif', color: '#e2e8f0', background: '#0a0a10', minHeight: '100vh' }}>\n      <h1 style={{ color: '#22d3ee', fontSize: 36 }}>${name}</h1>\n      <p style={{ color: '#94a3b8' }}>Built with TrustGen Studio</p>\n      <button\n        onClick={() => setCount(c => c + 1)}\n        style={{ padding: '10px 24px', background: '#06b6d4', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer', fontSize: 16 }}\n      >\n        Count: {count}\n      </button>\n    </div>\n  )\n}\n` })
                files.push({ name: 'index.css', path: '/index.css', lang: 'css', content: `/* ${name} — Styles */\n* { margin: 0; padding: 0; box-sizing: border-box; }\nbody { background: #0a0a10; color: #e2e8f0; font-family: 'Inter', sans-serif; }\n` })
            } else {
                files.push({ name: `index.${ext === 'tsx' ? 'ts' : 'js'}`, path: `/index.${ext === 'tsx' ? 'ts' : 'js'}`, lang: lang, content: `// TrustGen Studio — ${name}\nconst express = require('express');\nconst app = express();\n\napp.get('/', (req, res) => {\n  res.json({ message: 'Hello from TrustGen!' });\n});\n\napp.listen(3000, () => console.log('Server running on :3000'));\n` })
            }
            files.push({ name: 'package.json', path: '/package.json', lang: 'json', content: `{\n  "name": "${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}",\n  "version": "1.0.0",\n  "scripts": {\n    "dev": "vite",\n    "build": "vite build"\n  }\n}\n` })
        }

        // Special: TrustGen 3D Scene template
        if (name.toLowerCase().includes('3d') || name.toLowerCase().includes('scene') || name.toLowerCase().includes('trustgen')) {
            files.length = 0 // clear defaults
            files.push({ name: 'Scene.tsx', path: '/Scene.tsx', lang: 'typescript', content: `// TrustGen 3D Scene — ${name}\nimport { useRef } from 'react'\nimport { useFrame } from '@react-three/fiber'\nimport { MeshTransmissionMaterial, Environment, Float } from '@react-three/drei'\nimport * as THREE from 'three'\n\nexport function Scene() {\n  const meshRef = useRef<THREE.Mesh>(null)\n\n  useFrame((state) => {\n    if (!meshRef.current) return\n    meshRef.current.rotation.y = state.clock.elapsedTime * 0.3\n    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2\n  })\n\n  return (\n    <>\n      <Environment preset="city" />\n      <ambientLight intensity={0.4} />\n      <directionalLight position={[5, 5, 5]} intensity={1.2} castShadow />\n      <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.5}>\n        <mesh ref={meshRef} castShadow>\n          <torusKnotGeometry args={[1, 0.35, 128, 16]} />\n          <MeshTransmissionMaterial\n            backside\n            samples={8}\n            thickness={0.3}\n            chromaticAberration={0.2}\n            anisotropy={0.3}\n            distortion={0.5}\n            roughness={0.1}\n            color="#22d3ee"\n          />\n        </mesh>\n      </Float>\n      <mesh receiveShadow rotation-x={-Math.PI / 2} position-y={-2}>\n        <planeGeometry args={[20, 20]} />\n        <shadowMaterial opacity={0.3} />\n      </mesh>\n    </>\n  )\n}\n` })
            files.push({ name: 'PostFX.tsx', path: '/PostFX.tsx', lang: 'typescript', content: `// Post-processing effects\nimport { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'\n\nexport function PostFX() {\n  return (\n    <EffectComposer>\n      <Bloom luminanceThreshold={0.8} luminanceSmoothing={0.9} intensity={0.6} />\n      <ChromaticAberration offset={[0.001, 0.001]} />\n    </EffectComposer>\n  )\n}\n` })
            files.push({ name: 'shader.glsl', path: '/shader.glsl', lang: 'glsl', content: `// Custom shader — TrustGen Studio\nprecision mediump float;\nuniform float u_time;\nuniform vec2 u_resolution;\n\nvoid main() {\n  vec2 uv = gl_FragCoord.xy / u_resolution;\n  vec3 color = 0.5 + 0.5 * cos(u_time + uv.xyx + vec3(0.0, 2.0, 4.0));\n  gl_FragColor = vec4(color * 0.8, 1.0);\n}\n` })
        }

        // Insert all files
        for (const f of files) {
            await pool.query(
                'INSERT INTO studio_files (project_id, path, name, content, language) VALUES ($1, $2, $3, $4, $5)',
                [project.id, f.path, f.name, f.content, f.lang]
            )
        }

        res.status(201).json(project)
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.get('/api/studio/projects/:id', authMiddleware, async (req: any, res) => {
    try {
        const project = await pool.query('SELECT * FROM studio_projects WHERE id = $1', [req.params.id])
        if (project.rows.length === 0) return res.status(404).json({ error: 'Not found' })
        const files = await pool.query('SELECT * FROM studio_files WHERE project_id = $1 ORDER BY is_folder DESC, name', [req.params.id])
        const secrets = await pool.query('SELECT id, key, environment, created_at FROM studio_secrets WHERE project_id = $1', [req.params.id])
        const configs = await pool.query('SELECT * FROM studio_configs WHERE project_id = $1', [req.params.id])
        res.json({ ...project.rows[0], files: files.rows, secrets: secrets.rows, configs: configs.rows })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.patch('/api/studio/projects/:id', authMiddleware, async (req: any, res) => {
    try {
        const { name, description, language, is_public } = req.body
        const result = await pool.query(
            `UPDATE studio_projects SET name = COALESCE($1, name), description = COALESCE($2, description),
             language = COALESCE($3, language), is_public = COALESCE($4, is_public), updated_at = NOW()
             WHERE id = $5 AND user_id = $6 RETURNING *`,
            [name, description, language, is_public, req.params.id, req.userId]
        )
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
        res.json(result.rows[0])
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/studio/projects/:id', authMiddleware, async (req: any, res) => {
    try {
        await pool.query('DELETE FROM studio_projects WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
        res.json({ ok: true })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ── Studio: File CRUD ──
app.post('/api/studio/projects/:id/files', authMiddleware, async (req: any, res) => {
    try {
        const { path, name, content, language, is_folder } = req.body
        if (!name) return res.status(400).json({ error: 'Name required' })
        const lang = language || getLanguageFromExt(name)
        const result = await pool.query(
            `INSERT INTO studio_files (project_id, path, name, content, language, is_folder)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.params.id, path || '/' + name, name, content || '', lang, is_folder || false]
        )
        await pool.query('UPDATE studio_projects SET updated_at = NOW() WHERE id = $1', [req.params.id])
        res.status(201).json(result.rows[0])
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.patch('/api/studio/files/:id', authMiddleware, async (req: any, res) => {
    try {
        const { content, name, path } = req.body
        const result = await pool.query(
            `UPDATE studio_files SET content = COALESCE($1, content), name = COALESCE($2, name),
             path = COALESCE($3, path), updated_at = NOW() WHERE id = $4 RETURNING *`,
            [content, name, path, req.params.id]
        )
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' })
        // Touch the project's updated_at
        if (result.rows[0].project_id) {
            await pool.query('UPDATE studio_projects SET updated_at = NOW() WHERE id = $1', [result.rows[0].project_id])
        }
        res.json(result.rows[0])
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/studio/files/:id', authMiddleware, async (req: any, res) => {
    try {
        await pool.query('DELETE FROM studio_files WHERE id = $1', [req.params.id])
        res.json({ ok: true })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ── Studio: Secrets ──
app.post('/api/studio/projects/:id/secrets', authMiddleware, async (req: any, res) => {
    try {
        const { key, value, environment } = req.body
        if (!key || !value) return res.status(400).json({ error: 'Key and value required' })
        const result = await pool.query(
            'INSERT INTO studio_secrets (project_id, key, value, environment) VALUES ($1, $2, $3, $4) RETURNING id, key, environment, created_at',
            [req.params.id, key, value, environment || 'shared']
        )
        res.status(201).json(result.rows[0])
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/studio/secrets/:id', authMiddleware, async (req: any, res) => {
    try {
        await pool.query('DELETE FROM studio_secrets WHERE id = $1', [req.params.id])
        res.json({ ok: true })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ── Studio: Configs ──
app.post('/api/studio/projects/:id/configs', authMiddleware, async (req: any, res) => {
    try {
        const { key, value, environment } = req.body
        if (!key) return res.status(400).json({ error: 'Key required' })
        const result = await pool.query(
            'INSERT INTO studio_configs (project_id, key, value, environment) VALUES ($1, $2, $3, $4) RETURNING *',
            [req.params.id, key, value || '', environment || 'shared']
        )
        res.status(201).json(result.rows[0])
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.delete('/api/studio/configs/:id', authMiddleware, async (req: any, res) => {
    try {
        await pool.query('DELETE FROM studio_configs WHERE id = $1', [req.params.id])
        res.json({ ok: true })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ── Studio: Version Control ──
app.get('/api/studio/projects/:id/commits', authMiddleware, async (req: any, res) => {
    try {
        const result = await pool.query(
            'SELECT id, hash, parent_hash, message, branch, author_id, created_at FROM studio_commits WHERE project_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.params.id]
        )
        res.json(result.rows)
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.post('/api/studio/projects/:id/commits', authMiddleware, async (req: any, res) => {
    try {
        const { message, branch } = req.body
        if (!message) return res.status(400).json({ error: 'Commit message required' })
        // Snapshot all files
        const files = await pool.query('SELECT path, name, content, language, is_folder FROM studio_files WHERE project_id = $1', [req.params.id])
        const snapshot = JSON.stringify(files.rows)
        const hash = crypto.createHash('sha256').update(snapshot + Date.now()).digest('hex').slice(0, 12)
        // Get parent hash
        const latestCommit = await pool.query(
            'SELECT hash FROM studio_commits WHERE project_id = $1 AND branch = $2 ORDER BY created_at DESC LIMIT 1',
            [req.params.id, branch || 'main']
        )
        const parentHash = latestCommit.rows[0]?.hash || null
        const result = await pool.query(
            `INSERT INTO studio_commits (project_id, hash, parent_hash, message, author_id, branch, files_snapshot)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [req.params.id, hash, parentHash, message, req.userId, branch || 'main', snapshot]
        )
        res.status(201).json(result.rows[0])
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.post('/api/studio/commits/:id/checkout', authMiddleware, async (req: any, res) => {
    try {
        const commit = await pool.query('SELECT * FROM studio_commits WHERE id = $1', [req.params.id])
        if (commit.rows.length === 0) return res.status(404).json({ error: 'Commit not found' })
        const files = JSON.parse(commit.rows[0].files_snapshot)
        const projectId = commit.rows[0].project_id
        // Delete current files and restore from snapshot
        await pool.query('DELETE FROM studio_files WHERE project_id = $1', [projectId])
        for (const file of files) {
            await pool.query(
                'INSERT INTO studio_files (project_id, path, name, content, language, is_folder) VALUES ($1, $2, $3, $4, $5, $6)',
                [projectId, file.path, file.name, file.content, file.language, file.is_folder]
            )
        }
        res.json({ ok: true, restoredFiles: files.length })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ── Studio: Terminal (sandboxed) ──
const BLOCKED_COMMANDS = ['rm -rf /', 'mkfs', 'dd if=', ':(){', 'fork', 'shutdown', 'reboot']

app.post('/api/studio/projects/:id/terminal', authMiddleware, requireTier('pro'), async (req: any, res) => {
    try {
        const { command } = req.body
        if (!command) return res.status(400).json({ error: 'Command required' })
        // Check blocked commands
        const isBlocked = BLOCKED_COMMANDS.some(bc => command.toLowerCase().includes(bc))
        if (isBlocked) return res.status(403).json({ error: 'Command blocked for security' })
        // Simulate terminal output (sandboxed — no real shell execution in this environment)
        const output = `$ ${command}\n[TrustGen Studio] Command queued. Real shell execution available in deployed environments.`
        res.json({ output, exitCode: 0 })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ── Studio: Lint / Diagnostics ──
app.post('/api/studio/lint', authMiddleware, async (req: any, res) => {
    try {
        const { code, filename } = req.body
        if (!code) return res.json({ diagnostics: [], summary: { errors: 0, warnings: 0, info: 0 } })
        const diagnostics: any[] = []
        const lines = code.split('\n')
        lines.forEach((line: string, i: number) => {
            if (line.includes('var ')) diagnostics.push({ line: i + 1, severity: 'warning', message: 'Use let/const instead of var', source: 'lint' })
            if (line.includes('console.log')) diagnostics.push({ line: i + 1, severity: 'info', message: 'console.log statement', source: 'lint' })
            if (/[^=!]==[^=]/.test(line)) diagnostics.push({ line: i + 1, severity: 'warning', message: 'Use === instead of ==', source: 'lint' })
            if (/TODO|FIXME|HACK/.test(line)) diagnostics.push({ line: i + 1, severity: 'info', message: 'Contains TODO/FIXME marker', source: 'lint' })
            if (line.length > 120) diagnostics.push({ line: i + 1, severity: 'info', message: `Line exceeds 120 characters (${line.length})`, source: 'lint' })
            if (line.includes('eval(')) diagnostics.push({ line: i + 1, severity: 'error', message: 'eval() is a security risk', source: 'lint' })
        })
        const summary = {
            errors: diagnostics.filter(d => d.severity === 'error').length,
            warnings: diagnostics.filter(d => d.severity === 'warning').length,
            info: diagnostics.filter(d => d.severity === 'info').length,
        }
        res.json({ diagnostics, summary })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ── Studio: AI Chat ──
app.post('/api/studio/ai/chat', authMiddleware, async (req: any, res) => {
    try {
        const { prompt, agentMode, currentFile, projectFiles } = req.body
        if (!prompt) return res.status(400).json({ error: 'Prompt required' })

        // Try OpenAI if key is set
        const openaiKey = process.env.OPENAI_API_KEY
        if (openaiKey) {
            try {
                const systemPrompt = agentMode
                    ? `You are TrustGen Studio Agent — an autonomous code assistant. You can read the user's current file and suggest precise edits. Always wrap code in fenced code blocks with language tags. Be concise and actionable.${currentFile ? `\n\nUser's current file: ${currentFile.name} (${currentFile.language})\nContent:\n${currentFile.content}` : ''}`
                    : `You are TrustGen Studio AI — a helpful coding assistant. Answer questions, generate code, and help debug. Always wrap code in fenced code blocks with language tags. Be concise.`

                const response = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
                    body: JSON.stringify({
                        model: 'gpt-4o',
                        messages: [
                            { role: 'system', content: systemPrompt },
                            { role: 'user', content: prompt },
                        ],
                        max_tokens: 2000,
                        temperature: 0.7,
                    }),
                })
                const data: any = await response.json()
                const content = data.choices?.[0]?.message?.content || 'No response generated.'
                return res.json({ content })
            } catch {
                // Fall through to fallback
            }
        }

        // Fallback: context-aware response
        const lower = prompt.toLowerCase()
        let content = ''
        if (lower.includes('component') || lower.includes('react')) {
            content = "Here's a starter component:\n\n```typescript\nimport { useState } from 'react'\n\nexport function MyComponent() {\n  const [count, setCount] = useState(0)\n  return (\n    <div>\n      <h2>My Component</h2>\n      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>\n    </div>\n  )\n}\n```\n\nWould you like me to customize this further?"
        } else if (lower.includes('three') || lower.includes('3d') || lower.includes('scene')) {
            content = "Here's a Three.js scene:\n\n```typescript\nimport * as THREE from 'three'\n\nconst scene = new THREE.Scene()\nconst camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight)\nconst renderer = new THREE.WebGLRenderer({ antialias: true })\n\nconst mesh = new THREE.Mesh(\n  new THREE.BoxGeometry(1,1,1),\n  new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.5 })\n)\nscene.add(mesh)\n```"
        } else if (lower.includes('shader') || lower.includes('glsl')) {
            content = "Here's a GLSL fragment shader:\n\n```glsl\nprecision mediump float;\nuniform float u_time;\nuniform vec2 u_resolution;\n\nvoid main() {\n  vec2 uv = gl_FragCoord.xy / u_resolution;\n  vec3 col = 0.5 + 0.5*cos(u_time+uv.xyx+vec3(0,2,4));\n  gl_FragColor = vec4(col, 1.0);\n}\n```"
        } else {
            content = `I can help with that! ${agentMode ? 'Agent mode is active — I can read your current file context.' : ''}\n\nTo get the best results, try:\n- "Write a React component for..."\n- "Debug this error: ..."\n- "Generate a Three.js scene"\n\n> **Note**: Connect your OpenAI API key in Settings for full AI capabilities.`
        }
        res.json({ content })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ── Studio: Deployments ──
app.post('/api/studio/projects/:id/deploy', authMiddleware, requireTier('pro'), async (req: any, res) => {
    try {
        const project = await pool.query('SELECT name FROM studio_projects WHERE id = $1', [req.params.id])
        if (project.rows.length === 0) return res.status(404).json({ error: 'Project not found' })
        const slug = project.rows[0].name.toLowerCase().replace(/[^a-z0-9]/g, '-')
        const url = `https://${slug}.trustgen.app`
        const result = await pool.query(
            `INSERT INTO studio_deployments (project_id, status, url, version) VALUES ($1, 'building', $2, $3) RETURNING *`,
            [req.params.id, url, Date.now().toString(36)]
        )
        // Simulate build completing after 3 seconds
        const deployId = result.rows[0].id
        setTimeout(async () => {
            await pool.query(`UPDATE studio_deployments SET status = 'live', build_logs = 'Build completed successfully.' WHERE id = $1`, [deployId])
        }, 3000)
        res.status(201).json(result.rows[0])
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.get('/api/studio/projects/:id/deployments', authMiddleware, async (req: any, res) => {
    try {
        const result = await pool.query('SELECT * FROM studio_deployments WHERE project_id = $1 ORDER BY created_at DESC', [req.params.id])
        res.json(result.rows)
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ── Studio: TrustHub Code Stamps ──
app.post('/api/studio/trusthub/stamp', authMiddleware, async (req: any, res) => {
    try {
        const { projectId, message, commitHash } = req.body
        if (!projectId) return res.status(400).json({ error: 'projectId required' })
        // Build Merkle-style tree hash from all project files
        const files = await pool.query('SELECT name, content FROM studio_files WHERE project_id = $1 AND is_folder = false', [projectId])
        const fileTree = files.rows
            .map((f: any) => `${f.name}:${crypto.createHash('sha256').update(f.content || '').digest('hex')}`)
            .sort()
            .join('\n')
        const treeHash = crypto.createHash('sha256').update(fileTree).digest('hex')
        const txHash = '0x' + crypto.createHash('sha256').update(`${treeHash}-${Date.now()}-${req.userId}`).digest('hex')
        const provenanceId = `prov-${crypto.randomBytes(8).toString('hex')}`
        const result = await pool.query(
            `INSERT INTO studio_code_stamps (project_id, user_id, commit_hash, tree_hash, provenance_id, tx_hash, block_number, message)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [projectId, req.userId, commitHash || null, treeHash, provenanceId, txHash, Math.floor(Date.now() / 400), message || 'Code stamp']
        )
        res.status(201).json(result.rows[0])
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.get('/api/studio/trusthub/stamps/:projectId', authMiddleware, async (req: any, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM studio_code_stamps WHERE project_id = $1 ORDER BY created_at DESC LIMIT 50',
            [req.params.projectId]
        )
        res.json(result.rows)
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ── Studio: Language detection helper ──
function getLanguageFromExt(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() || ''
    const map: Record<string, string> = {
        js: 'javascript', jsx: 'javascript', ts: 'typescript', tsx: 'typescript',
        py: 'python', rb: 'ruby', go: 'go', rs: 'rust', java: 'java',
        html: 'html', css: 'css', json: 'json', md: 'markdown',
        glsl: 'glsl', wgsl: 'wgsl', yml: 'yaml', yaml: 'yaml',
        sh: 'shell', toml: 'toml', xml: 'xml', sql: 'sql',
    }
    return map[ext] || 'plaintext'
}

// ════════════════════════════════
//  COPYRIGHT & DRM PROTECTION
// ════════════════════════════════

app.post('/api/copyright/verify', authMiddleware, async (req: any, res) => {
    try {
        const { contentId, contentType, sourceApp, userId } = req.body
        if (!contentId) return res.status(400).json({ error: 'contentId required' })

        // For TrustBook/dwtl.io content, verify through the ecosystem
        if (sourceApp === 'trustbook' || sourceApp === 'dwtl') {
            // In production: call dwtl.io API to verify ownership
            return res.json({
                licensed: true,
                license: {
                    id: `lic-${Date.now().toString(36)}`,
                    type: 'derivative',
                    contentType, contentId,
                    contentTitle: 'TrustBook Content',
                    holder: { name: 'Author', trustLayerId: userId },
                    grantedAt: new Date().toISOString(),
                    expiresAt: null,
                    permissions: {
                        reproduce: true, derive: true, distribute: true,
                        commercial: true, sublicense: false,
                        requireAttribution: true, modify: true, territories: [],
                    },
                },
            })
        }
        res.json({ licensed: true })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.post('/api/copyright/register', authMiddleware, async (req: any, res) => {
    try {
        const license = { ...req.body, id: `lic-${Date.now().toString(36)}`, grantedAt: new Date().toISOString() }

        // In production: register on Trust Layer blockchain
        const hallmarkId = `hm-lic-${crypto.randomBytes(6).toString('hex')}`
        license.hallmarkId = hallmarkId

        res.json(license)
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.post('/api/copyright/dwtl-verify', authMiddleware, async (req: any, res) => {
    try {
        const { ebookId, authorId } = req.body
        if (!ebookId) return res.status(400).json({ error: 'ebookId required' })

        // In production: POST to dwtl.io/api/verify-ownership
        res.json({
            verified: true,
            license: {
                id: `dwtl-${ebookId}`,
                type: 'derivative',
                contentType: 'ebook', contentId: ebookId,
                contentTitle: `dwtl.io eBook ${ebookId}`,
                holder: { name: authorId, dwtlProfileUrl: `https://dwtl.io/author/${authorId}` },
                grantedAt: new Date().toISOString(),
                expiresAt: null,
                permissions: {
                    reproduce: true, derive: true, distribute: true,
                    commercial: true, sublicense: false,
                    requireAttribution: true, modify: true, territories: [],
                },
            },
        })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.get('/api/copyright/status/:hash', async (req, res) => {
    // In production: check against flagged content database
    res.json({ flagged: false })
})

app.post('/api/copyright/dmca', async (req, res) => {
    try {
        const { contentHash, claimantName, claimantEmail, reason } = req.body
        if (!contentHash || !claimantName || !claimantEmail) {
            return res.status(400).json({ error: 'contentHash, claimantName, claimantEmail required' })
        }
        const ticketId = `DMCA-${Date.now().toString(36).toUpperCase()}`
        console.log(`[DMCA] Ticket ${ticketId} filed by ${claimantName} for hash ${contentHash.slice(0, 16)}...`)
        res.json({ ticketId, status: 'received' })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ════════════════════════════════
//  WORKSPACE / TENANT SYSTEM
// ════════════════════════════════

app.get('/api/workspace', authMiddleware, async (req: any, res) => {
    try {
        const user = (await pool.query('SELECT id, email, name FROM users WHERE id = $1', [req.userId])).rows[0]
        if (!user) return res.status(404).json({ error: 'User not found' })

        res.json({
            tenant: {
                id: `tenant-${user.id}`,
                userId: user.id,
                name: user.name || user.email,
                slug: (user.name || user.email).toLowerCase().replace(/[^a-z0-9]/g, '-'),
                plan: 'pro',
                storageQuota: 50000,
                storageUsed: 0,
                maxScenes: 100,
                maxRenders: 200,
                rendersUsed: 0,
                createdAt: new Date().toISOString(),
                apiKeys: {
                    openai: !!process.env.OPENAI_API_KEY,
                    elevenlabs: !!process.env.ELEVENLABS_API_KEY,
                    youtube: !!process.env.YOUTUBE_CLIENT_ID,
                    tiktok: !!process.env.TIKTOK_CLIENT_KEY,
                },
            },
            scenes: [],
            assets: [],
            renders: [],
            recentActivity: [],
        })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.get('/api/workspace/tenant', authMiddleware, async (req: any, res) => {
    const user = (await pool.query('SELECT id, email, name FROM users WHERE id = $1', [req.userId])).rows[0]
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json({ id: `tenant-${user.id}`, userId: user.id, name: user.name || user.email, plan: 'pro' })
})

app.get('/api/workspace/scenes', authMiddleware, async (_req, res) => { res.json({ scenes: [] }) })
app.get('/api/workspace/assets', authMiddleware, async (_req, res) => { res.json({ assets: [] }) })
app.get('/api/workspace/renders', authMiddleware, async (_req, res) => { res.json({ renders: [] }) })

// Ecosystem token verification (for DevPortal pass-through)
app.post('/api/auth/ecosystem-verify', async (req, res) => {
    try {
        const { ecosystemToken } = req.body
        if (!ecosystemToken) return res.status(400).json({ error: 'Token required' })

        // Verify via Trust Layer API
        const tlResult = await tl.verifySSOToken(ecosystemToken)
        res.json({
            userId: tlResult.userId,
            email: tlResult.email,
            name: tlResult.name,
            apps: [
                { appId: 'trustgen', appName: 'TrustGen', role: 'editor' },
                { appId: 'trustvault', appName: 'TrustVault', role: 'editor' },
            ],
            expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        })
    } catch (err: any) {
        res.status(401).json({ error: 'Token verification failed' })
    }
})

// ════════════════════════════════
//  TRUSTBOOK BRIDGE
// ════════════════════════════════

app.get('/api/trustbook/status', authMiddleware, async (req: any, res) => {
    try {
        const user = (await pool.query('SELECT verification_token FROM users WHERE id = $1', [req.userId])).rows[0]
        if (!user?.verification_token) return res.json({ connected: false, ebooks: [] })
        // Check TrustBook connection via Trust Layer SSO
        res.json({ connected: true, userId: req.userId, ebooks: [], lastSync: new Date().toISOString() })
    } catch { res.json({ connected: false, ebooks: [] }) }
})

app.post('/api/trustbook/connect', authMiddleware, async (req: any, res) => {
    try {
        const user = (await pool.query('SELECT verification_token, email, name FROM users WHERE id = $1', [req.userId])).rows[0]
        if (!user) return res.status(401).json({ error: 'Not authenticated' })
        res.json({ connected: true, userId: req.userId, displayName: user.name || user.email, ebooks: [] })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.get('/api/trustbook/ebooks', authMiddleware, async (_req, res) => {
    // TrustBook catalog — would call TrustBook API in production
    res.json({ ebooks: [] })
})

app.get('/api/trustbook/ebooks/:id', authMiddleware, async (req, res) => {
    res.json({ id: req.params.id, title: '', chapters: [] })
})

app.post('/api/trustbook/cross-link', authMiddleware, async (req: any, res) => {
    try {
        const { ebookId, videoTitle, videoUrl, hallmarkId } = req.body
        if (!ebookId || !videoTitle) return res.status(400).json({ error: 'ebookId and videoTitle required' })
        // In production, this would call the TrustBook API to create the cross-link
        res.json({ success: true, linkUrl: `https://trustbook.app/ebook/${ebookId}/videos` })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ════════════════════════════════
//  PLATFORM UPLOAD (YouTube, TikTok, Ecosystem)
// ════════════════════════════════

// OAuth initiation
app.post('/api/upload/oauth/init', authMiddleware, async (req: any, res) => {
    try {
        const { platform } = req.body
        const state = crypto.randomBytes(16).toString('hex')

        let authUrl = ''
        if (platform === 'youtube') {
            const clientId = process.env.YOUTUBE_CLIENT_ID || ''
            const redirectUri = encodeURIComponent(`${process.env.CLIENT_URL || 'http://localhost:5200'}/api/upload/oauth/callback`)
            authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload&state=${state}&access_type=offline`
        } else if (platform === 'tiktok') {
            const clientKey = process.env.TIKTOK_CLIENT_KEY || ''
            const redirectUri = encodeURIComponent(`${process.env.CLIENT_URL || 'http://localhost:5200'}/api/upload/oauth/callback`)
            authUrl = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=video.publish&response_type=code&redirect_uri=${redirectUri}&state=${state}`
        }

        // Store state in memory for verification
        res.json({ authUrl, state })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

app.get('/api/upload/oauth/check', authMiddleware, async (req: any, res) => {
    const platform = req.query.platform as string
    // Check stored tokens — simplified, would check DB in production
    res.json({ authenticated: false, platform })
})

// YouTube upload endpoint
app.post('/api/upload/youtube', authMiddleware, async (req: any, res) => {
    try {
        // In production: use stored OAuth token to call YouTube Data API v3
        // POST https://www.googleapis.com/upload/youtube/v3/videos
        res.json({ success: true, url: 'https://youtube.com/watch?v=pending', videoId: 'pending' })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// TikTok upload endpoint
app.post('/api/upload/tiktok', authMiddleware, async (req: any, res) => {
    try {
        // In production: use TikTok Content Posting API
        // POST https://open.tiktokapis.com/v2/post/publish/video/init/
        res.json({ success: true, url: 'https://tiktok.com/@user/video/pending', videoId: 'pending' })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// Ecosystem uploads
app.post('/api/upload/ecosystem/:platform', authMiddleware, async (req: any, res) => {
    try {
        const { platform } = req.params
        const { title } = req.body
        // Route to appropriate ecosystem API
        let url = ''
        if (platform === 'trustbook') url = `https://trustbook.app/videos/${Date.now().toString(36)}`
        else if (platform === 'chronicles') url = `https://chronicles.app/portfolio/${Date.now().toString(36)}`
        else if (platform === 'signal-chat') url = `https://signal.trustlayer.app/shared/${Date.now().toString(36)}`

        res.json({ success: true, url, id: Date.now().toString(36) })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// Blockchain render verification
app.post('/api/render/verify', authMiddleware, async (req: any, res) => {
    try {
        const { proofId, contentHash, title } = req.body
        const hallmarkId = `hm-${crypto.randomBytes(8).toString('hex')}`
        const txHash = '0x' + crypto.createHash('sha256').update(`${contentHash}-${Date.now()}`).digest('hex')
        const blockNumber = Math.floor(Date.now() / 400)

        res.json({ hallmarkId, txHash, blockNumber, proofId })
    } catch (err: any) { res.status(500).json({ error: err.message }) }
})

// ════════════════════════════════
//  AI VOICE-OVER (ElevenLabs + OpenAI TTS Fallback)
// ════════════════════════════════

const ELEVENLABS_VOICE_MAP: Record<string, string> = {
    'narrator': 'EXAVITQu4vr4xnSDxMaL', 'male-deep': 'VR6AewLTigWG4xSOukaG',
    'male-warm': 'pNInz6obpgDQGcFmaJgB', 'female-clear': '21m00Tcm4TlvDq8ikWAM',
    'female-warm': 'AZnzlk1XvdvUeBnXmlld', 'child': 'MF3mGyEYCl7XYWbV9V6O',
    'elder': 'TxGEqnHWrfWFTfGW9XjX', 'robot': 'ErXwobaYiN019PkySvjV', 'whisper': 'ThT5KcBeYPX3keUQqHPh',
}
const OPENAI_VOICE_MAP: Record<string, string> = {
    'narrator': 'onyx', 'male-deep': 'onyx', 'male-warm': 'echo',
    'female-clear': 'nova', 'female-warm': 'shimmer', 'child': 'alloy',
    'elder': 'fable', 'robot': 'alloy', 'whisper': 'shimmer',
}
const EMOTION_STYLE: Record<string, string> = {
    neutral: '', excited: 'Speaking with enthusiasm: ', serious: 'In a serious tone: ',
    warm: 'In a warm manner: ', dramatic: 'With dramatic inflection: ',
    sad: 'In a somber tone: ', angry: 'With intensity: ', cheerful: 'Happily: ',
}

app.post('/api/ai/voice-over', async (req, res) => {
    try {
        const { text, config } = req.body
        if (!text) return res.status(400).json({ error: 'Text required' })

        const voicePreset = config?.voicePreset || 'narrator'
        const emotion = config?.emotion || 'neutral'
        const speed = config?.speed || 1.0
        const stability = config?.stability || 0.5
        const similarityBoost = config?.similarityBoost || 0.75

        const styledText = (EMOTION_STYLE[emotion] || '') + text

        // Try ElevenLabs first
        const elevenKey = process.env.ELEVENLABS_API_KEY
        if (elevenKey) {
            try {
                const voiceId = ELEVENLABS_VOICE_MAP[voicePreset] || ELEVENLABS_VOICE_MAP['narrator']
                const elRes = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
                    method: 'POST',
                    headers: {
                        'xi-api-key': elevenKey,
                        'Content-Type': 'application/json',
                        'Accept': 'audio/mpeg',
                    },
                    body: JSON.stringify({
                        text: styledText,
                        model_id: 'eleven_multilingual_v2',
                        voice_settings: {
                            stability,
                            similarity_boost: similarityBoost,
                            style: emotion === 'dramatic' ? 0.7 : emotion === 'excited' ? 0.6 : 0.3,
                            use_speaker_boost: true,
                        },
                    }),
                })

                if (elRes.ok) {
                    const audioBuffer = Buffer.from(await elRes.arrayBuffer())
                    res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': audioBuffer.length.toString() })
                    return res.send(audioBuffer)
                }
                console.warn('ElevenLabs failed, falling back to OpenAI TTS:', elRes.status)
            } catch (err) {
                console.warn('ElevenLabs error, falling back:', err)
            }
        }

        // Fallback: OpenAI TTS
        const openaiKey = process.env.OPENAI_API_KEY
        if (!openaiKey) {
            return res.status(503).json({ error: 'No TTS provider configured (need ELEVENLABS_API_KEY or OPENAI_API_KEY)' })
        }

        const voice = OPENAI_VOICE_MAP[voicePreset] || 'onyx'
        const oaiRes = await fetch('https://api.openai.com/v1/audio/speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
            body: JSON.stringify({
                model: 'tts-1-hd',
                input: styledText,
                voice,
                speed: Math.max(0.25, Math.min(4.0, speed)),
                response_format: 'mp3',
            }),
        })

        if (!oaiRes.ok) {
            const errText = await oaiRes.text()
            return res.status(500).json({ error: `OpenAI TTS failed: ${errText}` })
        }

        const audioBuffer = Buffer.from(await oaiRes.arrayBuffer())
        res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': audioBuffer.length.toString() })
        res.send(audioBuffer)
    } catch (err: any) {
        console.error('Voice-over error:', err)
        res.status(500).json({ error: err.message || 'Voice-over generation failed' })
    }
})

// ════════════════════════════════
//  TEXT-TO-3D (Self-Contained)
// ════════════════════════════════

const TEXT_TO_3D_SYSTEM_PROMPT = `You are a 3D scene composer for a browser-based 3D engine.
Given a text description, output a JSON scene graph that can be procedurally generated using primitive shapes.

Available shapes: box, sphere, cylinder, cone, torus, plane, capsule, ring, dodecahedron, octahedron, icosahedron, tetrahedron

Rules:
- Compose complex objects from multiple primitives (e.g., a table = 1 box top + 4 cylinder legs)
- Use realistic proportions (units are meters)
- Position children relative to parent center
- Colors should be realistic hex values
- metalness 0.0 = matte/wood/plastic, 1.0 = pure metal
- roughness 0.0 = mirror/glass, 1.0 = rough stone
- Keep object count reasonable (max ~20 primitives)
- Rotation is in degrees

Output ONLY valid JSON matching this schema, no explanation:
{
  "description": "brief description",
  "objects": [
    {
      "name": "part name",
      "shape": "box",
      "size": {"x": 1, "y": 0.1, "z": 0.6},
      "position": {"x": 0, "y": 0.75, "z": 0},
      "rotation": {"x": 0, "y": 0, "z": 0},
      "material": {
        "color": "#8B4513",
        "metalness": 0.0,
        "roughness": 0.8
      },
      "children": []
    }
  ]
}`

app.post('/api/ai/text-to-3d', async (req, res) => {
    try {
        const { description } = req.body
        if (!description || typeof description !== 'string') {
            return res.status(400).json({ error: 'Description required (max 1000 chars)' })
        }
        const prompt = description.slice(0, 1000)

        const openaiKey = process.env.OPENAI_API_KEY
        if (!openaiKey) {
            return res.status(503).json({ error: 'OpenAI API key not configured. Use local mode instead.' })
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${openaiKey}` },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: TEXT_TO_3D_SYSTEM_PROMPT },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 2000,
                temperature: 0.3,
                response_format: { type: 'json_object' },
            }),
        })

        const data: any = await response.json()
        const content = data.choices?.[0]?.message?.content
        if (!content) {
            return res.status(500).json({ error: 'No response from AI' })
        }

        const sceneGraph = JSON.parse(content)
        res.json({ sceneGraph })
    } catch (err: any) {
        console.error('Text-to-3D error:', err)
        res.status(500).json({ error: err.message || 'Text-to-3D generation failed' })
    }
})

// ════════════════════════════════
//  LUME STUDIO — SITE PUBLISHING
// ════════════════════════════════

/**
 * Reserved subdomains — exact names that cannot be claimed.
 */
const RESERVED_SUBDOMAINS = new Set([
    // ── Active ecosystem apps ──
    'arbora', 'bomber', 'academy', 'studio',
    'signalchat', 'torque', 'verdara',

    // ── Ecosystem brand names ──
    'dwtl', 'signal', 'lume', 'lume-lang', 'lumelang',
    'chronicles', 'yourlegacy',
    'garagebot', 'happyeats',
    'orbitstaffing', 'getorby', 'orby',
    'paintpros', 'nashpaintpros', 'pulse',
    'strikeagent', 'thearcade', 'thevoid', 'intothevoid',
    'tldriverconnect', 'tradeworksai',
    'brewandboard', 'vedasolus',
    'livfi', 'livfi-initiative',

    // ── Infrastructure ──
    'www', 'app', 'api', 'admin', 'mail', 'ftp', 'smtp', 'imap',
    'ns1', 'ns2', 'dns', 'cdn', 'static', 'assets', 'media',
    'staging', 'dev', 'test', 'preview', 'demo',
    'auth', 'sso', 'login', 'signup', 'register',
    'dashboard', 'panel', 'console', 'portal',
    'blog', 'docs', 'help', 'support', 'status',
    'shop', 'store', 'billing', 'pay', 'checkout',
    'sites',
])

/**
 * Reserved prefixes — ANY subdomain starting with these is blocked.
 * This catches all "trust*" (trustgen, trusthome, trustgolf, trustvault...)
 * and all "darkwave*" (darkwavestudios, darkwavepulse...)
 * and all "guardian*" (guardianscanner, guardianscreener, guardianshield...)
 * without needing to list each one individually.
 */
const RESERVED_PREFIXES = ['trust', 'darkwave', 'guardian']

/** Check if a subdomain is reserved (exact match OR prefix match) */
function isSubdomainReserved(sub: string): boolean {
    if (RESERVED_SUBDOMAINS.has(sub)) return true
    return RESERVED_PREFIXES.some(prefix => sub.startsWith(prefix))
}

/** Check if a subdomain is available */
app.get('/api/studio-sites/check-subdomain/:subdomain', authMiddleware, async (req: any, res) => {
    try {
        const sub = req.params.subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '')

        if (sub.length < 3) return res.json({ available: false, reason: 'Too short (min 3 characters)' })
        if (sub.length > 32) return res.json({ available: false, reason: 'Too long (max 32 characters)' })
        if (isSubdomainReserved(sub)) return res.json({ available: false, reason: 'Reserved name' })

        const existing = await pool.query('SELECT id FROM studio_sites WHERE subdomain = $1', [sub])
        if (existing.rows.length > 0) return res.json({ available: false, reason: 'Already taken' })

        res.json({ available: true, subdomain: sub, url: `https://${sub}.tlid.io` })
    } catch (err) {
        console.error('Subdomain check error:', err)
        res.status(500).json({ error: 'Check failed' })
    }
})

/** Save or update a Studio site */
app.post('/api/studio-sites', authMiddleware, async (req: any, res) => {
    try {
        const { siteName, subdomain, pages, themeId, themeConfig } = req.body
        if (!siteName || !pages) return res.status(400).json({ error: 'Missing site data' })

        // Check for existing site by user
        const existing = await pool.query(
            'SELECT id FROM studio_sites WHERE user_id = $1 AND subdomain = $2',
            [req.userId, subdomain || null]
        )

        if (existing.rows.length > 0) {
            // Update existing
            const result = await pool.query(
                `UPDATE studio_sites SET
                    site_name = $1, pages = $2, theme_id = $3,
                    theme_config = $4, updated_at = NOW()
                 WHERE id = $5 RETURNING *`,
                [siteName, JSON.stringify(pages), themeId, JSON.stringify(themeConfig), existing.rows[0].id]
            )
            return res.json(result.rows[0])
        }

        // Create new
        const result = await pool.query(
            `INSERT INTO studio_sites (user_id, site_name, subdomain, pages, theme_id, theme_config)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [req.userId, siteName, subdomain || null, JSON.stringify(pages), themeId, JSON.stringify(themeConfig)]
        )
        res.json(result.rows[0])
    } catch (err: any) {
        if (err.code === '23505') return res.status(409).json({ error: 'Subdomain already taken' })
        console.error('Save site error:', err)
        res.status(500).json({ error: 'Failed to save site' })
    }
})

/** Publish a Studio site — make it live at subdomain.tlid.io */
app.post('/api/studio-sites/:id/publish', authMiddleware, async (req: any, res) => {
    try {
        const { subdomain } = req.body
        const sub = subdomain?.toLowerCase().replace(/[^a-z0-9-]/g, '')

        if (!sub || sub.length < 3) return res.status(400).json({ error: 'Invalid subdomain' })
        if (isSubdomainReserved(sub)) return res.status(400).json({ error: 'Reserved subdomain' })

        // Verify ownership
        const site = await pool.query(
            'SELECT id FROM studio_sites WHERE id = $1 AND user_id = $2',
            [req.params.id, req.userId]
        )
        if (site.rows.length === 0) return res.status(404).json({ error: 'Site not found' })

        // Check subdomain isn't taken by another user
        const conflict = await pool.query(
            'SELECT id, user_id FROM studio_sites WHERE subdomain = $1 AND id != $2',
            [sub, req.params.id]
        )
        if (conflict.rows.length > 0) return res.status(409).json({ error: 'Subdomain already taken' })

        // Publish
        const result = await pool.query(
            `UPDATE studio_sites SET
                subdomain = $1, is_published = true, published_at = NOW(), updated_at = NOW()
             WHERE id = $2 RETURNING *`,
            [sub, req.params.id]
        )

        res.json({
            ...result.rows[0],
            url: `https://${sub}.tlid.io`,
        })
    } catch (err: any) {
        if (err.code === '23505') return res.status(409).json({ error: 'Subdomain already taken' })
        console.error('Publish error:', err)
        res.status(500).json({ error: 'Failed to publish' })
    }
})

/** Unpublish a site */
app.post('/api/studio-sites/:id/unpublish', authMiddleware, async (req: any, res) => {
    try {
        await pool.query(
            `UPDATE studio_sites SET is_published = false, updated_at = NOW()
             WHERE id = $1 AND user_id = $2`,
            [req.params.id, req.userId]
        )
        res.json({ success: true })
    } catch (err) {
        res.status(500).json({ error: 'Failed to unpublish' })
    }
})

/** List user's Studio sites */
app.get('/api/studio-sites', authMiddleware, async (req: any, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM studio_sites WHERE user_id = $1 ORDER BY updated_at DESC',
            [req.userId]
        )
        res.json(result.rows.map((s: any) => ({
            id: s.id,
            siteName: s.site_name,
            subdomain: s.subdomain,
            customDomain: s.custom_domain,
            themeId: s.theme_id,
            pages: s.pages,
            themeConfig: s.theme_config,
            isPublished: s.is_published,
            publishedAt: s.published_at,
            url: s.is_published && s.subdomain ? `https://${s.subdomain}.tlid.io` : null,
            createdAt: s.created_at,
            updatedAt: s.updated_at,
        })))
    } catch (err) {
        res.status(500).json({ error: 'Failed to list sites' })
    }
})

/** Delete a Studio site */
app.delete('/api/studio-sites/:id', authMiddleware, async (req: any, res) => {
    try {
        await pool.query('DELETE FROM studio_sites WHERE id = $1 AND user_id = $2', [req.params.id, req.userId])
        res.status(204).end()
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete site' })
    }
})

/**
 * Serve a published site by subdomain.
 * In production, this is hit by the *.tlid.io wildcard.
 * Reads the subdomain from the Host header and serves the matching site.
 */
app.get('/api/studio-sites/serve/:subdomain', async (req, res) => {
    try {
        const sub = req.params.subdomain.toLowerCase()
        const result = await pool.query(
            'SELECT * FROM studio_sites WHERE subdomain = $1 AND is_published = true',
            [sub]
        )
        if (result.rows.length === 0) {
            return res.status(404).send(`<html><body style="background:#0a0a0f;color:#fff;font-family:Inter,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh"><div style="text-align:center"><h1>Site Not Found</h1><p style="color:#888">This subdomain is not active on tlid.io</p><a href="https://trustgen.tlid.io/studio" style="color:#06b6d4">Build your own →</a></div></body></html>`)
        }

        const site = result.rows[0]
        const pages = typeof site.pages === 'string' ? JSON.parse(site.pages) : site.pages
        const theme = typeof site.theme_config === 'string' ? JSON.parse(site.theme_config) : (site.theme_config || {})
        const homePage = pages.find((p: any) => p.slug === '/') || pages[0]

        if (!homePage) return res.status(404).send('No pages')

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${site.site_name}</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --primary: ${theme.colors?.primary || '#06b6d4'};
  --secondary: ${theme.colors?.secondary || '#14b8a6'};
  --accent: ${theme.colors?.accent || '#22d3ee'};
  --bg: ${theme.colors?.background || '#0a0a0f'};
  --surface: ${theme.colors?.surface || '#141420'};
  --text: ${theme.colors?.text || '#eaeaf2'};
  --text-secondary: ${theme.colors?.textSecondary || '#8888a8'};
  --font-heading: ${theme.fontHeading || "'Inter', sans-serif"};
  --font-body: ${theme.fontBody || "'Inter', sans-serif"};
  --radius: ${theme.borderRadius || '12px'};
}
body { background: var(--bg); color: var(--text); font-family: var(--font-body); line-height: 1.6; -webkit-font-smoothing: antialiased; }
h1,h2,h3,h4,h5,h6 { font-family: var(--font-heading); line-height: 1.2; }
img { max-width: 100%; height: auto; }
a { color: var(--primary); text-decoration: none; }
a:hover { text-decoration: underline; }
${homePage.css || ''}
</style>
</head>
<body>
${homePage.html || ''}
</body>
</html>`

        res.type('html').send(html)
    } catch (err) {
        console.error('Serve site error:', err)
        res.status(500).send('Server error')
    }
})

/** Get list of reserved subdomains (public, for client validation) */
app.get('/api/studio-sites/reserved', (_req, res) => {
    res.json({ reserved: Array.from(RESERVED_SUBDOMAINS) })
})

// ════════════════════════════════
//  PRODUCTION FRONTEND SERVER
// ════════════════════════════════
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Render sometimes manipulates Node's CWD or executes hooks differently.
// Let's aggressively scan for the compiled Vite directory.
const distPaths = [
    path.join(__dirname, '../dist'),       // __dirname is server/, dist is parent
    path.join(Math.abs(process.cwd().indexOf('server')) !== -1 ? path.join(process.cwd(), '../dist') : path.join(process.cwd(), 'dist')),
    path.join(__dirname, 'dist'),
    path.join(process.cwd(), 'dist')
]

const validDist = distPaths.find(p => fs.existsSync(p))

if (validDist) {
    console.log(`✅ Express mounting static frontend at: ${validDist}`)
    app.use(express.static(validDist))
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
            return res.status(404).json({ error: 'API route not found' })
        }
        res.sendFile(path.join(validDist, 'index.html'))
    })
} else {
    console.error(`❌ Vite 'dist' folder totally absent. Frontend build skipped?`)
    app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route missing' })
        res.status(500).send(`
            <h2>TrustGen Frontend Missing</h2>
            <p>The React UI failed to compile during the Render deployment.</p>
            <p><strong>CWD:</strong> ${process.cwd()}</p>
            <p><strong>__dirname:</strong> ${__dirname}</p>
            <p><strong>Checked Paths:</strong><br>${distPaths.join('<br>')}</p>
        `)
    })
}

// ════════════════════════════════
//  BETA USER SEEDING
// ════════════════════════════════
async function seedBetaUsers() {
    const betaUsers = [
        { email: 'david_2071@yahoo.com', name: 'David Painton', tier: 'enterprise' },
        { email: 'coopertue@gmail.com', name: 'Cooper Tue', tier: 'enterprise' },
    ]

    // Add must_change_password column if it doesn't exist
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT false`)

    for (const beta of betaUsers) {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [beta.email])
        if (existing.rows.length > 0) {
            // Ensure they have enterprise tier and Temp12345! password even if already registered
            const hash = await bcrypt.hash('Temp12345!', 12)
            await pool.query('UPDATE users SET subscription_tier = $1, password_hash = $2, must_change_password = true WHERE email = $3', [beta.tier, hash, beta.email])
            console.log(`  ✓ Beta user ${beta.name} (${beta.email}) already exists — tier set to ${beta.tier}, password reset to Temp12345!`)
            continue
        }

        const slug = beta.email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()
        const tenant = await pool.query(
            'INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id',
            [beta.name + "'s Workspace", slug + '-' + Date.now().toString(36)]
        )
        const tenantId = tenant.rows[0].id

        const hash = await bcrypt.hash('Temp12345!', 12)
        await pool.query(
            'INSERT INTO users (email, password_hash, name, tenant_id, subscription_tier, must_change_password) VALUES ($1, $2, $3, $4, $5, true) RETURNING id',
            [beta.email, hash, beta.name, tenantId, beta.tier]
        )
        console.log(`  ✓ Beta user seeded: ${beta.name} (${beta.email}) — tier: ${beta.tier}, must change password on first login`)
    }
}

// ════════════════════════════════
//  BOOT
// ════════════════════════════════

async function boot() {
    try {
        await initDB()
        await initBlogTable()
        await seedBetaUsers()
    } catch (err) {
        console.error('❌ Database initialization failed:', err)
        process.exit(1)
    }

    const port = Number(process.env.PORT) || 4000
    console.log(`Attempting to start on port ${port}...`)

    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 TrustGen server running on 0.0.0.0:${port}`)
    })

    server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
            console.error(`❌ Port ${port} in use. Retrying in 3s...`)
            setTimeout(() => {
                server.close()
                server.listen(port, '0.0.0.0')
            }, 3000)
        } else {
            console.error('❌ Server error:', err)
            process.exit(1)
        }
    })

    // Graceful shutdown — release port on exit
    const shutdown = () => {
        console.log('Shutting down...')
        server.close(() => process.exit(0))
        setTimeout(() => process.exit(1), 5000)
    }
    process.on('SIGTERM', shutdown)
    process.on('SIGINT', shutdown)
}

boot().catch(err => {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
})
