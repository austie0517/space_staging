-- ============================================================================
--  MVP gap migration  —  REVIEW ONLY (do NOT run blindly on production)
-- ============================================================================
--  Generated 2026-06-12 against the LIVE Supabase schema (19 tables already
--  exist: spaces, space_images, space_options, availabilities, pricing_rules,
--  repeat_discounts, bookings, booking_options, payments, coupons, coupon_uses,
--  discounts, users, guests, hosts, guest_applications, host_applications,
--  notifications, audit_logs).
--
--  This file closes the gaps between the current UI/mock and the real DB.
--  Run sections in order. Section 0 (permissions) is the actual reason the app
--  can't read Supabase today (error 42501) — review it FIRST and carefully,
--  because GRANT/RLS affects the whole database.
--
--  Assumptions (verify against your real columns before running):
--    - PK `id` is uuid  → gen_random_uuid() (extension "pgcrypto" / pgsql 13+)
--    - money is integer JPY (matches bookings.subtotal / total_price)
--    - FKs: users(id), guests(id), hosts(id), spaces(id), bookings(id)
-- ============================================================================


-- ============================================================================
-- 0. PERMISSIONS / RLS  —  THE BLOCKER (error 42501)
-- ----------------------------------------------------------------------------
--  Even the service_role key currently gets "insufficient_privilege". The API
--  roles lack table privileges. Schema match alone will NOT make the app work
--  until this is fixed.
--
--  NOTE on safety: granting SELECT to `anon` exposes a table to unauthenticated
--  reads (RLS still applies if enabled). Below, anon may read only the public
--  catalog tables; everything else is authenticated + service_role.
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Public catalog (browse without login)
grant select on
  public.spaces, public.space_images, public.space_options,
  public.availabilities, public.pricing_rules, public.repeat_discounts
to anon, authenticated;

-- Authenticated app data (RLS restricts rows — see policies below / existing)
grant select, insert, update, delete on
  public.bookings, public.booking_options, public.payments,
  public.notifications, public.coupons, public.coupon_uses, public.discounts,
  public.users, public.guests, public.hosts,
  public.guest_applications, public.host_applications, public.audit_logs
to authenticated;

-- Service role: full access for server-side code / admin operations
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- Future tables created later inherit these grants
alter default privileges in schema public
  grant select on tables to anon, authenticated;
alter default privileges in schema public
  grant all on tables to service_role;

-- If RLS is ON for existing tables but has no policies, reads return 0 rows.
-- Add policies per table as needed, e.g. public read for the catalog:
--   alter table public.spaces enable row level security;
--   create policy "spaces are public" on public.spaces for select using (true);
-- (left commented — confirm your current RLS state before toggling.)


-- ============================================================================
-- 1. COLUMN ADDITIONS to existing tables
-- ============================================================================

-- 1a. notifications: UI (/me/notifications) needs a body + read state.
--     Current columns: id, user_id, type, title, sent_at, created_at
alter table public.notifications
  add column if not exists body    text,
  add column if not exists is_read boolean not null default false,
  add column if not exists read_at timestamptz;

-- 1b. payments: real operation needs more than payment_intent_id.
--     Current columns: id, booking_id, payment_intent_id, amount, status, paid_at, created_at
alter table public.payments
  add column if not exists stripe_charge_id  text,
  add column if not exists stripe_refund_id  text,
  add column if not exists failure_reason    text,
  add column if not exists receipt_url        text,
  add column if not exists refunded_amount   integer;


-- ============================================================================
-- 2. NEW TABLES  (UI exists, DB table missing)
-- ============================================================================

-- 2a. favorites  →  /me/favorites , heart on /spaces & /spaces/[id]
create table if not exists public.favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.users(id) on delete cascade,
  space_id   uuid not null references public.spaces(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, space_id)
);
create index if not exists idx_favorites_user on public.favorites(user_id);

-- 2b. reviews  →  ReviewDialog (guest/bookings) , /spaces/[id] reviews section
create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) on delete set null,
  guest_id   uuid not null references public.guests(id) on delete cascade,
  space_id   uuid not null references public.spaces(id) on delete cascade,
  rating     integer not null check (rating between 1 and 5),
  comment    text,
  created_at timestamptz not null default now()
);
create index if not exists idx_reviews_space on public.reviews(space_id);
-- NOTE: spaces has no rating/review_count columns. Either compute on read
--       (avg/count from reviews) or add cached columns:
-- alter table public.spaces
--   add column if not exists rating       numeric(2,1) default 0,
--   add column if not exists review_count integer      default 0;

-- 2c. settlements  →  /admin/settlements (payouts to hosts)
create table if not exists public.settlements (
  id            uuid primary key default gen_random_uuid(),
  host_id       uuid not null references public.hosts(id) on delete cascade,
  period_start  date not null,
  period_end    date not null,
  booking_total integer not null default 0,  -- gross (JPY)
  platform_fee  integer not null default 0,
  payout_amount integer not null default 0,  -- net to host
  status        varchar(20) not null default 'pending', -- pending | paid
  paid_at       timestamptz,
  created_at    timestamptz not null default now()
);
create index if not exists idx_settlements_host on public.settlements(host_id);

-- 2d. kyc_submissions  →  /me/verify (upload) , /admin/kyc (review)
--     (KYC is SEPARATE from host/guest_applications — those already exist.)
create table if not exists public.kyc_submissions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  doc_type     varchar(40) not null,            -- 運転免許証 / パスポート ...
  image_url    text,                            -- storage path of the document
  status       varchar(20) not null default 'pending', -- pending | approved | rejected
  reviewed_by  uuid references public.users(id),
  reviewed_at  timestamptz,
  submitted_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index if not exists idx_kyc_status on public.kyc_submissions(status);

-- 2e. space_fields  →  SpaceFieldsEditor (host) , 詳細情報 on /spaces/[id]
--     DB-managed display items. (≠ space_options which is pricing.)
create table if not exists public.space_fields (
  id            uuid primary key default gen_random_uuid(),
  space_id      uuid not null references public.spaces(id) on delete cascade,
  field_key     varchar(50) not null,
  field_label   varchar(80) not null,
  field_value   text,
  is_public     boolean not null default true,
  display_order integer not null default 0,
  field_type    varchar(20) not null default 'text', -- text|number|boolean|select
  options       jsonb,                                -- for field_type = 'select'
  created_at    timestamptz not null default now()
);
create index if not exists idx_space_fields_space on public.space_fields(space_id, display_order);

-- 2f. payment_methods  →  /me/payment (saved cards)
--     (payments = per-booking transactions; this = the saved card on file.)
create table if not exists public.payment_methods (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references public.users(id) on delete cascade,
  stripe_payment_method_id text,
  brand                    varchar(20),
  last4                    char(4),
  exp_month                integer,
  exp_year                 integer,
  is_default               boolean not null default false,
  created_at               timestamptz not null default now()
);
create index if not exists idx_pm_user on public.payment_methods(user_id);

-- 2g. line_connections  →  /me/settings (LINE link + notification toggles)
create table if not exists public.line_connections (
  user_id            uuid primary key references public.users(id) on delete cascade,
  connected          boolean not null default false,
  line_user_id       text,
  display_name       text,
  notif_booking_confirmed boolean not null default true,
  notif_cancelled         boolean not null default true,
  notif_entry_pin         boolean not null default true,
  notif_exit_reminder     boolean not null default true,
  updated_at         timestamptz not null default now()
);

-- 2h. space_tags / space_tag_relations  →  amenities/equipment on /spaces/[id]
--     (spaces has NO amenities/tags columns.)
create table if not exists public.space_tags (
  id   uuid primary key default gen_random_uuid(),
  name varchar(50) not null unique
);
create table if not exists public.space_tag_relations (
  space_id uuid not null references public.spaces(id) on delete cascade,
  tag_id   uuid not null references public.space_tags(id) on delete cascade,
  primary key (space_id, tag_id)
);


-- ============================================================================
-- 3. RLS for the NEW tables  (baseline — tighten as needed)
-- ============================================================================
-- Public-readable catalog data
alter table public.reviews            enable row level security;
alter table public.space_fields       enable row level security;
alter table public.space_tags         enable row level security;
alter table public.space_tag_relations enable row level security;
drop policy if exists "reviews public read"      on public.reviews;
drop policy if exists "space_fields public read" on public.space_fields;
drop policy if exists "tags public read"         on public.space_tags;
drop policy if exists "tag_rel public read"      on public.space_tag_relations;
create policy "reviews public read"     on public.reviews            for select using (true);
create policy "space_fields public read" on public.space_fields      for select using (is_public);
create policy "tags public read"        on public.space_tags         for select using (true);
create policy "tag_rel public read"     on public.space_tag_relations for select using (true);

-- Per-user private data (auth.uid() must map to users.id in your setup)
alter table public.favorites        enable row level security;
alter table public.payment_methods  enable row level security;
alter table public.line_connections enable row level security;
alter table public.kyc_submissions  enable row level security;
drop policy if exists "own favorites"       on public.favorites;
drop policy if exists "own payment methods" on public.payment_methods;
drop policy if exists "own line conn"       on public.line_connections;
drop policy if exists "own kyc"             on public.kyc_submissions;
create policy "own favorites"       on public.favorites        for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own payment methods" on public.payment_methods  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own line conn"       on public.line_connections for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own kyc"             on public.kyc_submissions  for select using (user_id = auth.uid());
-- settlements: host/admin only — add a policy matching your auth model.
alter table public.settlements enable row level security;

-- ============================================================================
-- DONE. After running:  set NEXT_PUBLIC_DATA_SOURCE=supabase  and fill in the
-- query bodies in services/supabase/*.service.ts (mapper must use real columns:
-- spaces.name (not title), price via space_options, spaces.status (not published),
-- address = prefecture/city/town, rating/review_count from reviews).
-- ============================================================================
