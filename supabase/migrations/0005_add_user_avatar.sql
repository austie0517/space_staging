-- ============================================================================
--  0005: users.avatar_url  (profile photo, stored in the `avatars` bucket)
--  Safe / re-runnable.
-- ============================================================================

alter table public.users
  add column if not exists avatar_url text;
