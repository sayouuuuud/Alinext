-- ALI FLEET Categories and Subcategories Migration
-- Creates the categories table with self-referencing hierarchy (parent_id)

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

-- Indexing for fast hierarchy and sorting lookups
create index if not exists idx_categories_parent_id on public.categories(parent_id);
create index if not exists idx_categories_sort_order on public.categories(sort_order);
create index if not exists idx_categories_slug on public.categories(slug);

-- Enable RLS
alter table public.categories enable row level security;

-- Drop existing policies if any to ensure clean apply
drop policy if exists "categories_select_public" on public.categories;
drop policy if exists "categories_admin_all" on public.categories;

-- RLS Policies: Public can read active categories
create policy "categories_select_public" on public.categories
  for select using (true);

-- Admin full access policy
create policy "categories_admin_all" on public.categories
  for all using (
    auth.role() = 'service_role' or
    exists (
      select 1 from public.admin_memberships
      where user_id = auth.uid() and active = true
    )
  );

-- Trigger for updated_at
drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
  before update on public.categories
  for each row execute function private.set_updated_at();

-- Add category_id and subcategory_id to products if they don't exist
alter table public.products add column if not exists category_id text references public.categories(id) on delete set null;
alter table public.products add column if not exists subcategory_id text references public.categories(id) on delete set null;

-- Seed default Main Categories & Subcategories
insert into public.categories (id, slug, name, description, parent_id, icon, sort_order, is_active)
values
  -- Main Categories (parent_id = null)
  ('brakes', 'brakes', '{"ar": "نظام الفرامل والمكابح", "en": "Brakes & Braking System", "he": "מערכת בלמים"}'::jsonb, '{"ar": "أقراص، وسادات، وأنظمة الأمان للفرامل", "en": "Brake discs, pads, and safety systems", "he": "רפידות, צלחות בלם ומערכות בטיחות"}'::jsonb, null, 'ShieldAlert', 10, true),
  ('engine', 'engine', '{"ar": "المحركات ومكوناتها", "en": "Engine & Mechanical Parts", "he": "מנוע וחלקים מכניים"}'::jsonb, '{"ar": "قطع غيار المحرك الأساسية والملحقات", "en": "Core engine components and accessories", "he": "חלקי מנוע עיקריים ואביזרים"}'::jsonb, null, 'Flame', 20, true),
  ('lighting', 'lighting', '{"ar": "أنظمة الإضاءة", "en": "Lighting & Lamps", "he": "מערכות תאורה"}'::jsonb, '{"ar": "مصابيح أمامية وخلفية وإضاءة LED ذكية", "en": "Headlights, taillights, and smart LED lighting", "he": "פנסים ראשיים, פנסים אחוריים ותאורת לד"}'::jsonb, null, 'Lightbulb', 30, true),
  ('wheels', 'wheels', '{"ar": "العجلات والإطارات", "en": "Wheels & Tires", "he": "גלגלים וצמיגים"}'::jsonb, '{"ar": "جنوط رياضية وإطارات بمقاسات مختلفة", "en": "Alloy rims and tires for all conditions", "he": "חישוקי סגסוגת וצמיגים מובחרים"}'::jsonb, null, 'Disc', 40, true),
  ('transmission', 'transmission', '{"ar": "ناقل الحركة والدفع", "en": "Transmission & Drivetrain", "he": "תיבת הילוכים והנעה"}'::jsonb, '{"ar": "جيرات، كلتشات، ومحاور الدفع", "en": "Gearboxes, clutches, and driveshafts", "he": "תיבות הילוכים, מצמדים וצירי הנעה"}'::jsonb, null, 'Cog', 50, true),
  ('filters', 'filters', '{"ar": "الفلاتر والزيوت", "en": "Filters & Lubricants", "he": "מסננים ושמנים"}'::jsonb, '{"ar": "فلاتر هواء، زيت، ووقود", "en": "Air, oil, fuel and cabin filters", "he": "מסנני אוויר, שמן ודלק"}'::jsonb, null, 'Filter', 60, true),
  ('suspension', 'suspension', '{"ar": "المساعدات ونظام التعليق", "en": "Suspension & Steering", "he": "מתלים והיגוי"}'::jsonb, '{"ar": "ممتصات صدمات، أذرع تحكم، ومساعدات هوائية", "en": "Shock absorbers, control arms, and air suspension", "he": "בולמי זעזועים, זרועות בקרה ומתלי אוויר"}'::jsonb, null, 'Layers', 70, true),
  ('electrical', 'electrical', '{"ar": "الكهرباء والإلكترونيات", "en": "Electrical & Electronics", "he": "חשמל ואלקטרוניקה"}'::jsonb, '{"ar": "بطاريات، حساسات، ووحدات تحكم إلكترونية", "en": "Batteries, sensors, and ECUs", "he": "מצברים, חיישנים ויחידות בקרה"}'::jsonb, null, 'Zap', 80, true),
  ('accessories', 'accessories', '{"ar": "إكسسوارات وتجهيزات", "en": "Accessories & Equipment", "he": "אביזרים ושדרוגים"}'::jsonb, '{"ar": "تجهيزات داخلية وخارجية ولمسات رفاهية", "en": "Interior and exterior upgrades", "he": "שדרוגים פנימיים וחיצוניים לרכב"}'::jsonb, null, 'Sparkles', 90, true),

  -- Subcategories under brakes
  ('brake-pads', 'brake-pads', '{"ar": "أقمشة ووسادات الفرامل", "en": "Brake Pads", "he": "רפידות בלם"}'::jsonb, '{"ar": "وسادات سيراميك وشبه معدنية أصلية", "en": "Ceramic and semi-metallic brake pads", "he": "רפידות קרמיות מקוריות"}'::jsonb, 'brakes', null, 11, true),
  ('brake-rotors', 'brake-rotors', '{"ar": "ديسكات وهوبات الفرامل", "en": "Brake Rotors & Discs", "he": "צלחות בלם"}'::jsonb, '{"ar": "أقراص فرامل مهواة ومثقبة عالية الأداء", "en": "Ventilated and drilled performance rotors", "he": "צלחות בלם מאווררות בעלות ביצועים גבוהים"}'::jsonb, 'brakes', null, 12, true),
  ('brake-calipers', 'brake-calipers', '{"ar": "كليبرات ومضخات الفرامل", "en": "Calipers & Fluid", "he": "קליפרים ונוזלי בלם"}'::jsonb, null, 'brakes', null, 13, true),

  -- Subcategories under engine
  ('spark-plugs', 'spark-plugs', '{"ar": "شمعات الاحتراق (بواجي)", "en": "Spark Plugs", "he": "מצתים (פלאגים)"}'::jsonb, null, 'engine', null, 21, true),
  ('engine-sensors', 'engine-sensors', '{"ar": "حساسات المحرك", "en": "Engine Sensors", "he": "חיישני מנוע"}'::jsonb, null, 'engine', null, 22, true),
  ('cooling-pumps', 'cooling-pumps', '{"ar": "مضخات المياه والتبريد", "en": "Water & Cooling Pumps", "he": "משאבות מים וקירור"}'::jsonb, null, 'engine', null, 23, true),

  -- Subcategories under lighting
  ('headlights', 'headlights', '{"ar": "مصابيح أمامية LED / Laser", "en": "Headlights", "he": "פנסים ראשיים"}'::jsonb, null, 'lighting', null, 31, true),
  ('taillights', 'taillights', '{"ar": "مصابيح خلفية", "en": "Taillights", "he": "פנסים אחוריים"}'::jsonb, null, 'lighting', null, 32, true),

  -- Subcategories under filters
  ('oil-filters', 'oil-filters', '{"ar": "فلاتر الزيت", "en": "Oil Filters", "he": "מסנני שמן"}'::jsonb, null, 'filters', null, 61, true),
  ('air-filters', 'air-filters', '{"ar": "فلاتر الهواء والمكيف", "en": "Air & Cabin Filters", "he": "מסנני אוויר ומזגן"}'::jsonb, null, 'filters', null, 62, true)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  parent_id = excluded.parent_id,
  icon = excluded.icon,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- Sync existing products to categories if matching
update public.products
set category_id = category
where category_id is null and category in (select id from public.categories);
