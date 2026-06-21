create index if not exists idx_notifications_user_read
  on public.notifications (user_id, is_read);

create index if not exists idx_notifications_user_read_type
  on public.notifications (user_id, is_read, type);
