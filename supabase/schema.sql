-- ALI FLEET production schema for Supabase
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

do $$
begin
  create type public.admin_role as enum ('owner', 'content_editor', 'operations');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.order_status as enum ('pending', 'confirmed', 'processing', 'shipping', 'delivered', 'cancelled', 'completed');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.payment_status as enum ('unpaid', 'paid', 'refunded');
exception when duplicate_object then null;
end $$;

create sequence if not exists public.order_number_seq start 1001;

create or replace function private.valid_i18n(value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select jsonb_typeof(value) = 'object'
    and jsonb_typeof(value -> 'ar') = 'string'
    and jsonb_typeof(value -> 'en') = 'string'
    and jsonb_typeof(value -> 'he') = 'string'
$$;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Keeps product -> category links valid and the legacy text column in sync.
create or replace function private.validate_product_category_links()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  main_slug text;
  main_parent text;
  sub_parent text;
begin
  if new.category_id is null and new.category is not null then
    select c.id into new.category_id
    from public.categories c
    where c.parent_id is null and c.slug = new.category
    limit 1;
  end if;

  if new.category_id is not null then
    select c.slug, c.parent_id into main_slug, main_parent
    from public.categories c
    where c.id = new.category_id;
    if main_slug is null then
      raise exception 'category_id % does not exist in categories', new.category_id;
    end if;
    if main_parent is not null then
      raise exception 'category_id % must reference a main category, not a subcategory', new.category_id;
    end if;
    new.category := main_slug;
  end if;

  if new.subcategory_id is not null then
    if new.category_id is null then
      raise exception 'subcategory_id % requires a main category_id', new.subcategory_id;
    end if;
    select c.parent_id into sub_parent
    from public.categories c
    where c.id = new.subcategory_id;
    if sub_parent is null then
      raise exception 'subcategory_id % does not exist in categories', new.subcategory_id;
    end if;
    if sub_parent <> new.category_id then
      raise exception 'subcategory_id % does not belong to main category %', new.subcategory_id, new.category_id;
    end if;
  end if;

  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  display_name text not null default '',
  username text unique,
  phone text,
  preferred_locale text not null default 'ar' check (preferred_locale in ('ar', 'en', 'he')),
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'suspended', 'pending')),
  tier text not null default 'Regular' check (tier in ('VIP', 'Platinum', 'Gold', 'Regular')),
  interested_in text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  label text not null default 'Home',
  kind text not null default 'shipping' check (kind in ('shipping', 'billing')),
  full_name text not null,
  phone text not null,
  company text,
  street text not null,
  address_line_2 text,
  city text not null,
  state text,
  country text not null default 'Israel',
  postal_code text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index addresses_one_default_idx on public.addresses(user_id, kind) where is_default;
create index addresses_user_idx on public.addresses(user_id);

create table public.admin_memberships (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.admin_role not null,
  active boolean not null default true,
  demo_only boolean not null default false,
  must_change_password boolean not null default false,
  mfa_required boolean not null default true,
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token_hash text not null unique,
  supabase_session_id text,
  ip_hash text,
  user_agent text,
  last_active_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index admin_sessions_user_idx on public.admin_sessions(user_id, expires_at desc);

create table public.site_content (
  id smallint primary key default 1 check (id = 1),
  payload jsonb not null,
  version integer not null default 6,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table public.site_settings_public (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.site_settings_private (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.page_sections (
  id uuid primary key default gen_random_uuid(),
  page_key text not null,
  section_key text not null,
  content jsonb not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  updated_at timestamptz not null default now(),
  unique(page_key, section_key)
);
create index page_sections_page_idx on public.page_sections(page_key, sort_order);

create table public.policy_pages (
  id text primary key check (id in ('privacy', 'terms', 'refund')),
  slug text not null unique,
  title jsonb not null check (private.valid_i18n(title)),
  content jsonb not null check (private.valid_i18n(content)),
  last_updated date not null default current_date,
  published boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.seo_entries (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('page', 'car', 'product', 'blog', 'policy')),
  entity_id text not null default '',
  locale text not null check (locale in ('ar', 'en', 'he')),
  title text not null,
  description text not null,
  keywords text[] not null default '{}',
  canonical_path text,
  og_title text,
  og_description text,
  og_image text,
  indexable boolean not null default true,
  follow boolean not null default true,
  updated_at timestamptz not null default now()
);
create unique index seo_entries_entity_idx on public.seo_entries(entity_type, entity_id, locale);

create table public.cars (
  id text primary key,
  slug text not null unique,
  type text not null check (type in ('sale', 'import')),
  title jsonb not null check (private.valid_i18n(title)),
  make text not null,
  model text not null,
  year integer not null check (year between 1950 and 2200),
  price_minor bigint check (price_minor is null or price_minor >= 0),
  currency text not null default 'ILS' check (currency ~ '^[A-Z]{3}$'),
  mileage text,
  fuel text,
  transmission text,
  status text not null default 'available' check (status in ('available', 'reserved', 'sold', 'incoming')),
  featured boolean not null default false,
  origin text,
  condition text check (condition is null or condition in ('new', 'used', 'demo')),
  import_stage smallint check (import_stage is null or import_stage between 1 and 4),
  previous_owners integer check (previous_owners is null or previous_owners >= 0),
  eta jsonb,
  availability jsonb,
  specs jsonb not null default '{}',
  description jsonb not null check (private.valid_i18n(description)),
  primary_image text,
  published boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index cars_public_idx on public.cars(type, status, featured) where published and archived_at is null;

create table public.car_media (
  id uuid primary key default gen_random_uuid(),
  car_id text not null references public.cars(id) on delete cascade,
  url text not null,
  alt jsonb,
  sort_order integer not null default 0,
  unique(car_id, url)
);
create index car_media_car_idx on public.car_media(car_id, sort_order);

create table public.car_highlights (
  id uuid primary key default gen_random_uuid(),
  car_id text not null references public.cars(id) on delete cascade,
  content jsonb not null check (private.valid_i18n(content)),
  sort_order integer not null default 0
);
create index car_highlights_car_idx on public.car_highlights(car_id, sort_order);

create table public.categories (
  id text primary key,
  slug text unique not null,
  name jsonb not null check (private.valid_i18n(name)),
  description jsonb check (description is null or private.valid_i18n(description)),
  parent_id text references public.categories(id) on delete restrict,
  icon text,
  image text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_categories_parent_id on public.categories(parent_id);
create index idx_categories_sort_order on public.categories(sort_order);
create index idx_categories_slug on public.categories(slug);

create table public.products (
  id text primary key,
  slug text not null unique,
  sku text not null unique,
  name jsonb not null check (private.valid_i18n(name)),
  category text not null,
  category_id text references public.categories(id) on delete set null,
  subcategory_id text references public.categories(id) on delete set null,
  brand text,
  price_minor bigint not null check (price_minor >= 0),
  currency text not null default 'ILS' check (currency ~ '^[A-Z]{3}$'),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  max_order_quantity integer not null default 10 check (max_order_quantity between 1 and 100),
  featured boolean not null default false,
  compatibility_summary text,
  description jsonb not null check (private.valid_i18n(description)),
  primary_image text,
  published boolean not null default true,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_public_idx on public.products(category, featured, stock_quantity) where published and archived_at is null;
create index products_category_id_idx on public.products(category_id) where published and archived_at is null;
create index products_subcategory_id_idx on public.products(subcategory_id) where published and archived_at is null;

create trigger validate_product_category_links
  before insert or update of category, category_id, subcategory_id on public.products
  for each row execute function private.validate_product_category_links();

create table public.product_media (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  url text not null,
  alt jsonb,
  sort_order integer not null default 0,
  unique(product_id, url)
);
create index product_media_product_idx on public.product_media(product_id, sort_order);

create table public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  label jsonb not null check (private.valid_i18n(label)),
  value jsonb not null check (private.valid_i18n(value)),
  sort_order integer not null default 0
);
create index product_specs_product_idx on public.product_specs(product_id, sort_order);

create table public.product_compatibility (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  make text,
  model text,
  year_from integer,
  year_to integer,
  notes text
);
create index product_compatibility_product_idx on public.product_compatibility(product_id);

create table public.blog_posts (
  id text primary key,
  slug text not null unique,
  title jsonb not null check (private.valid_i18n(title)),
  excerpt jsonb not null check (private.valid_i18n(excerpt)),
  content jsonb,
  author text not null,
  author_avatar text,
  read_time text,
  cover_image text,
  tags text[] not null default '{}',
  category text,
  featured boolean not null default false,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index blog_posts_public_idx on public.blog_posts(published_at desc) where published;

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'converted', 'abandoned')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index carts_active_user_idx on public.carts(user_id) where status = 'active';

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0 and quantity <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(cart_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references auth.users(id) on delete restrict,
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address jsonb not null,
  subtotal_minor bigint not null check (subtotal_minor >= 0),
  tax_minor bigint not null default 0 check (tax_minor >= 0),
  shipping_minor bigint not null default 0 check (shipping_minor >= 0),
  total_minor bigint not null check (total_minor >= 0),
  currency text not null default 'ILS' check (currency ~ '^[A-Z]{3}$'),
  status public.order_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  payment_method text not null default 'cod' check (payment_method in ('cod', 'bank_transfer')),
  tracking_number text,
  carrier text,
  estimated_delivery date,
  customer_notes text,
  admin_notes text,
  idempotency_key text not null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, idempotency_key)
);
create index orders_user_idx on public.orders(user_id, created_at desc);
create index orders_admin_idx on public.orders(status, created_at desc);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  product_id text references public.products(id) on delete set null,
  product_name jsonb not null,
  sku text not null,
  image text,
  unit_price_minor bigint not null check (unit_price_minor >= 0),
  quantity integer not null check (quantity > 0),
  line_total_minor bigint not null check (line_total_minor >= 0)
);
create index order_items_order_idx on public.order_items(order_id);

create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  from_status public.order_status,
  to_status public.order_status not null,
  note text,
  changed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index order_status_history_order_idx on public.order_status_history(order_id, created_at);

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete restrict,
  order_id uuid references public.orders(id) on delete restrict,
  quantity_delta integer not null check (quantity_delta <> 0),
  reason text not null check (reason in ('order_created', 'order_cancelled', 'manual_adjustment')),
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index inventory_movements_product_idx on public.inventory_movements(product_id, created_at desc);
create unique index inventory_cancel_once_idx on public.inventory_movements(order_id, product_id, reason) where reason = 'order_cancelled';

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  kind text not null default 'contact' check (kind in ('contact', 'car', 'product', 'import')),
  entity_id text,
  name text not null,
  email text not null,
  phone text,
  service text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'resolved', 'archived')),
  assigned_to uuid references auth.users(id) on delete set null,
  resolution_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_admin_idx on public.inquiries(status, created_at desc);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_value jsonb,
  after_value jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);
create index admin_audit_log_actor_idx on public.admin_audit_log(actor_id, created_at desc);

create table public.seed_runs (
  version text primary key,
  applied_at timestamptz not null default now(),
  details jsonb not null default '{}'
);

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles(id, email, display_name, username, phone, preferred_locale)
  values (
    new.id,
    coalesce(new.email, ''),
    left(coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', ''), 120),
    nullif(left(lower(regexp_replace(coalesce(new.raw_user_meta_data ->> 'username', ''), '[^a-zA-Z0-9_.-]', '', 'g')), 40), ''),
    nullif(left(coalesce(new.raw_user_meta_data ->> 'phone', ''), 40), ''),
    case when new.raw_user_meta_data ->> 'preferred_locale' in ('ar', 'en', 'he') then new.raw_user_meta_data ->> 'preferred_locale' else 'ar' end
  )
  on conflict(id) do update set email = excluded.email, updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert or update of email on auth.users
for each row execute function private.handle_new_user();

create or replace function private.restore_inventory_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_history(order_id, from_status, to_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;

  if old.status <> 'cancelled' and new.status = 'cancelled' then
    with restored as (
      select oi.product_id, sum(oi.quantity)::integer as quantity
      from public.order_items oi
      where oi.order_id = new.id and oi.product_id is not null
      group by oi.product_id
    ), inserted as (
      insert into public.inventory_movements(product_id, order_id, quantity_delta, reason, actor_id)
      select r.product_id, new.id, r.quantity, 'order_cancelled', auth.uid()
      from restored r
      on conflict do nothing
      returning product_id, quantity_delta
    )
    update public.products p
    set stock_quantity = p.stock_quantity + i.quantity_delta
    from inserted i
    where p.id = i.product_id;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_status_changed on public.orders;
create trigger orders_status_changed after update of status on public.orders
for each row execute function private.restore_inventory_on_cancel();

create or replace function public.create_order(
  p_items jsonb,
  p_address jsonb,
  p_idempotency_key text,
  p_customer_notes text default null,
  p_payment_method text default 'cod'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_existing public.orders%rowtype;
  v_profile public.profiles%rowtype;
  v_order public.orders%rowtype;
  v_subtotal bigint;
  v_tax_rate numeric;
  v_tax bigint;
  v_shipping bigint;
  v_free_shipping bigint;
  v_order_number text;
begin
  if v_user is null then raise exception 'authentication_required'; end if;
  if coalesce(length(p_idempotency_key), 0) < 12 or length(p_idempotency_key) > 120 then raise exception 'invalid_idempotency_key'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then raise exception 'invalid_items'; end if;
  if jsonb_typeof(p_address) <> 'object'
    or length(trim(coalesce(p_address ->> 'street', ''))) < 2
    or length(trim(coalesce(p_address ->> 'city', ''))) < 2
    or length(trim(coalesce(p_address ->> 'country', ''))) < 2
    or length(trim(coalesce(p_address ->> 'phone', ''))) < 5
  then raise exception 'invalid_address'; end if;
  if p_payment_method not in ('cod', 'bank_transfer') then raise exception 'invalid_payment_method'; end if;

  select * into v_existing from public.orders where user_id = v_user and idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('id', v_existing.id, 'orderNumber', v_existing.order_number, 'totalMinor', v_existing.total_minor, 'paymentStatus', v_existing.payment_status);
  end if;

  select p.* into v_profile from public.profiles p where p.id = v_user and p.status = 'active';
  if not found then raise exception 'account_unavailable'; end if;
  if not exists(select 1 from auth.users u where u.id = v_user and u.email_confirmed_at is not null) then raise exception 'email_confirmation_required'; end if;

  if exists (
    select 1 from jsonb_to_recordset(p_items) as x(product_id text, quantity integer)
    where x.product_id is null or x.quantity is null or x.quantity <= 0 or x.quantity > 100
  ) then raise exception 'invalid_quantity'; end if;

  perform p.id
  from public.products p
  join (
    select x.product_id, sum(x.quantity)::integer quantity
    from jsonb_to_recordset(p_items) as x(product_id text, quantity integer)
    group by x.product_id
  ) requested on requested.product_id = p.id
  order by p.id
  for update of p;

  if exists (
    select 1
    from (
      select x.product_id, sum(x.quantity)::integer quantity
      from jsonb_to_recordset(p_items) as x(product_id text, quantity integer)
      group by x.product_id
    ) requested
    left join public.products p on p.id = requested.product_id
    where p.id is null or not p.published or p.archived_at is not null
      or requested.quantity > p.max_order_quantity or requested.quantity > p.stock_quantity
  ) then raise exception 'product_unavailable_or_quantity_exceeded'; end if;

  select sum(p.price_minor * requested.quantity)::bigint into v_subtotal
  from (
    select x.product_id, sum(x.quantity)::integer quantity
    from jsonb_to_recordset(p_items) as x(product_id text, quantity integer)
    group by x.product_id
  ) requested
  join public.products p on p.id = requested.product_id;

  select coalesce((value ->> 'tax_rate_percent')::numeric, 17),
         coalesce((value ->> 'free_shipping_threshold_minor')::bigint, 50000)
    into v_tax_rate, v_free_shipping
  from public.site_settings_public where key = 'commerce';
  v_tax_rate := coalesce(v_tax_rate, 17);
  v_free_shipping := coalesce(v_free_shipping, 50000);
  v_tax := floor(v_subtotal * v_tax_rate / 100)::bigint;
  v_shipping := case when v_subtotal >= v_free_shipping then 0 else 5000 end;
  v_order_number := 'AF-' || to_char(now(), 'YYYYMM') || '-' || lpad(nextval('public.order_number_seq')::text, 6, '0');

  insert into public.orders(
    order_number, user_id, customer_name, customer_email, customer_phone,
    shipping_address, subtotal_minor, tax_minor, shipping_minor, total_minor,
    payment_method, payment_status, customer_notes, idempotency_key
  ) values (
    v_order_number, v_user,
    coalesce(nullif(trim(v_profile.display_name), ''), split_part(v_profile.email, '@', 1)),
    v_profile.email, left(p_address ->> 'phone', 40),
    jsonb_build_object(
      'fullName', left(coalesce(p_address ->> 'fullName', v_profile.display_name), 120),
      'phone', left(p_address ->> 'phone', 40),
      'street', left(p_address ->> 'street', 250),
      'city', left(p_address ->> 'city', 120),
      'country', left(p_address ->> 'country', 120),
      'postalCode', left(coalesce(p_address ->> 'postalCode', ''), 30)
    ),
    v_subtotal, v_tax, v_shipping, v_subtotal + v_tax + v_shipping,
    p_payment_method, 'unpaid', nullif(left(coalesce(p_customer_notes, ''), 1000), ''), p_idempotency_key
  ) returning * into v_order;

  insert into public.order_items(order_id, product_id, product_name, sku, image, unit_price_minor, quantity, line_total_minor)
  select v_order.id, p.id, p.name, p.sku, p.primary_image, p.price_minor, requested.quantity, p.price_minor * requested.quantity
  from (
    select x.product_id, sum(x.quantity)::integer quantity
    from jsonb_to_recordset(p_items) as x(product_id text, quantity integer)
    group by x.product_id
  ) requested
  join public.products p on p.id = requested.product_id;

  with requested as (
    select x.product_id, sum(x.quantity)::integer quantity
    from jsonb_to_recordset(p_items) as x(product_id text, quantity integer)
    group by x.product_id
  ), changed as (
    update public.products p set stock_quantity = p.stock_quantity - r.quantity
    from requested r where p.id = r.product_id
    returning p.id, r.quantity
  )
  insert into public.inventory_movements(product_id, order_id, quantity_delta, reason, actor_id)
  select id, v_order.id, -quantity, 'order_created', v_user from changed;

  insert into public.order_status_history(order_id, to_status, note, changed_by)
  values (v_order.id, 'pending', 'Order received without online payment', v_user);

  delete from public.cart_items ci
  using public.carts c
  where ci.cart_id = c.id and c.user_id = v_user and c.status = 'active';

  return jsonb_build_object('id', v_order.id, 'orderNumber', v_order.order_number, 'totalMinor', v_order.total_minor, 'paymentStatus', v_order.payment_status);
end;
$$;

revoke all on function public.create_order(jsonb, jsonb, text, text, text) from public, anon;
grant execute on function public.create_order(jsonb, jsonb, text, text, text) to authenticated;

-- Keep timestamps consistent.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','addresses','admin_memberships','site_settings_public','site_settings_private',
    'page_sections','policy_pages','seo_entries','cars','categories','products','blog_posts',
    'carts','cart_items','orders','inquiries'
  ] loop
    execute format('drop trigger if exists set_updated_at on public.%I', table_name);
    execute format('create trigger set_updated_at before update on public.%I for each row execute function private.set_updated_at()', table_name);
  end loop;
end $$;

-- RLS is enabled on every public table, including server-only tables.
do $$
declare table_name text;
begin
  foreach table_name in array array[
    'profiles','addresses','admin_memberships','admin_sessions','site_content','site_settings_public',
    'site_settings_private','page_sections','policy_pages','seo_entries','cars','car_media','car_highlights',
    'categories','products','product_media','product_specs','product_compatibility','blog_posts','carts','cart_items',
    'orders','order_items','order_status_history','inventory_movements','inquiries','admin_audit_log','seed_runs'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
  end loop;
end $$;

create policy profiles_select_own on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy addresses_own on public.addresses for select to authenticated using ((select auth.uid()) = user_id);
create policy addresses_insert_own on public.addresses for insert to authenticated with check ((select auth.uid()) = user_id);
create policy addresses_update_own on public.addresses for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy addresses_delete_own on public.addresses for delete to authenticated using ((select auth.uid()) = user_id);

create policy public_settings_read on public.site_settings_public for select to anon, authenticated using (true);
create policy page_sections_read on public.page_sections for select to anon, authenticated using (published);
create policy policy_pages_read on public.policy_pages for select to anon, authenticated using (published);
create policy seo_entries_read on public.seo_entries for select to anon, authenticated using (indexable);
create policy cars_read on public.cars for select to anon, authenticated using (published and archived_at is null);
create policy car_media_read on public.car_media for select to anon, authenticated using (exists(select 1 from public.cars c where c.id = car_id and c.published and c.archived_at is null));
create policy car_highlights_read on public.car_highlights for select to anon, authenticated using (exists(select 1 from public.cars c where c.id = car_id and c.published and c.archived_at is null));
create policy categories_public_read on public.categories for select to anon, authenticated using (is_active);
create policy categories_admin_all on public.categories
  for all to authenticated
  using (exists(select 1 from public.admin_memberships m where m.user_id = (select auth.uid()) and m.active = true))
  with check (exists(select 1 from public.admin_memberships m where m.user_id = (select auth.uid()) and m.active = true));
create policy products_read on public.products for select to anon, authenticated using (published and archived_at is null);
create policy product_media_read on public.product_media for select to anon, authenticated using (exists(select 1 from public.products p where p.id = product_id and p.published and p.archived_at is null));
create policy product_specs_read on public.product_specs for select to anon, authenticated using (exists(select 1 from public.products p where p.id = product_id and p.published and p.archived_at is null));
create policy product_compatibility_read on public.product_compatibility for select to anon, authenticated using (exists(select 1 from public.products p where p.id = product_id and p.published and p.archived_at is null));
create policy blog_posts_read on public.blog_posts for select to anon, authenticated using (published and published_at <= now());

create policy carts_own on public.carts for select to authenticated using ((select auth.uid()) = user_id);
create policy carts_insert_own on public.carts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy carts_update_own on public.carts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy cart_items_own on public.cart_items for select to authenticated using (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));
create policy cart_items_insert_own on public.cart_items for insert to authenticated with check (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()) and c.status = 'active') and exists(select 1 from public.products p where p.id = product_id and p.published and p.archived_at is null and quantity <= p.max_order_quantity));
create policy cart_items_update_own on public.cart_items for update to authenticated using (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()))) with check (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid()) and c.status = 'active') and exists(select 1 from public.products p where p.id = product_id and quantity <= p.max_order_quantity));
create policy cart_items_delete_own on public.cart_items for delete to authenticated using (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = (select auth.uid())));

create policy orders_read_own on public.orders for select to authenticated using ((select auth.uid()) = user_id);
create policy order_items_read_own on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy order_history_read_own on public.order_status_history for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy inquiries_read_own on public.inquiries for select to authenticated using ((select auth.uid()) = user_id);

-- Explicit Data API grants (new Supabase projects no longer auto-expose tables).
revoke all on all tables in schema public from anon, authenticated;
grant select on public.site_settings_public, public.page_sections, public.policy_pages, public.seo_entries,
  public.cars, public.car_media, public.car_highlights, public.categories, public.products, public.product_media,
  public.product_specs, public.product_compatibility, public.blog_posts to anon, authenticated;
grant select on public.profiles, public.addresses, public.carts, public.cart_items, public.orders,
  public.order_items, public.order_status_history, public.inquiries to authenticated;
grant update(display_name, username, phone, preferred_locale, avatar_url) on public.profiles to authenticated;
grant insert, update, delete on public.addresses, public.carts, public.cart_items to authenticated;
grant usage, select on sequence public.order_number_seq to service_role;

grant usage on schema public to anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
revoke all on all functions in schema public from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.valid_i18n(jsonb) to service_role;
grant execute on function public.create_order(jsonb, jsonb, text, text, text) to authenticated;

-- Incremental order lifecycle objects are defined in
-- supabase/migrations/20260911000000_order_lifecycle.sql and were applied through the Supabase MCP.
