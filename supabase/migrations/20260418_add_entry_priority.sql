-- Add entry priority support.
-- Run this migration in Supabase SQL editor or via your migration workflow.

alter table if exists throughline_entries
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
