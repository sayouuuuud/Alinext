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
