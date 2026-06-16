-- ============================================================================
--  0012: parent/child resource booking levels
--  Existing `spaces` rows act as MVP resources:
--    parent_space_id is the resource tree,
--    space_type stores space / seat / parking / locker / room,
--    availabilities.bookable_level switches seat / space / both / closed.
--
--  Conflict rule:
--    - parent resource booking blocks direct children
--    - child resource booking blocks the parent
-- ============================================================================

alter table public.availabilities
  add column if not exists bookable_level varchar not null default 'both';

alter table public.availabilities
  drop constraint if exists availabilities_bookable_level_check,
  add constraint availabilities_bookable_level_check
    check (bookable_level in ('seat', 'space', 'both', 'closed'));

alter table public.bookings
  add column if not exists booking_level varchar not null default 'space',
  add column if not exists quantity integer not null default 1;

alter table public.bookings
  drop constraint if exists bookings_booking_level_check,
  add constraint bookings_booking_level_check
    check (booking_level in ('space', 'seat'));

alter table public.bookings
  drop constraint if exists bookings_quantity_check,
  add constraint bookings_quantity_check
    check (quantity > 0);

create index if not exists idx_spaces_parent_space
  on public.spaces(parent_space_id);

create index if not exists idx_bookings_space_time
  on public.bookings(space_id, start_at, end_at);

alter table public.bookings drop constraint if exists bookings_no_overlap;

create or replace function public.booking_conflict_resource_ids(p_space_id uuid)
returns table(resource_id uuid)
language sql
stable
as $$
  with selected as (
    select id, parent_space_id
    from public.spaces
    where id = p_space_id
  )
  select id from selected
  union
  select parent_space_id
  from selected
  where parent_space_id is not null
  union
  select child.id
  from public.spaces child
  join selected parent
    on child.parent_space_id = parent.id
  where parent.parent_space_id is null
$$;

create or replace function public.prevent_resource_booking_overlap()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('cancelled', 'rejected') then
    return new;
  end if;

  if exists (
    select 1
    from public.bookings existing
    where existing.id <> new.id
      and existing.status not in ('cancelled', 'rejected')
      and existing.start_at < new.end_at
      and existing.end_at > new.start_at
      and existing.space_id in (
        select resource_id
        from public.booking_conflict_resource_ids(new.space_id)
      )
  ) then
    raise exception 'resource booking overlaps parent/child resource'
      using errcode = '23P01', constraint = 'bookings_no_overlap';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_resource_booking_overlap on public.bookings;
create trigger trg_prevent_resource_booking_overlap
before insert or update of space_id, start_at, end_at, status
on public.bookings
for each row
execute function public.prevent_resource_booking_overlap();
