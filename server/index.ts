/* ====== TrustGen — Express Backend Server ====== */
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Pool } from 'pg'

// ── Environment ──
const PORT = process.env.PORT || 4000
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
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

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
    `)
    console.log('✅ Database tables initialized')
}

// ── App ──
const app = express()
app.use(helmet())
app.use(cors({ origin: CLIENT_URL, credentials: true }))
app.use(express.json())

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
    }
}

// ════════════════════════════════
//  AUTH ROUTES
// ════════════════════════════════
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, name } = req.body
        if (!email || !password || !name) return res.status(400).json({ error: 'Missing fields' })

        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email])
        if (existing.rows.length > 0) return res.status(409).json({ error: 'Email already registered' })

        // Create tenant for user
        const slug = email.split('@')[0].replace(/[^a-z0-9]/gi, '-').toLowerCase()
        const tenant = await pool.query(
            'INSERT INTO tenants (name, slug) VALUES ($1, $2) RETURNING id',
            [name + "'s Workspace", slug + '-' + Date.now().toString(36)]
        )
        const tenantId = tenant.rows[0].id

        const hash = await bcrypt.hash(password, 12)
        const user = await pool.query(
            'INSERT INTO users (email, password_hash, name, tenant_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [email, hash, name, tenantId]
        )

        const token = makeToken(user.rows[0].id, tenantId)

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

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
        if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' })

        const user = result.rows[0]
        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

        const token = makeToken(user.id, user.tenant_id)
        res.json({ token, user: userResponse(user) })
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
//  BOOT
// ════════════════════════════════
async function boot() {
    await initDB()
    const port = Number(process.env.PORT) || 4000
    app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 TrustGen server running on port ${port}`)
    })
}

boot().catch(err => {
    console.error('❌ Failed to start server:', err)
    process.exit(1)
})

