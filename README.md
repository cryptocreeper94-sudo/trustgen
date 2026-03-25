# TrustGen 3D Engine

**TrustGen** is a browser-based, procedural 3D generation and cinematic platform deployed as part of the Trust Layer ecosystem.

Replacing pure API-dependent generation (formerly Meshy.ai), TrustGen features a completely self-contained procedural node-based generation engine capable of assembling complex immersive environments dynamically entirely on the client. 

## Core Capabilities
- **Procedural Composer Engine**: Combines 3D primitives (Box, Sphere, Cone, Plane, Torus) into complex `THREE.Group` nested structures via `PropRecipe` blueprints for 87+ bespoke architectural and prop assets.
- **Inverse Kinematics (IK) Animation**: Integrated character animation suite (note: currently awaiting rigging compatibility for procedurally composed multi-mesh entities).
- **Lume Studio Integration**: A built-in no-code IDE generating interactive sites published directly to `.tlid.io` subdomains.
- **Ecosystem Sync**: Seamless integration with TrustVault (`dwtl.io`) via HMAC-SHA256 identity exchange supporting Single Sign-On (SSO) and biometric Passkey authentication.

## Tech Stack
- Frontend: **React + Vite**, **React Three Fiber (R3F)**, **GSAP** for UI/cinematics, **Zustand** + **Immer** for state management.
- Backend: **Node + Express** integrated natively via Vite middleware.
- Database: **PostgreSQL** via `pg` (supporting multi-tenant configurations).

## Getting Started

1. Copy `.env.example` to `.env` and configure your local connections:
   ```bash
   cp server/.env.example server/.env
   ```

2. Start the server and client concurrently:
   ```bash
   npm run dev
   ```

### Security Priorities
The server operates a strict environment guard in `production`. **TrustGen will refuse to boot if `JWT_SECRET` is not provided.** Do not rely on dev default secrets.

For SSO failures, TrustGen is designed to automatically degrade to local credentials, communicating a 503 HTTP `Service Temporarily Unavailable` if `dwtl.io` times out.
