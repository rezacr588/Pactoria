-- Pactoria MVP – Initial schema and RLS
-- This migration mirrors the ERD and access model in BUSINESS_PLAN.md and MVP_IMPLEMENTATION_PLAN.md

-- Enable extension for gen_random_uuid()
create extension if not exists pgcrypto;

-- =====================
-- Tables
-- =====================

-- contracts
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

-- contract_versions
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

-- contract_approvals
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

-- collab_sessions
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

-- =====================
-- Updated timestamp trigger
-- =====================
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

-- =====================
-- RLS and helper function
-- =====================

-- Helper: check if user has access (owner or approver for that contract)
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

-- contracts policies
create policy contracts_select on public.contracts
  for select using (public.has_contract_access(auth.uid(), id));
create policy contracts_insert on public.contracts
  for insert with check (owner_id = auth.uid());
create policy contracts_update on public.contracts
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy contracts_delete on public.contracts
  for delete using (owner_id = auth.uid());

-- contract_versions policies
create policy versions_select on public.contract_versions
  for select using (public.has_contract_access(auth.uid(), contract_id));
create policy versions_insert on public.contract_versions
  for insert with check (public.has_contract_access(auth.uid(), contract_id) and created_by = auth.uid());

-- contract_approvals policies
create policy approvals_select on public.contract_approvals
  for select using (public.has_contract_access(auth.uid(), contract_id));
create policy approvals_insert on public.contract_approvals
  for insert with check (public.has_contract_access(auth.uid(), contract_id));
create policy approvals_update on public.contract_approvals
  for update using (approver_id = auth.uid());

-- collab_sessions policies
create policy sessions_select on public.collab_sessions
  for select using (public.has_contract_access(auth.uid(), contract_id));
create policy sessions_insert on public.collab_sessions
  for insert with check (public.has_contract_access(auth.uid(), contract_id) and started_by = auth.uid());
