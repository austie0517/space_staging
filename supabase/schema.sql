-- ============================================================================
--  FULL SCHEMA  —  space-rental (Supabase / Postgres)
-- ----------------------------------------------------------------------------
--  Authoritative, from-scratch build of the CURRENT schema (28 tables).
--  Rebuilt 2026-06-12 from the live introspection + migration 0001_mvp_gaps.sql.
--
--  This file is RUNNABLE on a fresh database and re-runnable (idempotent):
--    - tables use `create table if not exists`
--    - real FOREIGN KEY / CHECK / UNIQUE constraints (not comments)
--    - all string-literal defaults are quoted (the live introspection dropped
--      the quotes, e.g. `default free` → would error)
--    - indexes, GRANTs, RLS + policies included
--    - tables are ordered by dependency so inline FKs resolve
--
--  Money is integer JPY. uuid PKs use gen_random_uuid() (pgcrypto / pg13+).
-- ============================================================================

create extension if not exists pgcrypto;        -- gen_random_uuid()
create extension if not exists "uuid-ossp";      -- legacy uuid_generate_v4()


-- ====================  Identity / users  ====================

create table if not exists public.users (
  id          uuid primary key default gen_random_uuid(),
  email       varchar not null unique,
  phone       varchar,
  name        varchar not null,
  is_host     boolean not null default false,
  is_guest    boolean not null default false,
  is_admin    boolean not null default false,
  status      varchar not null default 'active',   -- active | pending | suspended
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.guests (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  profession  varchar,
  license     varchar,
  created_at  timestamptz default now()
);
create index if not exists idx_guests_user on public.guests(user_id);

create table if not exists public.hosts (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references public.users(id) on delete cascade,
  stripe_account_id  varchar,
  plan               varchar default 'free',
  zipcode            varchar,
  prefecture         varchar,
  city               varchar,
  town               varchar,
  building           varchar,
  lat                numeric,
  lng                numeric,
  created_at         timestamptz default now()
);
create index if not exists idx_hosts_user on public.hosts(user_id);


-- ====================  Applications & KYC  ====================

create table if not exists public.guest_applications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  status            varchar not null default 'pending',
  profession        varchar,
  is_auto_approved  boolean default false,
  review_note       text,
  reviewed_by       uuid references public.users(id),
  reviewed_at       timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table if not exists public.host_applications (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
  status            varchar not null default 'pending',
  id_document_url   text,
  id_document_type  varchar,
  review_note       text,
  reviewed_by       uuid references public.users(id),
  reviewed_at       timestamptz,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create table if not exists public.kyc_submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.users(id) on delete cascade,
  doc_type      varchar not null,                  -- 運転免許証 / パスポート ...
  image_url     text,
  status        varchar not null default 'pending', -- pending | approved | rejected
  reviewed_by   uuid references public.users(id),
  reviewed_at   timestamptz,
  submitted_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists idx_kyc_status on public.kyc_submissions(status);


-- ====================  Spaces  ====================

create table if not exists public.spaces (
  id               uuid primary key default gen_random_uuid(),
  host_id          uuid not null references public.hosts(id) on delete cascade,
  parent_space_id  uuid references public.spaces(id) on delete set null,
  name             varchar not null,
  space_type       varchar not null,
  resource_category varchar not null default 'venue',
  capacity_unit    varchar not null default 'person',
  attributes       jsonb not null default '{}'::jsonb,
  status           varchar not null default 'draft',  -- draft | published
  description      text,
  pitch_title      varchar(120),
  pitch_body       text,
  min_booking_hours integer not null default 1,
  capacity         integer default 1,
  zipcode          varchar,
  prefecture       varchar,
  city             varchar,
  town             varchar,
  building         varchar,
  lat              numeric,
  lng              numeric,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists idx_spaces_host   on public.spaces(host_id);
create index if not exists idx_spaces_status on public.spaces(status);
create index if not exists idx_spaces_parent_space on public.spaces(parent_space_id);

create table if not exists public.space_images (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces(id) on delete cascade,
  image_url   text not null,
  is_cover    boolean default false,
  sort_order  integer default 0,
  created_at  timestamptz default now()
);
create index if not exists idx_space_images_space on public.space_images(space_id);

create table if not exists public.space_options (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces(id) on delete cascade,
  name        varchar not null,
  price_type  varchar not null,
  price       integer not null,
  is_active   boolean default true,
  created_at  timestamptz default now()
);
create index if not exists idx_space_options_space on public.space_options(space_id);

create table if not exists public.space_fields (
  id             uuid primary key default gen_random_uuid(),
  space_id       uuid not null references public.spaces(id) on delete cascade,
  field_key      varchar not null,
  field_label    varchar not null,
  field_value    text,
  is_public      boolean not null default true,
  display_order  integer not null default 0,
  field_type     varchar not null default 'text',   -- text | number | boolean | select
  options        jsonb,                              -- for field_type = 'select'
  created_at     timestamptz not null default now()
);
create index if not exists idx_space_fields_space on public.space_fields(space_id, display_order);

create table if not exists public.space_tags (
  id        uuid primary key default gen_random_uuid(),
  name      varchar not null unique,
  category  varchar   -- 共通 | 美容室 | 撮影 ...
);

create table if not exists public.space_tag_relations (
  space_id  uuid not null references public.spaces(id) on delete cascade,
  tag_id    uuid not null references public.space_tags(id) on delete cascade,
  primary key (space_id, tag_id)
);

create table if not exists public.availabilities (
  id               uuid primary key default gen_random_uuid(),
  space_id         uuid not null references public.spaces(id) on delete cascade,
  bookable_level   varchar not null default 'both',
  repeat_type      varchar not null default 'none',
  start_date       date not null,
  end_date         date,
  start_time       time not null,
  end_time         time not null,
  day_of_week      integer[],
  exception_dates  date[],
  is_active        boolean default true,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists idx_availabilities_space on public.availabilities(space_id);

create table if not exists public.pricing_rules (
  id          uuid primary key default gen_random_uuid(),
  space_id    uuid not null references public.spaces(id) on delete cascade,
  rule_name   varchar,
  start_time  time not null,
  end_time    time not null,
  price_type  varchar default 'hourly',
  price       integer not null,
  priority    integer default 0
);
create index if not exists idx_pricing_rules_space on public.pricing_rules(space_id);

create table if not exists public.repeat_discounts (
  id                 uuid primary key default gen_random_uuid(),
  space_id           uuid not null references public.spaces(id) on delete cascade,
  min_bookings       integer not null,
  discount_type      varchar not null,
  discount_value     integer not null,
  count_window_days  integer,
  is_active          boolean default true,
  created_at         timestamptz default now()
);
create index if not exists idx_repeat_discounts_space on public.repeat_discounts(space_id);


-- ====================  Coupons (referenced by bookings)  ====================

create table if not exists public.coupons (
  id                  uuid primary key default gen_random_uuid(),
  code                varchar not null unique,
  description         varchar,
  discount_type       varchar not null,
  discount_value      integer not null,
  host_id             uuid references public.hosts(id) on delete cascade,
  space_id            uuid references public.spaces(id) on delete cascade,
  max_uses            integer,
  current_uses        integer not null default 0,
  max_uses_per_guest  integer default 1,
  valid_from          date,
  valid_until         date,
  is_active           boolean default true,
  created_at          timestamptz default now()
);


-- ====================  Bookings  ====================

create table if not exists public.bookings (
  id               uuid primary key default gen_random_uuid(),
  space_id         uuid not null references public.spaces(id),
  guest_id         uuid not null references public.guests(id),
  booking_level    varchar not null default 'space',
  quantity         integer not null default 1,
  start_at         timestamptz not null,
  end_at           timestamptz not null,
  status           varchar not null default 'pending',
  subtotal         integer not null default 0,
  discount_amount  integer not null default 0,
  option_total     integer not null default 0,
  platform_fee     integer not null default 0,
  tax              integer not null default 0,
  total_price      integer not null default 0,
  coupon_id        uuid references public.coupons(id),
  discount_note    varchar,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists idx_bookings_space on public.bookings(space_id);
create index if not exists idx_bookings_guest on public.bookings(guest_id);
create index if not exists idx_bookings_space_time on public.bookings(space_id, start_at, end_at);

create table if not exists public.booking_options (
  id           uuid primary key default gen_random_uuid(),
  booking_id   uuid not null references public.bookings(id) on delete cascade,
  option_id    uuid not null references public.space_options(id),
  quantity     integer default 1,
  unit_price   integer not null,
  total_price  integer not null
);
create index if not exists idx_booking_options_booking on public.booking_options(booking_id);


-- ====================  Payments / coupons / settlements  ====================

create table if not exists public.payments (
  id                 uuid primary key default gen_random_uuid(),
  booking_id         uuid not null references public.bookings(id) on delete cascade,
  payment_intent_id  varchar,
  amount             integer not null,
  status             varchar,
  paid_at            timestamptz,
  stripe_charge_id   text,
  stripe_refund_id   text,
  failure_reason     text,
  receipt_url        text,
  refunded_amount    integer,
  created_at         timestamptz default now()
);
create index if not exists idx_payments_booking on public.payments(booking_id);

create table if not exists public.payment_methods (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references public.users(id) on delete cascade,
  stripe_payment_method_id  text,
  brand                     varchar,
  last4                     char(4),
  exp_month                 integer,
  exp_year                  integer,
  is_default                boolean not null default false,
  created_at                timestamptz not null default now()
);
create index if not exists idx_pm_user on public.payment_methods(user_id);

create table if not exists public.coupon_uses (
  id          uuid primary key default gen_random_uuid(),
  coupon_id   uuid not null references public.coupons(id) on delete cascade,
  guest_id    uuid not null references public.guests(id) on delete cascade,
  booking_id  uuid not null references public.bookings(id) on delete cascade,
  used_at     timestamptz default now()
);

create table if not exists public.discounts (
  id              uuid primary key default gen_random_uuid(),
  guest_id        uuid not null references public.guests(id) on delete cascade,
  host_id         uuid references public.hosts(id) on delete cascade,
  space_id        uuid references public.spaces(id) on delete cascade,
  discount_type   varchar not null,
  discount_value  integer not null,
  valid_from      date,
  valid_until     date,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

create table if not exists public.settlements (
  id             uuid primary key default gen_random_uuid(),
  host_id        uuid not null references public.hosts(id) on delete cascade,
  period_start   date not null,
  period_end     date not null,
  booking_total  integer not null default 0,   -- gross (JPY)
  platform_fee   integer not null default 0,
  payout_amount  integer not null default 0,   -- net to host
  status         varchar not null default 'pending', -- pending | paid
  paid_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_settlements_host on public.settlements(host_id);


-- ====================  Engagement  ====================

create table if not exists public.favorites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  space_id    uuid not null references public.spaces(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (user_id, space_id)
);
create index if not exists idx_favorites_user on public.favorites(user_id);

create table if not exists public.reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references public.bookings(id) on delete set null,
  guest_id    uuid not null references public.guests(id) on delete cascade,
  space_id    uuid not null references public.spaces(id) on delete cascade,
  rating      integer not null check (rating between 1 and 5),
  comment     text,
  created_at  timestamptz not null default now()
);
create index if not exists idx_reviews_space on public.reviews(space_id);

create table if not exists public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.users(id) on delete cascade,
  type        varchar,
  title       varchar,
  body        text,
  is_read     boolean not null default false,
  read_at     timestamptz,
  sent_at     timestamptz,
  created_at  timestamptz default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id);


-- ====================  Resource booking guards  ====================

alter table public.spaces
  drop constraint if exists spaces_resource_category_check,
  add constraint spaces_resource_category_check
    check (resource_category in ('venue', 'parking', 'storage'));

alter table public.spaces
  drop constraint if exists spaces_capacity_unit_check,
  add constraint spaces_capacity_unit_check
    check (capacity_unit in ('person', 'car', 'box'));

alter table public.spaces
  drop constraint if exists spaces_min_booking_hours_check,
  add constraint spaces_min_booking_hours_check
    check (min_booking_hours >= 1 and min_booking_hours <= 24);

alter table public.availabilities
  drop constraint if exists availabilities_bookable_level_check,
  add constraint availabilities_bookable_level_check
    check (bookable_level in ('seat', 'space', 'both', 'closed'));

alter table public.bookings
  drop constraint if exists bookings_booking_level_check,
  add constraint bookings_booking_level_check
    check (booking_level in ('space', 'seat'));

alter table public.bookings
  drop constraint if exists bookings_quantity_check,
  add constraint bookings_quantity_check
    check (quantity > 0);

create or replace function public.booking_conflict_resource_ids(p_space_id uuid)
returns table(resource_id uuid)
language sql
stable
as $$
  with selected as (
    select id, parent_space_id
    from public.spaces
    where id = p_space_id
  )
  select id from selected
  union
  select parent_space_id
  from selected
  where parent_space_id is not null
  union
  select child.id
  from public.spaces child
  join selected parent
    on child.parent_space_id = parent.id
  where parent.parent_space_id is null
$$;

create or replace function public.prevent_resource_booking_overlap()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('cancelled', 'rejected') then
    return new;
  end if;

  if exists (
    select 1
    from public.bookings existing
    where existing.id <> new.id
      and existing.status not in ('cancelled', 'rejected')
      and existing.start_at < new.end_at
      and existing.end_at > new.start_at
      and existing.space_id in (
        select resource_id
        from public.booking_conflict_resource_ids(new.space_id)
      )
  ) then
    raise exception 'resource booking overlaps parent/child resource'
      using errcode = '23P01', constraint = 'bookings_no_overlap';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_prevent_resource_booking_overlap on public.bookings;
create trigger trg_prevent_resource_booking_overlap
before insert or update of space_id, start_at, end_at, status
on public.bookings
for each row
execute function public.prevent_resource_booking_overlap();


-- ====================  Ops  ====================

create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.users(id) on delete cascade,
  action       varchar not null,
  target_type  varchar,
  target_id    uuid,
  created_at   timestamptz default now()
);

create table if not exists public.line_connections (
  user_id                  uuid primary key references public.users(id) on delete cascade,
  connected                boolean not null default false,
  line_user_id             text,
  display_name             text,
  notif_booking_confirmed  boolean not null default true,
  notif_cancelled          boolean not null default true,
  notif_entry_pin          boolean not null default true,
  notif_exit_reminder      boolean not null default true,
  updated_at               timestamptz not null default now()
);


-- ============================================================================
--  PERMISSIONS / RLS  (the app gets 42501 without these — see 0001_mvp_gaps.sql)
-- ============================================================================

grant usage on schema public to anon, authenticated, service_role;

-- Public catalog (browse without login)
grant select on
  public.spaces, public.space_images, public.space_options,
  public.availabilities, public.pricing_rules, public.repeat_discounts,
  public.space_fields, public.space_tags, public.space_tag_relations,
  public.reviews
to anon, authenticated;

-- Authenticated app data (RLS restricts rows — see policies below)
grant select, insert, update, delete on
  public.bookings, public.booking_options, public.payments, public.payment_methods,
  public.notifications, public.coupons, public.coupon_uses, public.discounts,
  public.users, public.guests, public.hosts,
  public.guest_applications, public.host_applications, public.kyc_submissions,
  public.favorites, public.reviews, public.settlements,
  public.line_connections, public.audit_logs
to authenticated;

-- Service role: full access for server-side / admin operations
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;

-- Future tables inherit these grants
alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant all    on tables to service_role;


-- ----------------------------------------------------------------------------
--  RLS  —  baseline policies (tighten per your auth model)
-- ----------------------------------------------------------------------------

-- Public-readable catalog data
alter table public.reviews             enable row level security;
alter table public.space_fields        enable row level security;
alter table public.space_tags          enable row level security;
alter table public.space_tag_relations enable row level security;

drop policy if exists "reviews public read"      on public.reviews;
drop policy if exists "space_fields public read" on public.space_fields;
drop policy if exists "tags public read"         on public.space_tags;
drop policy if exists "tag_rel public read"      on public.space_tag_relations;
create policy "reviews public read"      on public.reviews             for select using (true);
create policy "space_fields public read" on public.space_fields        for select using (is_public);
create policy "tags public read"         on public.space_tags          for select using (true);
create policy "tag_rel public read"      on public.space_tag_relations for select using (true);

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

-- settlements: host/admin only — add a policy matching your auth model
alter table public.settlements enable row level security;

-- ============================================================================
--  DONE.  Consolidated reference snapshot of the current schema.
--  Fresh DB: run this file top to bottom.
--  Existing DB: the numbered migrations are the source of truth.
-- ============================================================================


create extension if not exists "uuid-ossp";
