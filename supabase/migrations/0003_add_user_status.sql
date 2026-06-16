-- ============================================================================
--  0003: users.status  (active | pending | suspended)
--  Enables the admin user-suspension feature. Safe / re-runnable.
-- ============================================================================

alter table public.users
  add column if not exists status varchar(20) not null default 'active';
