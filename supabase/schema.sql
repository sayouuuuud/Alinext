-- ============================================================================
-- ALI FLEET — Supabase schema
-- ============================================================================
-- This schema mirrors the site's content model (`lib/admin/types.ts`) so the
-- file-backed content store (`data/site-content.json`) can be migrated to
-- Supabase later. Multi-language fields are stored as JSONB in the shape
-- `{ "ar": string, "en": string, "he": string }` to match `MultiLangString`.
--
-- Run this against your Supabase project (SQL editor or `supabase db push`)
-- only when you are ready to activate the database — the app does not require
-- it yet.
-- ============================================================================

-- Required for UUID generation.
create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- Singleton site content: settings + page copy.
-- Stored as one JSONB document keyed to a single row so the existing
-- `SiteFullContent` shape can be persisted and versioned as-is.
-- ----------------------------------------------------------------------------
create table if not exists public.site_content (
  id          smallint primary key default 1,
  payload     jsonb not null,           -- settings + pages (SiteFullContent minus collections)
  version     integer not null default 5,
  updated_at  timestamptz not null default now(),
  constraint site_content_singleton check (id = 1)
);

comment on table public.site_content is
  'Singleton document holding branding, commerce, seo, maintenance, general (contact/social/navigation/footer) and pages (home/cars/products/blog/contact/cart/trackOrder/policies).';

-- ----------------------------------------------------------------------------
-- Cars (fleet: sale + import)
-- ----------------------------------------------------------------------------
create table if not exists public.cars (
  id           text primary key,
  type         text not null check (type in ('sale', 'import')),
  title        jsonb not null,          -- MultiLangString
  make         text,
  model        text,
  year         integer,
  price        numeric(12, 2),
  currency     text default '₪',
  mileage      text,
  fuel         text,
  transmission text,
  image        text,
  images       jsonb default '[]'::jsonb,
  status       text not null default 'available'
               check (status in ('available', 'reserved', 'sold', 'incoming')),
  featured     boolean not null default false,
  origin       text,
  condition    text,
  stage        smallint,
  previous_owners integer,
  eta          jsonb,                   -- MultiLangString
  availability jsonb,                   -- MultiLangString
  highlights   jsonb default '[]'::jsonb, -- MultiLangString[]
  specs        jsonb default '{}'::jsonb,
  description  jsonb,                   -- MultiLangString
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists cars_type_idx on public.cars (type);
create index if not exists cars_featured_idx on public.cars (featured);
create index if not exists cars_status_idx on public.cars (status);

-- ----------------------------------------------------------------------------
-- Products (spare parts)
-- ----------------------------------------------------------------------------
create table if not exists public.products (
  id            text primary key,
  name          jsonb not null,         -- MultiLangString
  sku           text,
  category      text,
  brand         text,
  price         numeric(12, 2),
  in_stock      boolean not null default true,
  featured      boolean not null default false,
  compatibility text,
  image         text,
  images        jsonb default '[]'::jsonb,
  specs         jsonb default '[]'::jsonb, -- {label: MultiLangString, value: MultiLangString}[]
  description   jsonb,                  -- MultiLangString
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_in_stock_idx on public.products (in_stock);

-- ----------------------------------------------------------------------------
-- Blog posts
-- ----------------------------------------------------------------------------
create table if not exists public.blog_posts (
  id           text primary key,
  slug         text unique,
  title        jsonb not null,          -- MultiLangString
  excerpt      jsonb,                   -- MultiLangString
  content      jsonb,                   -- MultiLangString
  author       text,
  author_avatar text,
  date         date,
  read_time    text,
  cover_image  text,
  image        text,
  tags         jsonb default '[]'::jsonb,
  category     text,
  published    boolean not null default true,
  featured     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists blog_posts_slug_idx on public.blog_posts (slug);
create index if not exists blog_posts_published_idx on public.blog_posts (published);
create index if not exists blog_posts_date_idx on public.blog_posts (date desc);

-- ----------------------------------------------------------------------------
-- Customers
-- ----------------------------------------------------------------------------
create table if not exists public.customers (
  id            text primary key,
  name          text not null,
  email         text,
  phone         text,
  avatar        text,
  tier          text default 'Regular'
                check (tier in ('VIP', 'Platinum', 'Gold', 'Regular')),
  status        text default 'active'
                check (status in ('active', 'suspended', 'pending')),
  joined_date   date,
  billing_address  jsonb default '{}'::jsonb,
  shipping_address jsonb default '{}'::jsonb,
  total_spent   numeric(12, 2) default 0,
  orders_count  integer default 0,
  interested_in text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists customers_email_idx on public.customers (email);
create index if not exists customers_status_idx on public.customers (status);

-- ----------------------------------------------------------------------------
-- Orders
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id              text primary key,     -- e.g. "ORD-7821"
  customer_id     text references public.customers (id) on delete set null,
  customer_name   text not null,
  customer_email  text,
  customer_phone  text,
  date            timestamptz not null default now(),
  status          text not null default 'pending'
                  check (status in ('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'completed')),
  total           numeric(12, 2) not null default 0,
  currency        text default '₪',
  shipping_address jsonb default '{}'::jsonb,
  payment_method  text check (payment_method in ('cod', 'card', 'bank_transfer')),
  payment_status  text default 'unpaid' check (payment_status in ('paid', 'unpaid', 'refunded')),
  tracking_number text,
  carrier         text,
  estimated_delivery text,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists orders_customer_idx on public.orders (customer_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_date_idx on public.orders (date desc);

-- ----------------------------------------------------------------------------
-- Order items (line items belonging to an order)
-- ----------------------------------------------------------------------------
create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   text not null references public.orders (id) on delete cascade,
  title      text not null,
  quantity   integer not null default 1 check (quantity > 0),
  price      numeric(12, 2) not null default 0,
  image      text,
  sku        text
);

create index if not exists order_items_order_idx on public.order_items (order_id);

-- ----------------------------------------------------------------------------
-- Inquiries (contact-form / leads)
-- ----------------------------------------------------------------------------
create table if not exists public.inquiries (
  id         text primary key,
  name       text not null,
  email      text,
  phone      text,
  service    text,
  message    text,
  date       timestamptz not null default now(),
  status     text not null default 'new'
             check (status in ('new', 'contacted', 'resolved')),
  created_at timestamptz not null default now()
);

create index if not exists inquiries_status_idx on public.inquiries (status);

-- ----------------------------------------------------------------------------
-- updated_at trigger helper
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  tbl text;
begin
  foreach tbl in array array['cars', 'products', 'blog_posts', 'customers', 'orders']
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I;
       create trigger set_updated_at before update on public.%I
       for each row execute function public.set_updated_at();',
      tbl, tbl
    );
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
-- Public read access for catalog content; writes restricted to the service
-- role (the admin content API uses the privileged server client).
alter table public.site_content enable row level security;
alter table public.cars         enable row level security;
alter table public.products     enable row level security;
alter table public.blog_posts   enable row level security;
alter table public.customers    enable row level security;
alter table public.orders       enable row level security;
alter table public.order_items  enable row level security;
alter table public.inquiries    enable row level security;

-- Public read-only policies for catalog data.
create policy "public read site_content" on public.site_content for select using (true);
create policy "public read cars"         on public.cars         for select using (true);
create policy "public read products"     on public.products     for select using (true);
create policy "public read blog_posts"   on public.blog_posts   for select using (published = true);

-- Inquiries: anyone can submit (insert), only service role can read/update.
create policy "public insert inquiries"  on public.inquiries    for insert with check (true);

-- Customers / orders / order_items contain PII — no public access.
-- (Service role bypasses RLS, so the admin API keeps full access.)
