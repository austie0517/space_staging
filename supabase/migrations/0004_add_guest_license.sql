-- ============================================================================
--  0004: guests.license  (保有資格 — shown / edited on the guest profile)
--  Safe / re-runnable.
-- ============================================================================

alter table public.guests
  add column if not exists license varchar(100);
