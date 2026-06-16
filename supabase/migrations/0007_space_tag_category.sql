-- ============================================================================
--  0007: space_tags.category  — group amenity templates by category
--  (共通 / 美容室 / 撮影 ...). Safe / re-runnable.
-- ============================================================================

alter table public.space_tags
  add column if not exists category varchar(40);
