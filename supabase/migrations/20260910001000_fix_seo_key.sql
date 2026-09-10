drop index if exists public.seo_entries_entity_idx;
update public.seo_entries set entity_id = '' where entity_id is null;
alter table public.seo_entries alter column entity_id set default '';
alter table public.seo_entries alter column entity_id set not null;
create unique index seo_entries_entity_idx on public.seo_entries(entity_type, entity_id, locale);
