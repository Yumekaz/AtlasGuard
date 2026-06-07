# AtlasGuard

Tourist safety and incident response platform — monorepo with NestJS API, Next.js web app, and shared TypeScript packages.

## Prerequisites

- Node.js 20+
- npm 10+
- Docker Desktop (for Redis on Windows)

## Quick Start

```bash
# Install dependencies
npm install

# Start Redis (port 6380 — avoids conflict with legacy Redis on 6379)
npm run infra:up

# Build all packages
npm run build:all

# Terminal 1 — API (port 3001)
cd apps/api
npx prisma migrate deploy
npx prisma db seed
npm run dev

# Terminal 2 — Web (port 3000)
cd apps/web
npm run dev
```

Open http://localhost:3000 and log in with a demo account below.

## Demo Accounts

All demo accounts use password: `password123`

| Role      | Email               |
|-----------|---------------------|
| Tourist   | tourist@demo.com    |
| Operator  | operator@demo.com   |
| Responder | responder@demo.com|
| Admin     | admin@demo.com      |

Seed or reset demo data:

```bash
curl -X POST http://127.0.0.1:3001/admin/seed \
  -H "Authorization: Bearer <admin-token>"
```

Prepare a polished demo scenario (clears open incidents, sets medical notes, returns playbook):

```bash
curl -X POST http://127.0.0.1:3001/admin/simulate-demo \
  -H "Authorization: Bearer <admin-token>"
```

## Infrastructure

```bash
npm run infra:up      # Start Redis via Docker Compose
npm run infra:down    # Stop containers
npm run infra:logs    # Tail Redis logs
```

Redis is exposed on **port 6380** (mapped from container 6379) because Windows often has Redis 3.0 bound to 6379.

Set `REDIS_URL=redis://127.0.0.1:6380` in `apps/api/.env` if needed.

## Project Structure

```
apps/
  api/     NestJS REST + WebSocket API
  web/     Next.js operator/tourist/responder/admin dashboards
packages/
  shared/  Shared types, risk scoring logic, demo locations
tests/
  e2e/     Playwright API E2E tests
data/
  risk-zones.geojson
docs/
  demo-script.md
  demo-video-script.md
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build:all` | Build shared, API, and web |
| `npm run dev:api` | API watch mode |
| `npm run dev:web` | Next.js dev server |
| `npm run test -w @atlasguard/shared` | Unit tests (risk scoring) |

## E2E Tests

With API running on port 3001:

```bash
cd tests/e2e
npm install
npx playwright test src/phase6-risk-analytics.spec.ts
```

## Phase 6 Features

- **Risk scoring** at SOS trigger (geofence zone, night hours, medical profile, responder distance, nearby incidents)
- **Dashboard analytics** at `GET /ops/dashboard/summary`
- **Risk explanation panel** on operator, tourist, and responder UIs
- **Demo scenario** endpoint at `POST /admin/simulate-demo`

See `docs/demo-script.md` for the 5-minute walkthrough.