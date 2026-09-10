alter table public.addresses add column if not exists company text;
alter table public.addresses add column if not exists address_line_2 text;
alter table public.addresses add column if not exists state text;
