# Pactoria – MVP Implementation Plan (Aligned with BUSINESS_PLAN.md)

This plan translates the architecture and decisions in `BUSINESS_PLAN.md` into a concrete, step-by-step implementation guide. It targets a free-tier MVP with a clean FE/BE separation:

- Frontend: Next.js 14 + React 18 + TypeScript + Tailwind + shadcn/ui + Tremor + TanStack Query + Zustand
- Backend: Supabase (Auth, Postgres, Storage, Realtime) + Supabase Edge Functions (Deno) with Hono router
- AI: Groq (default), optional OpenAI/Anthropic
- Collab (MVP): Yjs + y-webrtc (P2P); optional self-hosted Hocuspocus; Liveblocks post-MVP

Focus: working product with clear instructions. All steps match the tech choices and free constraints in the plan.

---

## 0) Prerequisites

- Supabase account and project (Free tier)
- Node.js 20+, pnpm or npm, GitHub account
- Vercel or Netlify account (Free tier)
- Groq API Key (Developer/free tier)
- (Optional) Hocuspocus server hosting (free-tier provider) if you choose Option B

---

## 1) Repository Structure (Monorepo-friendly, but minimal is fine)

```text
pactoria/
  apps/
    web/                     # Next.js 14 App Router frontend
  supabase/
    functions/
      ai/                    # Edge Function: AI endpoints (generate/analyze)
        index.ts
      contracts/             # CRUD + snapshots + approvals
        index.ts
      collab-token/          # Mint ephemeral tokens for Hocuspocus/Liveblocks (post-MVP)
        index.ts
    migrations/              # SQL migrations (optional if using Supabase UI)
  README.md
  MVP_IMPLEMENTATION_PLAN.md
  BUSINESS_PLAN.md
```

---

## 2) Supabase Setup

1. Create a new Supabase project (Free tier).
2. In Project Settings → API, note the `Project URL` and `anon` key. Do NOT expose the service_role key to clients.
3. In Project Settings → Auth: enable email/password sign-in (MVP), and configure URL for magic links if needed.
4. Create a bucket `contracts` in Storage for file exports (PDF/DOCX). Public read can be off (serve via signed URLs).
5. Realtime: enabled by default.

---

## 3) Database Schema (Aligned with Appendix I ERD)

Run in Supabase SQL Editor (or add to `supabase/migrations/0001_init.sql`). The schema mirrors the ERD in `BUSINESS_PLAN.md`.

```sql
-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- TABLE: contracts
create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  status text not null default 'draft', -- 'draft' | 'in_review' | 'approved' | 'rejected' | 'signed'
  latest_version_number int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_contracts_owner on public.contracts(owner_id);

-- TABLE: contract_versions
create table if not exists public.contract_versions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  version_number int not null,
  ydoc_state bytea,              -- optional CRDT state snapshot
  content_md text,               -- optional markdown/plain content
  content_json jsonb,            -- optional structured content (TipTap/ProseMirror)
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(contract_id, version_number)
);
create index if not exists idx_versions_contract on public.contract_versions(contract_id);

-- TABLE: contract_approvals
create table if not exists public.contract_approvals (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  version_id uuid not null references public.contract_versions(id) on delete cascade,
  approver_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending', -- 'pending' | 'approved' | 'rejected'
  comment text,
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists idx_approvals_contract on public.contract_approvals(contract_id);
create index if not exists idx_approvals_approver on public.contract_approvals(approver_id);

-- TABLE: collab_sessions (minimal, useful for auditing & sessions list)
create table if not exists public.collab_sessions (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references public.contracts(id) on delete cascade,
  provider text not null check (provider in ('y-webrtc','hocuspocus','liveblocks')),
  room_id text not null,
  participants jsonb not null default '[]'::jsonb, -- [{ user_id, name, role }]
  started_by uuid references auth.users(id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz
);
create index if not exists idx_collab_contract on public.collab_sessions(contract_id);

-- Updated timestamps trigger for contracts
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger trg_contracts_updated
before update on public.contracts
for each row execute function public.set_updated_at();
```

### RLS & Access Control (MVP)

Policies: owner or approver can read. Only the owner can update metadata; any authenticated user can create their own contracts; version snapshots can be inserted by any user with access to the contract.

```sql
-- Helper to check if a user can access a contract
create or replace function public.has_contract_access(u uuid, c uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (
    exists(select 1 from public.contracts x where x.id = c and x.owner_id = u)
    or exists(select 1 from public.contract_approvals a where a.contract_id = c and a.approver_id = u)
  );
$$;

alter table public.contracts enable row level security;
alter table public.contract_versions enable row level security;
alter table public.contract_approvals enable row level security;
alter table public.collab_sessions enable row level security;

-- contracts
create policy contracts_select on public.contracts
  for select using (public.has_contract_access(auth.uid(), id));
create policy contracts_insert on public.contracts
  for insert with check (owner_id = auth.uid());
create policy contracts_update on public.contracts
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy contracts_delete on public.contracts
  for delete using (owner_id = auth.uid());

-- contract_versions
create policy versions_select on public.contract_versions
  for select using (public.has_contract_access(auth.uid(), contract_id));
create policy versions_insert on public.contract_versions
  for insert with check (public.has_contract_access(auth.uid(), contract_id) and created_by = auth.uid());

-- contract_approvals
create policy approvals_select on public.contract_approvals
  for select using (public.has_contract_access(auth.uid(), contract_id));
create policy approvals_insert on public.contract_approvals
  for insert with check (public.has_contract_access(auth.uid(), contract_id));
create policy approvals_update on public.contract_approvals
  for update using (approver_id = auth.uid());

-- collab_sessions (read-only to participants; write via Edge Functions if needed)
create policy sessions_select on public.collab_sessions
  for select using (public.has_contract_access(auth.uid(), contract_id));
create policy sessions_insert on public.collab_sessions
  for insert with check (public.has_contract_access(auth.uid(), contract_id) and started_by = auth.uid());
```

---

## 4) Edge Functions (Deno + Hono)

Install the Supabase CLI locally, initialize functions, and scaffold Hono endpoints.

```bash
npm i -g supabase
supabase init
# Inside supabase/functions/* add code and deploy with:
# supabase functions deploy <name>
```

General pattern to create a Supabase client that both uses the service role (for RPC) and applies RLS for end user:

```ts
// deno-lint-ignore-file no-explicit-any
import { Hono } from 'jsr:@hono/hono';
import { cors } from 'jsr:@hono/cors';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const app = new Hono();
app.use('*', cors());

// Client with RLS enforced (uses anon key + user's Authorization header)
function makeRlsClient(req: Request) {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
}

// Admin client (bypasses RLS) for privileged operations
function makeAdminClient() {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

export { makeRlsClient, makeAdminClient };
export default app;
```

### 4.1 AI Function (`functions/ai/index.ts`)

Endpoints:

- `POST /ai/generate-template`: { prompt, templateId? } → Contract text/JSON
- `POST /ai/analyze-risks`: { text } → { score, flags, suggestions }

Key notes:

- Use Groq’s OpenAI-compatible API via `fetch` in Deno.
- Stream where possible (text/event-stream) for responsive UX.
- Configure `GROQ_API_KEY` via `supabase secrets set`.

Schemas:

```json
// POST /ai/generate-template
// Request
{
  "prompt": "Draft an NDA between ACME and contractor in the UK",
  "templateId": null
}

// Response (example)
{
  "result": "# Non-Disclosure Agreement...",
  "usedTemplateId": null
}

// POST /ai/analyze-risks
// Request
{ "text": "Full contract text..." }

// Response (example)
{
  "score": 0.2,
  "flags": ["liability_cap_missing"],
  "suggestions": ["Add confidentiality clause", "Specify governing law"]
}
```

### 4.2 Contracts Function (`functions/contracts/index.ts`)

Endpoints (examples):

- `GET /contracts` – list (owner or approver) using RLS
- `POST /contracts` – create
- `GET /contracts/:id` – detail (checks RLS)
- `PATCH /contracts/:id` – update title/status (owner only)
- `DELETE /contracts/:id` – delete (owner only)
- `GET /contracts/:id/versions` – list versions
- `POST /contracts/:id/versions/snapshot` – create new version (accepts `content_json`, `content_md`, optional `ydoc_state` base64)
- `POST /contracts/:id/approvals` – add approval requests
- `POST /approvals/:approvalId/decision` – approver approves/rejects

Notes:

- Prefer PostgREST via `supabase.from(...).select/insert`, given RLS; or create RPCs if needed.
- Snapshot logic can be done in function code (read current `latest_version_number`, insert next).

Schemas (if using Contracts Function):

```json
// GET /contracts
// Response
{ "items": [ { "id": "uuid", "title": "NDA", "owner_id": "uuid", "status": "draft", "latest_version_number": 1, "created_at": "iso", "updated_at": "iso" } ] }

// POST /contracts
// Request
{ "title": "NDA with ACME" }
// Response
{ "contract": { "id": "uuid", "title": "NDA with ACME", "owner_id": "uuid", "status": "draft", "latest_version_number": 0, "created_at": "iso", "updated_at": "iso" } }

// GET /contracts/:id
// Response
{ "contract": { /* same shape as above */ } }

// PATCH /contracts/:id
// Request (any subset)
{ "title": "New Title", "status": "in_review" }
// Response
{ "contract": { /* updated contract */ } }

// DELETE /contracts/:id
// Response
{ "ok": true }

// GET /contracts/:id/versions
// Response
{ "items": [ { "id": "uuid", "contract_id": "uuid", "version_number": 2, "ydoc_state": null, "content_md": null, "content_json": {"type":"doc"}, "created_by": "uuid", "created_at": "iso" } ] }

// POST /contracts/:id/versions/snapshot
// Request
{ "content_json": {"type":"doc","content":[]}, "content_md": null, "ydoc_state": null }
// Response (success)
{ "version": { /* inserted version row */ } }
// Response (partial update)
// HTTP 207 when version insert succeeded but latest_version_number failed to update
{ "error": "...", "version": { /* inserted version row */ } }

// POST /contracts/:id/approvals
// Request
{ "version_id": "uuid", "approver_ids": ["uuid1", "uuid2"] }
// Response
{ "approvals": [ { "id": "uuid", "contract_id": "uuid", "version_id": "uuid", "approver_id": "uuid", "status": "pending", "created_at": "iso" } ] }

// POST /approvals/:approvalId/decision
// Request
{ "status": "approved", "comment": "LGTM" }
// Response
{ "approval": { "id": "uuid", "status": "approved", "comment": "LGTM", "decided_at": "iso" } }

// POST /collab-token
// Request
{ "contractId": "uuid", "provider": "hocuspocus", "roomId": "room:uuid" }
// Response (Hocuspocus)
{ "token": "jwt" }
// Response (y-webrtc)
{ "ok": true }
```

RPC Snapshot (Fast-Track):

```ts
// Frontend using supabase-js (RLS enforced)
await supabase.rpc('take_snapshot', {
  p_contract_id: contractId,
  p_content_json: { type: 'doc', content: [] },
  p_content_md: null,
  // ydoc_state must be base64 when provided
  p_ydoc_state_base64: null,
})
```

PostgREST (HTTP) shape:

```json
{
  "p_contract_id": "<uuid>",
  "p_content_json": {"type":"doc","content":[]},
  "p_content_md": null,
  "p_ydoc_state_base64": null
}
```

### 4.3 Collab Token Function (`functions/collab-token/index.ts`)

- Input: `{ contractId, provider, roomId }`. Reads `Authorization` from request.
- Verifies access via RLS-backed read (e.g., `select * from contracts where id = :id`).
- For `provider = 'hocuspocus'`: mint short-lived JWT with HMAC `HOCUSPOCUS_JWT_SECRET` containing `roomId`, `contractId`, `userId`, `exp` (e.g., now + 10m).
- For `provider = 'liveblocks'` (post-MVP): sign server token per Liveblocks docs.
- For `provider = 'y-webrtc'`: return `{ ok: true }` (no token required); still keep page behind Supabase Auth.

Secrets:

- `GROQ_API_KEY`, `HOCUSPOCUS_JWT_SECRET`, `ALLOWED_ORIGINS`, optionally `LIVEBLOCKS_SECRET_KEY`.

Set:

```bash
# Required by functions using Supabase client
supabase secrets set SUPABASE_URL=... SUPABASE_ANON_KEY=... ALLOWED_ORIGINS=https://yourapp.com

# AI provider
supabase secrets set GROQ_API_KEY=...

# Collaboration (only if enabling Hocuspocus/Liveblocks)
supabase secrets set HOCUSPOCUS_JWT_SECRET=... LIVEBLOCKS_SECRET_KEY=...
```

### 4A) Fast-Track Variant (Lean MVP)

- __CRUD via RLS/PostgREST__: Call `@supabase/supabase-js` directly from the frontend for `contracts`, `contract_versions`, and `contract_approvals` (RLS enforced). No contracts Edge Function required.
- __Snapshots via SQL RPC__: Implement `public.take_snapshot(...)` to create a version atomically. Frontend calls `supabase.rpc('take_snapshot', {...})`. This avoids bespoke server code and is fast to ship.
- __AI via single Edge Function__: Keep `functions/ai` to centralize `GROQ_API_KEY` and enable streaming.
- __Collab default__: Yjs + y-webrtc (no token). Defer `collab-token` and Hocuspocus to optional path.
- __Note on latest_version_number__: Snapshot RPC computes the next `version_number` and returns the new row. If `contracts.latest_version_number` cannot be updated due to RLS (non-owner), derive current version via `max(version_number)` in the UI. Owner updates still advance the cached column.

This variant preserves FE/BE separation (Supabase as backend + one AI function) and ships significantly faster.

---

## 5) Collaboration Modes

- Option A (default, free): __Yjs + y-webrtc__
  - Room ID = `contract:{contractId}`
  - Gate access at page level via Supabase Auth.
  - Persistence: periodically call `POST /contracts/:id/versions/snapshot` to save `ydoc_state`/`content_json`.
  - Presence: Supabase Realtime channel `presence:contract:{id}` with presence state `{ userId, name, color }`.

- Option B (self-hosted, free): __Yjs + Hocuspocus__
  - Run Hocuspocus server on free-tier provider.
  - Use `onAuthenticate` to validate the HMAC JWT from `/collab-token` (room, user, exp).
  - Continue to use Supabase Realtime for presence/activity feeds.

- Post-MVP: __Liveblocks__ (managed CRDT/presence/history)
  - Use `/collab-token` to sign server token with `room` and permission set.

References: see `BUSINESS_PLAN.md` References for Hocuspocus auth and Supabase Edge Functions Auth.

---

## 6) Frontend (Next.js 14 App Router)

### 6.1 Packages

- `@supabase/supabase-js`, `@tanstack/react-query`, `zustand`, `zod`, `react-hook-form`, `@tremor/react`, `lucide-react`, `yjs`, `y-webrtc`, `@hocuspocus/provider` (optional), `@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-collaboration`, `@tiptap/extension-collaboration-cursor`, `class-variance-authority`, `tailwind-merge`, `tailwindcss`, `shadcn-ui` scaffolding

### 6.2 Pages & Routes

- `/login` – Supabase Auth UI (or custom form)
- `/contracts` – list, create
- `/contracts/[id]` – editor: TipTap + Yjs; presence avatars; version timeline; risk analysis panel; approvals panel
- `/analytics` – Tremor dashboard KPIs (cycle time, approvals, risk scores)
- `/settings` – profile/team basics (MVP minimal)

### 6.3 Core UI Components

- `ContractsTable` (shadcn table + TanStack Query)
- `ContractEditor` (TipTap with Yjs Collaboration + y-webrtc or Hocuspocus provider)
- `VersionTimeline` (list versions; diff links; restore snapshot button → calls snapshot endpoint)
- `ApprovalsPanel` (list approvers, statuses; approve/reject CTA for current user)
- `RiskPanel` (calls `/ai/analyze-risks` to render flags & score)
- `PresenceAvatars` (Supabase Realtime presence)
- `KPIWidgets` (Tremor cards)

### 6.4 Data Fetching & State

- TanStack Query keys: `['contracts']`, `['contract', id]`, `['versions', id]`, `['approvals', id]`
- Zustand for local UI state (editor mode, panels open)
- Zod schemas: `CreateContract`, `SnapshotPayload`, `ApprovalDecision`

### 6.5 Editor Integration (Yjs + TipTap)

- Use `@tiptap/extension-collaboration` with a shared Yjs `Doc`
- y-webrtc provider using room `contract:{id}`
- Cursor extension for presence (name/color)
- Snapshot button triggers `POST /contracts/:id/versions/snapshot`

---

## 7) Detailed Specifications (FE/BE/DB/AI)

### 7.1 Frontend (Next.js 14 App Router)

- __Architecture__
  - Next.js App Router, React 18, TypeScript.
  - State: TanStack Query for server data; Zustand for local UI.
  - UI: TailwindCSS + shadcn/ui; Tremor for analytics.
  - Editor: TipTap (`@tiptap/react`) + Yjs; provider `y-webrtc` (default).

- __Env Vars__
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
  - Optional: `NEXT_PUBLIC_COLLAB_PROVIDER` (default `y-webrtc`).

- __Auth__
  - Single browser Supabase client with `SessionContextProvider` or custom hook.
  - Protect `/contracts/*`; redirect unauthenticated to `/login`.

- __Data Access__
  - `@supabase/supabase-js` directly (RLS enforced).
  - CRUD via `from('contracts' | 'contract_versions' | 'contract_approvals')`.
  - Snapshot via `rpc('take_snapshot', { p_contract_id, p_content_json, p_content_md, p_ydoc_state_base64 })`.

- __Editor & Collaboration__
  - TipTap Collaboration bound to a Yjs `Doc`.
  - `y-webrtc` room: `contract:{id}`; no token.
  - Presence via Supabase Realtime channel `presence:contract:{id}`.
  - Autosave debounce 10–20s; manual “Save Snapshot” button.

- __Versioning & Approvals__
  - Timeline from `contract_versions` (desc); show author/time; diff links (post-MVP).
  - Approvals: create requests for a version; approvers update status.

- __Error Handling__
  - Error shape `{ error: string }`; toast + inline message.
  - Handle 401 by refreshing session or redirecting to `/login`.

- __Performance__
  - TanStack Query: `staleTime: 5000`, `retry: 1`.
  - Prefer server components for read-only pages; mutations in client components.

- __Testing__
  - Zod validation for payloads.
  - Playwright E2E: login → create contract → edit → snapshot → approval.

Example snapshot call:

```ts
await supabase.rpc('take_snapshot', {
  p_contract_id: contractId,
  p_content_json: editor.getJSON(),
  p_content_md: null,
  p_ydoc_state_base64: null,
})
```

#### 7.1.1 UI Component Design

- __ContractsTable__
  - Props: `data`, `isLoading`, `filters`, `onSelect(id)`, `onCreate()`
  - UX: sortable columns, empty-state CTA, skeleton rows, inline error banner

- __ContractEditor__
  - Props: `contractId`, `initialJson`, `initialYDocState`, `canEdit`, `onSnapshot()`
  - Events: `onChange(json)`, `onRiskAnalyze()`, `onSaveSnapshot()`
  - UX: TipTap toolbar, collab cursors, autosave indicator, conflict notice

- __VersionTimeline__
  - Props: `versions[]`, `onRestore(versionId)`, `onCompare(a,b)`
  - UX: reverse-chron list, badges per status, “Restore to new version” CTA

- __ApprovalsPanel__
  - Props: `approvers[]`, `myApproval?`, `onDecide(status, comment)`
  - UX: role-gated decision buttons, comment textarea, success/error toasts

- __RiskPanel__
  - Props: `text | versionId`, `loading`, `result`
  - UX: score chip, flags list, copy suggestions, supports streaming output

- __PresenceAvatars__
  - Props: `users[]`, `maxVisible`
  - UX: stacked avatars, tooltips, overflow “+N” badge

- __Layout/Header/Nav/Toasts__
  - Props: `session`, `currentRoute`
  - UX: global toasts, breadcrumbs, keyboard focus management

#### 7.1.2 Design System & CSS (Tailwind + shadcn/ui)

- __Tokens__ (Tailwind config): colors (primary/secondary/accent/muted/success/warn/danger), radii (sm=4, md=8, lg=12), spacing base=4px, typography (xs–3xl), shadows (sm/md/lg)
- __Theming__: dark mode via class strategy; semantic CSS vars for surface/text/brand
- __Components__: use shadcn/ui primitives: Button, Input, Textarea, Dialog, DropdownMenu, Badge, Tooltip, Skeleton, Toast, Tabs
- __Responsive__: sm=640, md=768, lg=1024, xl=1280; tables stack on mobile; side panels collapse to drawers
- __Accessibility__: visible focus states, ARIA for dialogs/menus, labelled form inputs
- __States & Motion__: skeletons for loading, empty-state CTAs, inline error banners; 150–200ms ease-out transitions; respect reduced-motion

### 7.2 Backend (Supabase Edge Functions)

- __Runtime__
  - Deno; Hono router (`jsr:@hono/hono`), CORS middleware.
  - Supabase client created with anon key + `Authorization` header from request for RLS.

- __CORS__
  - Development: allow all.
  - Production: restrict to `ALLOWED_ORIGINS`.

- __Auth & RLS Pattern__
  - `createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization } } })` inside each request handler.
  - Use `sb.auth.getUser()` to assert identity for create/update operations.

- __Endpoints__
  - AI (`functions/ai/index.ts`):
    - `POST /generate-template` → `{ result: string, usedTemplateId: string | null }`.
    - `POST /analyze-risks` → `{ score: number, flags: string[], suggestions: string[] }`.
    - Optional SSE streaming: `Content-Type: text/event-stream`, `data: { chunk }` lines, `event: end`.
  - Contracts (`functions/contracts/index.ts`) [optional in Fast-Track]: CRUD, versions, approvals (schemas documented above).
  - Collab Token (`functions/collab-token/index.ts`) [optional]: y-webrtc returns `{ ok: true }`; Hocuspocus returns `{ token, exp }`.

- __Error Schema__
  - 400 for validation, 401 for unauthenticated, 403 for forbidden, 404 for not found.
  - Body: `{ error: string }` (optionally include `code` and `details`).

- __Observability__
  - Add basic request logging with `console.log({ path, method, userId, status })`.
  - Consider `X-Request-ID` passthrough for tracing.

- __Security__
  - Never use service_role from client; keep only in server context if ever needed.
  - Validate inputs (lengths, enums) before DB calls.

### 7.3 Database (Postgres via Supabase)

- __Tables__
  - `contracts(id, owner_id, title, status, latest_version_number, created_at, updated_at)`.
  - `contract_versions(id, contract_id, version_number, ydoc_state bytea, content_md, content_json, created_by, created_at)`.
  - `contract_approvals(id, contract_id, version_id, approver_id, status, comment, created_at, decided_at)`.
  - `collab_sessions(id, contract_id, provider, room_id, participants, started_by, started_at, ended_at)`.

- __Constraints & Indexes__
  - `unique(contract_id, version_number)` on versions.
  - FK constraints with `on delete cascade`.
  - Indexes on owner, contract_id, approver_id.

- __RLS__
  - Enabled on all tables.
  - Policies: owners can CRUD `contracts`; `has_contract_access(uid, contract_id)` gates reads/creates for related tables.

- __Helper Functions__
  - `public.has_contract_access(u uuid, c uuid) returns boolean` (security definer, stable).

- __Triggers__
  - `set_updated_at()` BEFORE UPDATE trigger on `contracts`.

- __RPC__
  - `public.take_snapshot(p_contract_id uuid, p_content_json jsonb, p_content_md text, p_ydoc_state_base64 text)`:
    - Locks the contract row (`for update`), computes next `version_number`.
    - Inserts into `contract_versions`; updates `contracts.latest_version_number` best-effort.
    - Returns the inserted version row.
    - `grant execute` to `authenticated, anon` (still requires JWT; RLS enforced via `auth.uid()`).

- __Migrations__
  - `0001_init.sql` (schema + RLS + triggers + helper).
  - `0002_rpc_take_snapshot.sql` (RPC + grants).

### 7.4 AI (Groq, OpenAI-compatible)

- __Provider & Model__
  - Groq HTTP API, OpenAI-compatible Chat Completions.
  - Default model: `llama3-70b-8192` (adjust per cost/latency).

- __Auth & Secrets__
  - `GROQ_API_KEY` set via Supabase function secrets.

- __Requests__
  - `POST /ai/generate-template` payload: `{ prompt: string, templateId?: string }`.
  - `POST /ai/analyze-risks` payload: `{ text: string }`.
  - Streaming: send `stream: true` to Groq; proxy to client as SSE.

- __Responses__
  - `generate-template`: `{ result: string, usedTemplateId: string | null }`.
  - `analyze-risks`: `{ score: number (0..1), flags: string[], suggestions: string[] }`.

- __SSE Contract__ (if enabled)
  - Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`.
  - Events: `data: { "delta": "text" }` lines; terminate with `event: end` then `data: {"ok":true}`.

- __Operational__
  - Timeouts: 30s request timeout; 60s stream idle timeout.
  - Retries: 1 retry on 429/5xx with exponential backoff.
  - PII: do not log raw prompts; mask emails/phones in logs.

### 7.5 Architecture Diagram

```mermaid
flowchart LR
  FE[Next.js 14 (TipTap + Yjs, TanStack)] -->|supabase-js| PostgREST[(Supabase PostgREST\nRLS policies)]
  FE -->|rpc('take_snapshot')| RPC[Postgres RPC\npublic.take_snapshot]
  FE -->|HTTPS| AI[Edge Function: ai]
  AI -->|HTTPS| GROQ[Groq API\n(OpenAI-compatible)]
  FE <--> |WebRTC| YW[y-webrtc (P2P)]
  FE <--> Realtime[Supabase Realtime\npresence]
  PostgREST --> DB[(Postgres)]
  RPC --> DB
  Realtime --> DB
```

---

## 8) Deployment

### 8.1 Backend (Supabase Edge Functions)

- Install Supabase CLI and login (`supabase login`)
- Link the project (`supabase link --project-ref <ref>`)
- Deploy (Fast-Track): `supabase functions deploy ai` (optional later: `contracts`, `collab-token`)
- Set secrets:
  - `supabase secrets set SUPABASE_URL=... SUPABASE_ANON_KEY=... ALLOWED_ORIGINS=...`
  - `supabase secrets set GROQ_API_KEY=...`
  - Optional: `supabase secrets set HOCUSPOCUS_JWT_SECRET=... LIVEBLOCKS_SECRET_KEY=...`

### 8.2 Frontend (Vercel or Netlify)

- Build command: `pnpm build` (or `npm run build`)
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- API calls go to Supabase Edge Function URLs: `https://<project-ref>.functions.supabase.co/<function>/<path>`

---

## 9) Smoke Tests (cURL examples)

```bash
# List contracts
curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  https://<ref>.functions.supabase.co/contracts

# Create contract
curl -X POST -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"NDA with ACME"}' \
  https://<ref>.functions.supabase.co/contracts

# Snapshot
curl -X POST -H "Authorization: Bearer $ACCESS_TOKEN" -H 'Content-Type: application/json' \
  -d '{"content_json": {"type":"doc","content":[]}}' \
  https://<ref>.functions.supabase.co/contracts/<contractId>/versions/snapshot
```

Additional (RPC via PostgREST):

```bash
# Snapshot using SQL RPC (Fast-Track)
curl -X POST \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  https://<ref>.supabase.co/rest/v1/rpc/take_snapshot \
  -d '{
    "p_contract_id": "<contractId>",
    "p_content_json": {"type":"doc","content":[]},
    "p_content_md": null,
    "p_ydoc_state_base64": null
  }'
```

---

## 10) MVP Definition of Done (Functional)

- Auth: Sign in with email/password via Supabase Auth; protected routes
- Contracts: Create/list/detail/update/delete with RLS
- Editor: Collaborative editing via Yjs + y-webrtc; presence via Supabase Realtime
- Versioning: Manual snapshot; list versions; restore by cloning to new version
- Approvals: Request approvals; approver decision updates status
- AI: Generate template + risk analysis endpoints returning usable content
- Export: On-demand export to PDF (optional MVP if time permits)
- Deployment: Running on free tiers; documented

---

## 11) Post-MVP (for future)

- Liveblocks managed collab (replace y-webrtc/Hocuspocus)
- Workflow automation, scheduling
- Billing (Stripe), quotas, orgs & roles
- Advanced analytics and search

---

## References

- [Supabase Edge Functions Auth](https://supabase.com/docs/guides/functions/auth)
- [Hocuspocus Auth Guide](https://tiptap.dev/docs/hocuspocus/guides/auth)
- [Hocuspocus Server Hooks](https://github.com/ueberdosis/hocuspocus/blob/main/docs/server/hooks.md)
- [Mermaid ER Diagrams](https://mermaid.js.org/syntax/entityRelationshipDiagram.html)
- [Groq API (OpenAI compatibility)](https://groq.com/pricing)
