-- ============================================================================
--  0011: resource classification on spaces
--  Treat existing spaces as self-referencing resources for MVP scale-out:
--  venue / parking / storage categories + capacity units + flexible attributes.
-- ============================================================================

alter table public.spaces
  add column if not exists resource_category varchar not null default 'venue',
  add column if not exists capacity_unit varchar not null default 'person',
  add column if not exists attributes jsonb not null default '{}'::jsonb;

alter table public.spaces
  drop constraint if exists spaces_resource_category_check,
  add constraint spaces_resource_category_check
    check (resource_category in ('venue', 'parking', 'storage'));

alter table public.spaces
  drop constraint if exists spaces_capacity_unit_check,
  add constraint spaces_capacity_unit_check
    check (capacity_unit in ('person', 'car', 'box'));

update public.spaces
set resource_category = 'venue',
    capacity_unit = 'person'
where resource_category is null
   or capacity_unit is null;
