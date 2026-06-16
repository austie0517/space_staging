-- ============================================================================
--  0008: spaces pitch copy  — short title + detailed introduction
--  Safe / re-runnable.
-- ============================================================================

alter table public.spaces
  add column if not exists pitch_title varchar(120),
  add column if not exists pitch_body text;
