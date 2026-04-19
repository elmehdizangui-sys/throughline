-- Multi-user infrastructure: user scoping, goal/project status, week commitments, tweaks in profile
-- Run in Supabase SQL editor after previous migrations.

-- ─── User ID scoping ────────────────────────────────────────────────────────

alter table throughline_goals
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table throughline_projects
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

alter table throughline_entries
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists throughline_goals_user_idx on throughline_goals (user_id);
create index if not exists throughline_projects_user_idx on throughline_projects (user_id);
create index if not exists throughline_entries_user_idx on throughline_entries (user_id);

-- ─── RLS policies (scope data per user) ─────────────────────────────────────
-- Service role key (used by API routes) bypasses RLS.
-- These policies protect direct authenticated key access.

drop policy if exists "goals_owner" on throughline_goals;
create policy "goals_owner" on throughline_goals
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "projects_owner" on throughline_projects;
create policy "projects_owner" on throughline_projects
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "entries_owner" on throughline_entries;
create policy "entries_owner" on throughline_entries
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─── Goal & Project status ───────────────────────────────────────────────────

alter table throughline_goals
  add column if not exists status text not null default 'active'
  check (status in ('active', 'paused', 'someday', 'archived'));

alter table throughline_projects
  add column if not exists status text not null default 'active'
  check (status in ('active', 'paused', 'someday', 'archived'));

-- ─── Tweaks in profile ───────────────────────────────────────────────────────

alter table throughline_profiles
  add column if not exists tweaks jsonb;

-- ─── Week commitments ────────────────────────────────────────────────────────

create table if not exists throughline_commitments (
  id         text primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  week_key   text not null,  -- ISO week string e.g. "2026-W16"
  text       text not null,
  done       boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table throughline_commitments enable row level security;

drop policy if exists "commitments_owner" on throughline_commitments;
create policy "commitments_owner" on throughline_commitments
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists throughline_commitments_week_idx
  on throughline_commitments (user_id, week_key);
