-- ============================================================================
--  SEED DATA  —  REVIEW ONLY (run after 0001; safe to re-run: ON CONFLICT skip)
-- ----------------------------------------------------------------------------
--  All tables are currently empty. This inserts a minimal, FK-consistent set
--  (1 host, 1 guest, 3 published spaces with hourly price + a cover image) so
--  the app can read REAL rows once NEXT_PUBLIC_DATA_SOURCE=supabase.
--  Fixed UUIDs are used so the rows are stable / re-runnable.
-- ============================================================================

-- Users ----------------------------------------------------------------------
insert into public.users (id, email, name, is_host, is_guest, is_admin) values
  ('00000000-0000-0000-0000-000000000001', 'host@example.com',  '田中 芳子', true,  false, false),
  ('00000000-0000-0000-0000-000000000002', 'guest@example.com', '佐藤 健太', false, true,  false)
on conflict (id) do nothing;

insert into public.hosts (id, user_id, plan) values
  ('00000000-0000-0000-0000-0000000000a1', '00000000-0000-0000-0000-000000000001', 'free')
on conflict (id) do nothing;

insert into public.guests (id, user_id, profession) values
  ('00000000-0000-0000-0000-0000000000b1', '00000000-0000-0000-0000-000000000002', 'フォトグラファー')
on conflict (id) do nothing;

-- Spaces ---------------------------------------------------------------------
insert into public.spaces
  (id, host_id, name, space_type, status, description, capacity, prefecture, city, town) values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-0000000000a1',
   'Sunset Atelier', 'Creative Studio', 'published',
   '自然光が豊かに差し込む、洗練されたクリエイティブワークスペース。', 8, '東京都', '渋谷区', '代官山'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-0000000000a1',
   'Minimalist Lab', 'Private Office', 'published',
   '都心を一望する高層階のミニマルなラボ。', 6, '東京都', '港区', '神宮前'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-0000000000a1',
   'Harajuku Hideout', 'Cafe Style', 'draft',
   '本格的なエスプレッソマシンを備えたカフェスタイルの隠れ家空間。', 10, '東京都', '渋谷区', '神宮前')
on conflict (id) do nothing;

-- Hourly price (space_options) -----------------------------------------------
insert into public.space_options (id, space_id, name, price_type, price, is_active) values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000101', '基本料金', 'hourly', 3200, true),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000102', '基本料金', 'hourly', 2800, true),
  ('00000000-0000-0000-0000-000000000203', '00000000-0000-0000-0000-000000000103', '基本料金', 'hourly', 3100, true)
on conflict (id) do nothing;

-- Cover images ---------------------------------------------------------------
insert into public.space_images (id, space_id, image_url, is_cover, sort_order) values
  ('00000000-0000-0000-0000-000000000301', '00000000-0000-0000-0000-000000000101',
   'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80', true, 0),
  ('00000000-0000-0000-0000-000000000302', '00000000-0000-0000-0000-000000000102',
   'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80', true, 0),
  ('00000000-0000-0000-0000-000000000303', '00000000-0000-0000-0000-000000000103',
   'https://images.unsplash.com/photo-1453614512568-c4024d13c247?auto=format&fit=crop&w=1200&q=80', true, 0)
on conflict (id) do nothing;

-- Availability (Sunset Atelier: weekdays 09:00–21:00) ------------------------
insert into public.availabilities
  (id, space_id, repeat_type, start_date, end_date, start_time, end_time, day_of_week, is_active) values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000101',
   'weekly', '2026-01-01', null, '09:00', '21:00', '{1,2,3,4,5}', true)
on conflict (id) do nothing;
