# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

# Pactoria Contract Management Platform

A real-time collaborative contract management system built with Next.js, Supabase, and TipTap editor. Features include collaborative editing via WebRTC, AI-powered contract analysis, version control, and approval workflows.

## Table of Contents
- [Quick Start Commands](#quick-start-commands)
- [Docker-Based Development](#docker-based-development)
- [Architecture Overview](#architecture-overview)
- [Development Workflows](#development-workflows)
- [Testing](#testing)
- [CI/CD Pipeline](#cicd-pipeline)
- [Important Notes & Gotchas](#important-notes--gotchas)
- [Quick Reference](#quick-reference)
- [Key Files & Documentation](#key-files--documentation)
- [Windsurf Guidance](#windsurf-guidance)

## Quick Start Commands

### Initial Setup
```bash
# Navigate to web app directory
cd apps/web

# Copy environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY

# Install dependencies
npm install

# Install Playwright browsers for E2E testing
npx playwright install
```

### Development
```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Start Supabase locally (required for database/auth)
supabase start

# Check Supabase status
supabase status
```

### Building & Production
```bash
# Build production bundle
npm run build

# Start production server
npm run start

# Type checking
npm run type-check

# Linting
npm run lint
```

## Docker-Based Development

This project is fully containerized using Docker Compose for a consistent development environment.

### Services
- `postgres`: PostgreSQL database.
- `studio`: Supabase Studio UI.
- `kong`: API Gateway.
- `auth`: Supabase GoTrue for authentication.
- `realtime`: Supabase Realtime for WebSocket communication.
- `storage`: Supabase Storage for file management.
- `rest`: PostgREST for auto-generated REST API.
- `web`: The Next.js web application.
- `functions`: Supabase Edge Functions (Deno runtime).

### Commands
```bash
# Start all services in the background
docker-compose up -d

# Stop all services
docker-compose down

# View logs for all services
docker-compose logs -f

# View logs for a specific service (e.g., web)
docker-compose logs -f web
```

## Architecture Overview

### Frontend Stack
- **Framework**: Next.js 14 with App Router
- **Editor**: TipTap with collaborative extensions
- **Real-time Collaboration**: Yjs CRDTs + y-webrtc provider (P2P WebRTC)
- **State Management**: TanStack Query (server state) + Zustand (UI state)
- **UI Components**: Tailwind CSS + shadcn/ui + Tremor (analytics)
- **Forms**: react-hook-form + Zod validation

### Backend Stack
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **API**: PostgREST (auto-generated from schema)
- **Edge Functions**: Deno runtime with Hono router
- **Real-time**: Supabase Realtime for presence/subscriptions
- **AI Integration**: Groq API (OpenAI-compatible) for contract analysis
- **Authentication**: Supabase Auth (email/password)

## Development Workflows

### Database Schema Changes
1. Create migration: `supabase migration new feature_name`
2. Write SQL in `supabase/migrations/[timestamp]_feature_name.sql`
3. Test locally: `supabase db push`
4. Update RLS policies if needed.
5. Regenerate types: `supabase gen types typescript --local > types/supabase.ts`

### Working with AI Features
- **Edge Function**: `supabase/functions/ai/index.ts`
- **Configuration**: Set `GROQ_API_KEY` via `supabase secrets set`

## Testing

### E2E Testing
- **Framework**: Playwright
- **Configuration**: `apps/web/playwright.config.ts`
- **Test Directory**: `apps/web/tests/e2e/`

### Test Commands
```bash
# Setup test database using the script
./scripts/setup-test-db.sh

# Run all E2E tests
npm run test:e2e

# Interactive UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Run smoke tests
npm run test:e2e:smoke

# View test report
npm run test:e2e:report
```

## CI/CD Pipeline

The CI/CD pipeline is defined in `.github/workflows/ci-cd.yml` and runs on pushes/PRs to `main` and `develop`.

### Stages
1.  **Code Quality**: Runs linting and type checking.
2.  **Security Scan**: Uses Trivy to scan for vulnerabilities.
3.  **Unit Tests**: Runs unit tests (if any).
4.  **E2E Tests**: Runs Playwright tests across Chromium, Firefox, and Webkit.
5.  **Build**: Builds a Docker image of the web app.
6.  **Deploy to Staging**: Deploys to Vercel on pushes to `develop`.
7.  **Deploy to Production**: Deploys to Vercel on pushes to `main`.

## Important Notes & Gotchas

- **RLS**: All database access goes through RLS. Never use the `service_role` key on the client.
- **y-webrtc**: The default y-webrtc provider uses a public signaling server. For production, consider self-hosting.
- **SSR errors with y-webrtc**: The y-webrtc provider is dynamically imported with `ssr: false` to avoid issues.

## Quick Reference

### Supabase
```bash
# Start local Supabase
supabase start

# Stop local Supabase
supabase stop

# Reset database to migrations
supabase db reset

# View logs for an Edge Function
supabase functions logs ai --tail
```

### Database
```bash
# Connect to local database
psql postgresql://postgres:postgres@localhost:54322/postgres

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

## Key Files & Documentation

- `MVP_IMPLEMENTATION_PLAN.md`: Detailed technical specifications.
- `BUSINESS_PLAN.md`: Business context and requirements.
- `apps/web/README.md`: Frontend-specific notes.
- `apps/web/tests/e2e/README.md`: E2E testing guide.
- `apps/web/components/editor/ContractEditor.tsx`: Main editor component.
- `supabase/migrations/`: Database schema definitions.
- `supabase/functions/ai/index.ts`: AI integration endpoints.
- `.github/workflows/ci-cd.yml`: CI/CD pipeline definition.
- `docker-compose.yml`: Docker services definition.

## Windsurf Guidance

As per the rule in `.windsurf/rules/implementation.md`, always check the `MVP_IMPLEMENTATION_PLAN.md` and `BUSINESS_PLAN.md` after completing a feature to ensure alignment with the project's goals.
