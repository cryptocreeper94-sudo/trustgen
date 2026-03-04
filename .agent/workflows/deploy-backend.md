---
description: How to deploy the TrustGen Express backend to Railway or Render
---
// turbo-all

# Deploy TrustGen Backend

## Option A: Railway (Recommended)

### First-Time Setup
1. Login to Railway:
```bash
cd d:\trustgen-3d\server
npx -y @railway/cli login
```
2. Create project + Postgres:
```bash
npx -y @railway/cli init
npx -y @railway/cli add --plugin postgresql
```
3. Set environment variables:
```bash
npx -y @railway/cli variables set JWT_SECRET="your-secret"
npx -y @railway/cli variables set RESEND_API_KEY="re_xxxx"
npx -y @railway/cli variables set TWILIO_ACCOUNT_SID="ACxxxx"
npx -y @railway/cli variables set TWILIO_AUTH_TOKEN="xxxx"
npx -y @railway/cli variables set TWILIO_PHONE_NUMBER="+15551234567"
npx -y @railway/cli variables set STRIPE_SECRET_KEY="sk_test_xxxx"
npx -y @railway/cli variables set STRIPE_WEBHOOK_SECRET="whsec_xxxx"
npx -y @railway/cli variables set TRUSTLAYER_API_KEY="your-key"
npx -y @railway/cli variables set TRUSTLAYER_API_SECRET="your-secret"
npx -y @railway/cli variables set TRUSTLAYER_BASE_URL="https://dwtl.io"
npx -y @railway/cli variables set CLIENT_URL="https://trustgen.tlid.io"
```
> Note: DATABASE_URL is auto-set when you add the PostgreSQL plugin.

4. Deploy:
```bash
npx -y @railway/cli up
```

### Subsequent Deploys
```bash
cd d:\trustgen-3d\server
npx -y @railway/cli up
```

### Get Public URL
After first deploy, generate a public domain:
```bash
npx -y @railway/cli domain
```
This gives you something like `trustgen-server-production.up.railway.app`. Use this as `VITE_API_URL` in Vercel.

---

## Option B: Render

1. Go to [render.com](https://render.com) → New Web Service
2. Connect your GitHub repo or upload the `server/` directory
3. Set:
   - **Build Command**: `npm install && npx tsc`
   - **Start Command**: `node dist/index.js`
   - **Environment**: Node
4. Add all env vars from `.env.example` in the Render dashboard
5. Add a PostgreSQL database from Render and copy the connection string to `DATABASE_URL`

---

## After Backend is Live

Update Vercel frontend:
```bash
cd d:\trustgen-3d
npx -y vercel env add VITE_API_URL production
# Paste: https://your-backend-url.railway.app
npx -y vercel --prod --yes
```
