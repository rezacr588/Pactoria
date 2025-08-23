# Pactoria Web (Next.js 14)

Minimal boilerplate wired with:
- supabase-js (RLS-aware client)
- TipTap + Yjs (collaboration) with y-webrtc provider
- Snapshot via Postgres RPC `public.take_snapshot`
- TailwindCSS
- TanStack Query

## Getting Started

1) Copy env
```
cp .env.example .env.local
```
Fill `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

2) Install deps
```
npm install
```

3) Run dev server
```
npm run dev
```

Open http://localhost:3000 and enter a contract UUID to open the editor.

## Notes
- The editor uses TipTap + Yjs. Peers connect over WebRTC using the public signaling server `wss://signaling.yjs.dev`.
- "Save Snapshot" calls `supabase.rpc('take_snapshot', { p_contract_id, p_content_json, p_content_md, p_ydoc_state_base64 })`.
- RLS: The RPC checks `public.has_contract_access(auth.uid(), p_contract_id)`. You must be authenticated and have access, otherwise the RPC will error. This app does not include auth UI yet.
- The y-webrtc provider is dynamically imported to avoid SSR bundling issues in Next.js.

## File Map
- `app/page.tsx` – homepage with a contract ID input
- `app/contracts/[id]/page.tsx` – editor page
- `components/editor/ContractEditor.tsx` – TipTap + Yjs editor and snapshot button
- `lib/supabaseClient.ts` – Supabase client
- `app/layout.tsx` – root layout with QueryProvider

## Testing

### E2E Testing

This project includes comprehensive end-to-end tests using Playwright.

#### Quick Start
```bash
# Install Playwright browsers
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run tests in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npm run test:e2e tests/e2e/smoke.spec.ts

# View test report
npm run test:e2e:report
```

#### Test Coverage
- ✅ Authentication (login, signup, session management)
- ✅ Contract management (CRUD, navigation, permissions)
- ✅ Collaborative editor (TipTap, real-time sync, WebRTC)
- 🚧 Snapshot and versioning
- 🚧 Approval workflows
- 🚧 Analytics dashboard

For detailed E2E testing documentation, see [tests/e2e/README.md](tests/e2e/README.md).

## Related Docs
See `MVP_IMPLEMENTATION_PLAN.md` → "7.1.1 UI Component Design", "7.1.2 Design System & CSS", and "7.5 Architecture Diagram".
