-- Throughline schema for Supabase Postgres
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists throughline_goals (
  id text primary key,
  name text not null,
  color text,
  order_index int not null default 0,
  target_date date,
  active_from date,
  active_to date,
  created_at timestamptz not null default now()
);

create table if not exists throughline_projects (
  id text primary key,
  name text not null,
  goal_id text references throughline_goals(id) on delete set null,
  color text,
  tag text,
  target_date date,
  active_from date,
  active_to date,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists throughline_entries (
  id text primary key,
  content text not null,
  created_at timestamptz not null default now(),
  starred boolean not null default false,
  archived boolean not null default false,
  goals text[] not null default '{}',
  projects text[] not null default '{}',
  tags text[] not null default '{}',
  is_code boolean not null default false,
  link jsonb,
  signal boolean not null default false,
  is_pivot boolean not null default false,
  from_text text,
  to_text text,
  slot_kind text,
  pivot_label text,
  priority text check (priority in ('dunya', 'akhirah'))
);

alter table throughline_goals
  add column if not exists target_date date,
  add column if not exists active_from date,
  add column if not exists active_to date;

alter table throughline_projects
  add column if not exists goal_id text references throughline_goals(id) on delete set null,
  add column if not exists color text,
  add column if not exists target_date date,
  add column if not exists active_from date,
  add column if not exists active_to date;

alter table throughline_entries
  add column if not exists signal boolean not null default false,
  add column if not exists pivot_label text,
  add column if not exists priority text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'throughline_entries_priority_check'
  ) then
    alter table throughline_entries
      add constraint throughline_entries_priority_check
      check (priority in ('dunya', 'akhirah'));
  end if;
end
$$;

create index if not exists throughline_entries_created_at_idx on throughline_entries (created_at desc);
create index if not exists throughline_entries_starred_idx on throughline_entries (starred);
create index if not exists throughline_entries_archived_idx on throughline_entries (archived);
create index if not exists throughline_entries_signal_idx on throughline_entries (signal);
create index if not exists throughline_entries_is_pivot_idx on throughline_entries (is_pivot);
create index if not exists throughline_projects_goal_order_idx on throughline_projects (goal_id, order_index);
