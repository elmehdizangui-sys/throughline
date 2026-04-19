-- Reset all app data (keeps schema and RLS policies intact)
-- Run via: supabase db reset --no-run-seed  OR  psql $DATABASE_URL -f supabase/scripts/reset_data.sql

truncate table
  throughline_commitments,
  throughline_entries,
  throughline_goals,
  throughline_projects,
  throughline_profiles
restart identity cascade;
