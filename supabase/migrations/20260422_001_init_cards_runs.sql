-- 20260422_001_init_cards_runs.sql
-- Core schema for cards, runs, and collected data.

create extension if not exists pgcrypto;

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  source_type text not null,
  source_input text not null,
  params jsonb not null default '{}'::jsonb,
  schedule_enabled boolean not null default false,
  cron_expression text,
  timezone text not null default 'America/Chicago',
  next_run_at timestamptz,
  last_run_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.collection_runs (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.cards(id) on delete cascade,
  owner_id text not null,
  status text not null,
  trigger_mode text not null,
  attempts integer not null default 0,
  started_at timestamptz,
  ended_at timestamptz,
  error text,
  logs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.collected_data (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.collection_runs(id) on delete cascade,
  owner_id text not null,
  raw_data jsonb,
  normalized_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists cards_owner_idx on public.cards(owner_id);
create index if not exists cards_next_run_idx on public.cards(next_run_at);
create index if not exists runs_card_owner_idx on public.collection_runs(card_id, owner_id);
create index if not exists runs_status_idx on public.collection_runs(status);
create index if not exists collected_data_run_owner_idx on public.collected_data(run_id, owner_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_cards_updated_at on public.cards;
create trigger trg_cards_updated_at
before update on public.cards
for each row
execute function public.set_updated_at();

alter table public.cards enable row level security;
alter table public.collection_runs enable row level security;
alter table public.collected_data enable row level security;

-- Authenticated users can only access rows they own.
-- Service role bypasses RLS for backend operations.
drop policy if exists cards_owner_select on public.cards;
create policy cards_owner_select on public.cards
for select to authenticated
using (owner_id = auth.uid()::text);

drop policy if exists cards_owner_insert on public.cards;
create policy cards_owner_insert on public.cards
for insert to authenticated
with check (owner_id = auth.uid()::text);

drop policy if exists cards_owner_update on public.cards;
create policy cards_owner_update on public.cards
for update to authenticated
using (owner_id = auth.uid()::text)
with check (owner_id = auth.uid()::text);

drop policy if exists cards_owner_delete on public.cards;
create policy cards_owner_delete on public.cards
for delete to authenticated
using (owner_id = auth.uid()::text);

drop policy if exists runs_owner_select on public.collection_runs;
create policy runs_owner_select on public.collection_runs
for select to authenticated
using (owner_id = auth.uid()::text);

drop policy if exists runs_owner_insert on public.collection_runs;
create policy runs_owner_insert on public.collection_runs
for insert to authenticated
with check (owner_id = auth.uid()::text);

drop policy if exists runs_owner_update on public.collection_runs;
create policy runs_owner_update on public.collection_runs
for update to authenticated
using (owner_id = auth.uid()::text)
with check (owner_id = auth.uid()::text);

drop policy if exists runs_owner_delete on public.collection_runs;
create policy runs_owner_delete on public.collection_runs
for delete to authenticated
using (owner_id = auth.uid()::text);

drop policy if exists collected_owner_select on public.collected_data;
create policy collected_owner_select on public.collected_data
for select to authenticated
using (owner_id = auth.uid()::text);

drop policy if exists collected_owner_insert on public.collected_data;
create policy collected_owner_insert on public.collected_data
for insert to authenticated
with check (owner_id = auth.uid()::text);

drop policy if exists collected_owner_update on public.collected_data;
create policy collected_owner_update on public.collected_data
for update to authenticated
using (owner_id = auth.uid()::text)
with check (owner_id = auth.uid()::text);

drop policy if exists collected_owner_delete on public.collected_data;
create policy collected_owner_delete on public.collected_data
for delete to authenticated
using (owner_id = auth.uid()::text);