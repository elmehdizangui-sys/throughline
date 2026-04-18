-- Throughline schema for Supabase Postgres
-- Run in Supabase SQL editor.

create extension if not exists pgcrypto;

create table if not exists throughline_goals (
  id text primary key,
  name text not null,
  color text,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists throughline_projects (
  id text primary key,
  name text not null,
  tag text,
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
  is_pivot boolean not null default false,
  from_text text,
  to_text text,
  slot_kind text
);

create index if not exists throughline_entries_created_at_idx on throughline_entries (created_at desc);
create index if not exists throughline_entries_starred_idx on throughline_entries (starred);
create index if not exists throughline_entries_archived_idx on throughline_entries (archived);
