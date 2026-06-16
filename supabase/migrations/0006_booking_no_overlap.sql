-- ============================================================================
--  0006: prevent double-booking at the DB level (race-safe).
--  An active (not cancelled/rejected) booking cannot overlap another on the
--  same space. Uses a partial GiST exclusion constraint (needs btree_gist).
-- ============================================================================

create extension if not exists btree_gist;

alter table public.bookings drop constraint if exists bookings_no_overlap;

alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    space_id with =,
    tsrange(start_at, end_at) with &&
  )
  where (status not in ('cancelled', 'rejected'));
