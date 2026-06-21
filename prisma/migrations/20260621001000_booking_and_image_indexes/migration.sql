create index if not exists idx_space_images_space_cover_sort
  on public.space_images (space_id, is_cover, sort_order);

create index if not exists idx_bookings_space_status_start
  on public.bookings (space_id, status, start_at);
