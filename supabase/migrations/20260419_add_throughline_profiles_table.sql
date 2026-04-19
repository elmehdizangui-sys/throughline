-- Add authenticated user profiles for Throughline.
-- Run this migration in Supabase SQL editor or via your migration workflow.

create table if not exists throughline_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text not null default '',
  bio text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table throughline_profiles
  add column if not exists email text,
  add column if not exists display_name text not null default '',
  add column if not exists bio text not null default '',
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'throughline_profiles_display_name_length'
  ) then
    alter table throughline_profiles
      add constraint throughline_profiles_display_name_length
      check (char_length(display_name) <= 120);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'throughline_profiles_bio_length'
  ) then
    alter table throughline_profiles
      add constraint throughline_profiles_bio_length
      check (char_length(bio) <= 2000);
  end if;
end
$$;

alter table throughline_profiles enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'throughline_profiles'
      and policyname = 'throughline_profiles_select_own'
  ) then
    create policy throughline_profiles_select_own
      on throughline_profiles for select
      using (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'throughline_profiles'
      and policyname = 'throughline_profiles_insert_own'
  ) then
    create policy throughline_profiles_insert_own
      on throughline_profiles for insert
      with check (auth.uid() = id);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'throughline_profiles'
      and policyname = 'throughline_profiles_update_own'
  ) then
    create policy throughline_profiles_update_own
      on throughline_profiles for update
      using (auth.uid() = id)
      with check (auth.uid() = id);
  end if;
end
$$;
