-- ============================================================================
--  0010: spaces.min_booking_hours  — host-configurable minimum booking duration
--  Safe / re-runnable.
-- ============================================================================

alter table public.spaces
  add column if not exists min_booking_hours integer not null default 1;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'spaces_min_booking_hours_check'
      and conrelid = 'public.spaces'::regclass
  ) then
    alter table public.spaces
      add constraint spaces_min_booking_hours_check
      check (min_booking_hours >= 1 and min_booking_hours <= 24)
      not valid;
  end if;
end $$;

alter table public.spaces
  validate constraint spaces_min_booking_hours_check;
