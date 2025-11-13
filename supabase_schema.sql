-- Supabase schema for House of Charity
-- Run this script in the Supabase SQL editor or via psql.

-- Enable UUID helper (already available in Supabase projects, but harmless if rerun)
create extension if not exists "pgcrypto";

-- donors table
create table if not exists public.donors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  phone_number text,
  address text,
  city text,
  state text,
  country text default 'India',
  pincode text,
  description text,
  website text,
  logo_url text,
  verified boolean not null default false,
  connected_ngos uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists donors_name_idx on public.donors using gin (to_tsvector('simple', coalesce(name,'')));

-- ngos table
create table if not exists public.ngos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  password_hash text not null,
  phone_number text,
  address text,
  city text,
  state text,
  country text default 'India',
  pincode text,
  works_done text,
  awards_received text,
  about text,
  gallery text,
  current_requirements text,
  future_plans text,
  awards_and_recognition text,
  recent_activities text,
  description text,
  website text,
  logo_url text,
  verified boolean not null default false,
  connected_donors uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ngos_name_idx on public.ngos using gin (to_tsvector('simple', coalesce(name,'')));

alter table public.ngos
  add column if not exists works_done text,
  add column if not exists awards_received text,
  add column if not exists about text,
  add column if not exists gallery text,
  add column if not exists current_requirements text,
  add column if not exists future_plans text,
  add column if not exists awards_and_recognition text,
  add column if not exists recent_activities text,
  add column if not exists connected_donors uuid[] default '{}'::uuid[];

alter table public.donors
  add column if not exists connected_ngos uuid[] default '{}'::uuid[];

-- donor <-> NGO many-to-many links
create table if not exists public.donor_ngo_links (
  id bigserial primary key,
  donor_id uuid not null references public.donors(id) on delete cascade,
  ngo_id uuid not null references public.ngos(id) on delete cascade,
  relationship_status text not null default 'active'
    check (relationship_status in ('interested','active','inactive','blocked')),
  notes text,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint donor_ngo_links_unique unique (donor_id, ngo_id)
);

create index if not exists donor_ngo_links_donor_idx on public.donor_ngo_links(donor_id);
create index if not exists donor_ngo_links_ngo_idx on public.donor_ngo_links(ngo_id);

-- donations table
create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid references public.donors(id) on delete set null,
  ngo_id uuid references public.ngos(id) on delete set null,
  donation_type text not null default 'money'
    check (donation_type in ('money','food','daily_essentials','services','other')),
  amount numeric(12,2) default 0, -- monetary value (0 for non-monetary donations)
  currency text default 'INR',
  quantity numeric(12,2),
  unit text,
  details text,
  essential_type text,
  delivery_date timestamptz,
  service_details text,
  message text,
  payment_method text,
  transaction_id text,
  anonymous boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending','confirmed','completed','cancelled','failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists donations_donor_idx on public.donations(donor_id);
create index if not exists donations_ngo_idx on public.donations(ngo_id);
create index if not exists donations_type_idx on public.donations(donation_type);
create index if not exists donations_status_idx on public.donations(status);

-- requirements (donation requests)
create table if not exists public.requirements (
  id uuid primary key default gen_random_uuid(),
  ngo_id uuid not null references public.ngos(id) on delete cascade,
  request_type text not null
    check (request_type in ('money','food','daily_essentials','services','other')),
  category text,
  details text,
  amount_needed numeric(12,2),
  currency text default 'INR',
  quantity numeric(12,2),
  unit text,
  priority text default 'medium'
    check (priority in ('low','medium','high','urgent')),
  status text not null default 'active'
    check (status in ('active','fulfilled','cancelled','partially_fulfilled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists requirements_ngo_idx on public.requirements(ngo_id);
create index if not exists requirements_status_idx on public.requirements(status);
create index if not exists requirements_priority_idx on public.requirements(priority);
create index if not exists requirements_category_idx on public.requirements(category);

-- shared trigger for updated_at columns
create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_touch_updated_at_donors on public.donors;
create trigger trg_touch_updated_at_donors
before update on public.donors
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_touch_updated_at_ngos on public.ngos;
create trigger trg_touch_updated_at_ngos
before update on public.ngos
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_touch_updated_at_links on public.donor_ngo_links;
create trigger trg_touch_updated_at_links
before update on public.donor_ngo_links
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_touch_updated_at_donations on public.donations;
create trigger trg_touch_updated_at_donations
before update on public.donations
for each row execute procedure public.touch_updated_at();

drop trigger if exists trg_touch_updated_at_requests on public.requirements;
create trigger trg_touch_updated_at_requests
before update on public.requirements
for each row execute procedure public.touch_updated_at();

