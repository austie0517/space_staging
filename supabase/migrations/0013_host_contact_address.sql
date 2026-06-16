-- ============================================================================
--  0013: host contact address
--  Phone remains on users.phone. Host business/contact address lives on hosts.
-- ============================================================================

alter table public.hosts
  add column if not exists zipcode varchar,
  add column if not exists prefecture varchar,
  add column if not exists city varchar,
  add column if not exists town varchar,
  add column if not exists building varchar,
  add column if not exists lat numeric,
  add column if not exists lng numeric;
