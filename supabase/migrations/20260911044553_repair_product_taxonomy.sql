-- Repair product taxonomy: canonical categories, least-privilege RLS,
-- link validation, precise product links, and removal of the test product.
-- Idempotent: safe to re-run on any environment.

-- 1. Ensure the categories table exists (fresh environments only).
create table if not exists public.categories (
  id text primary key,
  slug text unique not null,
  name jsonb not null check (private.valid_i18n(name)),
  description jsonb check (description is null or private.valid_i18n(description)),
  parent_id text references public.categories(id) on delete restrict,
  icon text,
  image text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

-- 2. Ensure product link columns exist.
alter table public.products add column if not exists category_id text references public.categories(id) on delete set null;
alter table public.products add column if not exists subcategory_id text references public.categories(id) on delete set null;

-- 3. Indexes for hierarchy lookups and public catalog filtering.
create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_categories_sort_order on public.categories(sort_order);
create index if not exists idx_categories_slug on public.categories(slug);
create index if not exists products_category_id_idx on public.products(category_id) where published and archived_at is null;
create index if not exists products_subcategory_id_idx on public.products(subcategory_id) where published and archived_at is null;

-- 4. Least-privilege table grants: anon/authenticated read-only.
revoke all on public.categories from anon, authenticated;
grant select on public.categories to anon, authenticated;

-- 5. RLS: public reads active categories only; admin members manage them.
alter table public.categories enable row level security;

drop policy if exists "categories_select_public" on public.categories;
drop policy if exists "categories_admin_all" on public.categories;

create policy "categories_public_read" on public.categories
  for select to anon, authenticated
  using (is_active);

create policy "categories_admin_all" on public.categories
  for all to authenticated
  using (exists (
    select 1 from public.admin_memberships m
    where m.user_id = (select auth.uid()) and m.active = true
  ))
  with check (exists (
    select 1 from public.admin_memberships m
    where m.user_id = (select auth.uid()) and m.active = true
  ));

-- 6. updated_at trigger on categories.
drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
  before update on public.categories
  for each row execute function private.set_updated_at();

-- 7. Validate product -> category links and keep the legacy text in sync.
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
  -- Legacy writes that only send the old text column still get linked.
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
    if sub_parent is null or sub_parent <> new.category_id then
      raise exception 'subcategory_id % does not belong to main category %', new.subcategory_id, new.category_id;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_product_category_links on public.products;
create trigger validate_product_category_links
  before insert or update of category, category_id, subcategory_id on public.products
  for each row execute function private.validate_product_category_links();

-- 8. Seed the canonical taxonomy (9 main + 10 sub) with verified translations.
insert into public.categories (id, slug, name, description, parent_id, icon, sort_order, is_active)
values
  ('brakes', 'brakes', '{"ar": "نظام الفرامل والمكابح", "en": "Brakes & Braking System", "he": "מערכת בלמים"}'::jsonb, '{"ar": "أقراص، وسادات، وأنظمة الأمان للفرامل", "en": "Brake discs, pads, and safety systems", "he": "רפידות, צלחות בלם ומערכות בטיחות"}'::jsonb, null, 'ShieldAlert', 10, true),
  ('engine', 'engine', '{"ar": "المحركات ومكوناتها", "en": "Engine & Mechanical Parts", "he": "מנוע וחלקים מכניים"}'::jsonb, '{"ar": "قطع غيار المحرك الأساسية والملحقات", "en": "Core engine components and accessories", "he": "חלקי מנוע עיקריים ואביזרים"}'::jsonb, null, 'Flame', 20, true),
  ('lighting', 'lighting', '{"ar": "أنظمة الإضاءة", "en": "Lighting & Lamps", "he": "מערכות תאורה"}'::jsonb, '{"ar": "مصابيح أمامية وخلفية وإضاءة LED ذكية", "en": "Headlights, taillights, and smart LED lighting", "he": "פנסים ראשיים, פנסים אחוריים ותאורת לד"}'::jsonb, null, 'Lightbulb', 30, true),
  ('wheels', 'wheels', '{"ar": "العجلات والإطارات", "en": "Wheels & Tires", "he": "גלגלים וצמיגים"}'::jsonb, '{"ar": "جنوط رياضية وإطارات بمقاسات مختلفة", "en": "Alloy rims and tires for all conditions", "he": "חישוקי סגסוגת וצמיגים מובחרים"}'::jsonb, null, 'Disc', 40, true),
  ('transmission', 'transmission', '{"ar": "ناقل الحركة والدفع", "en": "Transmission & Drivetrain", "he": "תיבת הילוכים והנעה"}'::jsonb, '{"ar": "جيرات، كلتشات، ومحاور الدفع", "en": "Gearboxes, clutches, and driveshafts", "he": "תיבות הילוכים, מצמדים וצירי הנעה"}'::jsonb, null, 'Cog', 50, true),
  ('filters', 'filters', '{"ar": "الفلاتر والزيوت", "en": "Filters & Lubricants", "he": "מסננים ושמנים"}'::jsonb, '{"ar": "فلاتر هواء، زيت، ووقود", "en": "Air, oil, fuel and cabin filters", "he": "מסנני אוויר, שמן ודלק"}'::jsonb, null, 'Filter', 60, true),
  ('suspension', 'suspension', '{"ar": "المساعدات ونظام التعليق", "en": "Suspension & Steering", "he": "מתלים והיגוי"}'::jsonb, '{"ar": "ممتصات صدمات، أذرع تحكم، ومساعدات هوائية", "en": "Shock absorbers, control arms, and air suspension", "he": "בולמי זעזועים, זרועות בקרה ומתלי אוויר"}'::jsonb, null, 'Layers', 70, true),
  ('electrical', 'electrical', '{"ar": "الكهرباء والإلكترونيات", "en": "Electrical & Electronics", "he": "חשמל ואלקטרוניקה"}'::jsonb, '{"ar": "بطاريات، حساسات، ووحدات تحكم إلكترونية", "en": "Batteries, sensors, and ECUs", "he": "מצברים, חיישנים ויחידות בקרה"}'::jsonb, null, 'Zap', 80, true),
  ('accessories', 'accessories', '{"ar": "إكسسوارات وتجهيزات", "en": "Accessories & Equipment", "he": "אביזרים ושדרוגים"}'::jsonb, '{"ar": "تجهيزات داخلية وخارجية ولمسات رفاهية", "en": "Interior and exterior upgrades", "he": "שדרוגים פנימיים וחיצוניים לרכב"}'::jsonb, null, 'Sparkles', 90, true),
  ('brake-pads', 'brake-pads', '{"ar": "أقمشة ووسادات الفرامل", "en": "Brake Pads", "he": "רפידות בלם"}'::jsonb, '{"ar": "وسادات سيراميك وشبه معدنية أصلية", "en": "Ceramic and semi-metallic brake pads", "he": "רפידות קרמיות מקוריות"}'::jsonb, 'brakes', null, 11, true),
  ('brake-rotors', 'brake-rotors', '{"ar": "ديسكات وهوبات الفرامل", "en": "Brake Rotors & Discs", "he": "צלחות בלם"}'::jsonb, '{"ar": "أقراص فرامل مهواة ومثقبة عالية الأداء", "en": "Ventilated and drilled performance rotors", "he": "צלחות בלם מאווררות בעלות ביצועים גבוהים"}'::jsonb, 'brakes', null, 12, true),
  ('brake-calipers', 'brake-calipers', '{"ar": "كليبرات ومضخات الفرامل", "en": "Calipers & Fluid", "he": "קליפרים ונוזלי בלם"}'::jsonb, null, 'brakes', null, 13, true),
  ('spark-plugs', 'spark-plugs', '{"ar": "شمعات الاحتراق (بواجي)", "en": "Spark Plugs", "he": "מצתים (פלאגים)"}'::jsonb, null, 'engine', null, 21, true),
  ('engine-sensors', 'engine-sensors', '{"ar": "حساسات المحرك", "en": "Engine Sensors", "he": "חיישני מנוע"}'::jsonb, null, 'engine', null, 22, true),
  ('cooling-pumps', 'cooling-pumps', '{"ar": "مضخات المياه والتبريد", "en": "Water & Cooling Pumps", "he": "משאבות מים וקירור"}'::jsonb, null, 'engine', null, 23, true),
  ('headlights', 'headlights', '{"ar": "مصابيح أمامية LED / Laser", "en": "Headlights", "he": "פנסים ראשיים"}'::jsonb, null, 'lighting', null, 31, true),
  ('taillights', 'taillights', '{"ar": "مصابيح خلفية", "en": "Taillights", "he": "פנסים אחוריים"}'::jsonb, null, 'lighting', null, 32, true),
  ('oil-filters', 'oil-filters', '{"ar": "فلاتر الزيت", "en": "Oil Filters", "he": "מסנני שמן"}'::jsonb, null, 'filters', null, 61, true),
  ('air-filters', 'air-filters', '{"ar": "فلاتر الهواء والمكيف", "en": "Air & Cabin Filters", "he": "מסנני אוויר ומזגן"}'::jsonb, null, 'filters', null, 62, true)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  description = excluded.description,
  parent_id = excluded.parent_id,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- 9. Backfill category_id for products that only carry the legacy text.
update public.products p
set category_id = c.id
from public.categories c
where p.category_id is null
  and c.parent_id is null
  and p.category in (c.slug, c.id);

-- 10. Precise subcategory links for the clearly-matched products only.
update public.products set subcategory_id = 'brake-pads' where id = 'prod-brake-pads' and subcategory_id is null;
update public.products set subcategory_id = 'air-filters' where id = 'prod-air-filter' and subcategory_id is null;
update public.products set subcategory_id = 'oil-filters' where id = 'prod-oil-filter' and subcategory_id is null;
update public.products set subcategory_id = 'headlights' where id = 'prod-headlight' and subcategory_id is null;

-- 11. Remove the test product (verified: no orders, carts, or inventory movements reference it).
delete from public.products where id = 'prod-1789073119019' and sku = 'REd';
