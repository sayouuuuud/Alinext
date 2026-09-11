begin;

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.orders(id) on delete cascade,
  event_type text not null check (event_type in ('order_received','order_confirmed','order_processing','order_shipping','order_delivered','order_completed','order_cancelled')),
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (order_id, event_type)
);

create table if not exists public.notification_email_outbox (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null unique references public.notifications(id) on delete cascade,
  recipient text not null,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz not null default now(),
  locked_at timestamptz,
  provider_message_id text,
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.notification_email_outbox add column if not exists locked_at timestamptz;

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_status public.payment_status,
  to_status public.payment_status not null,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  payment_method text,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;
create index if not exists notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index if not exists orders_user_created_idx on public.orders (user_id, created_at desc);
create index if not exists order_status_history_order_created_idx on public.order_status_history (order_id, created_at);
create index if not exists payment_events_user_created_idx on public.payment_events (user_id, created_at desc);
create index if not exists payment_events_order_created_idx on public.payment_events (order_id, created_at);
create index if not exists notification_outbox_ready_idx on public.notification_email_outbox (next_attempt_at, created_at) where status in ('pending','failed');
create unique index if not exists inventory_movements_cancel_once_idx on public.inventory_movements (order_id, product_id, reason) where reason = 'order_cancelled';

alter table public.notifications enable row level security;
alter table public.notification_email_outbox enable row level security;
alter table public.payment_events enable row level security;
alter table public.order_status_history enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists payment_events_select_own on public.payment_events;
create policy payment_events_select_own on public.payment_events for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists order_history_read_own on public.order_status_history;
drop policy if exists order_status_history_select_own on public.order_status_history;
create policy order_status_history_select_own on public.order_status_history for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_status_history.order_id and o.user_id = (select auth.uid()))
);

revoke all on public.notifications from public, anon, authenticated;
grant select on public.notifications to authenticated;
grant all on public.notifications to service_role;
revoke all on public.notification_email_outbox from public, anon, authenticated;
grant all on public.notification_email_outbox to service_role;
revoke all on public.payment_events from public, anon, authenticated;
grant select on public.payment_events to authenticated;
grant all on public.payment_events to service_role;

create or replace function private.restore_inventory_on_cancel()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.status <> 'cancelled' and new.status = 'cancelled' then
    with restored as (
      select oi.product_id, sum(oi.quantity)::integer as quantity
      from public.order_items oi
      where oi.order_id = new.id and oi.product_id is not null
      group by oi.product_id
    ), inserted as (
      insert into public.inventory_movements(product_id, order_id, quantity_delta, reason, actor_id)
      select r.product_id, new.id, r.quantity, 'order_cancelled', nullif(current_setting('app.changed_by', true), '')::uuid
      from restored r
      on conflict do nothing
      returning product_id, quantity_delta
    )
    update public.products p set stock_quantity = p.stock_quantity + i.quantity_delta
    from inserted i where p.id = i.product_id;
  end if;
  return new;
end;
$$;

create or replace function public.order_event_type(p_status public.order_status)
returns text language sql immutable set search_path = ''
as $$
  select case p_status
    when 'pending' then 'order_received'
    when 'confirmed' then 'order_confirmed'
    when 'processing' then 'order_processing'
    when 'shipping' then 'order_shipping'
    when 'delivered' then 'order_delivered'
    when 'completed' then 'order_completed'
    when 'cancelled' then 'order_cancelled'
  end
$$;

create or replace function private.record_order_lifecycle_event()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_changed_by uuid := nullif(current_setting('app.changed_by', true), '')::uuid;
  v_note text := nullif(current_setting('app.change_note', true), '');
  v_notification_id uuid;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then return new; end if;
  if tg_op = 'UPDATE' then
    insert into public.order_status_history (order_id, from_status, to_status, note, changed_by)
    values (new.id, old.status, new.status, v_note, v_changed_by);
  end if;
  insert into public.notifications (user_id, order_id, event_type, payload)
  values (new.user_id, new.id, public.order_event_type(new.status), jsonb_strip_nulls(jsonb_build_object(
    'orderNumber', new.order_number, 'status', new.status, 'carrier', new.carrier,
    'trackingNumber', new.tracking_number, 'estimatedDelivery', new.estimated_delivery, 'note', v_note
  )))
  on conflict (order_id, event_type) do update set payload = excluded.payload
  returning id into v_notification_id;
  insert into public.notification_email_outbox (notification_id, recipient)
  values (v_notification_id, new.customer_email)
  on conflict (notification_id) do nothing;
  return new;
end;
$$;

create or replace function private.record_order_payment_event()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  v_changed_by uuid := nullif(current_setting('app.changed_by', true), '')::uuid;
  v_note text := nullif(current_setting('app.change_note', true), '');
begin
  if tg_op = 'UPDATE' and new.payment_status is not distinct from old.payment_status then return new; end if;
  insert into public.payment_events (order_id, user_id, from_status, to_status, amount_minor, currency, payment_method, changed_by, note)
  values (new.id, new.user_id, case when tg_op = 'INSERT' then null else old.payment_status end, new.payment_status, new.total_minor, new.currency, new.payment_method, v_changed_by, v_note);
  return new;
end;
$$;

drop trigger if exists orders_lifecycle_event on public.orders;
create trigger orders_lifecycle_event after insert or update of status on public.orders for each row execute function private.record_order_lifecycle_event();
drop trigger if exists orders_payment_event on public.orders;
create trigger orders_payment_event after insert or update of payment_status on public.orders for each row execute function private.record_order_payment_event();

create or replace function private.assert_order_transition(p_from public.order_status, p_to public.order_status)
returns void language plpgsql immutable set search_path = ''
as $$
begin
  if p_from = p_to then return; end if;
  if not (
    (p_from = 'pending' and p_to in ('confirmed','cancelled')) or
    (p_from = 'confirmed' and p_to in ('processing','cancelled')) or
    (p_from = 'processing' and p_to in ('shipping','cancelled')) or
    (p_from = 'shipping' and p_to = 'delivered') or
    (p_from = 'delivered' and p_to = 'completed')
  ) then raise exception 'invalid_order_transition' using errcode = '22023'; end if;
end;
$$;

create or replace function private.assert_payment_transition(p_from public.payment_status, p_to public.payment_status)
returns void language plpgsql immutable set search_path = ''
as $$
begin
  if p_from = p_to then return; end if;
  if not ((p_from = 'unpaid' and p_to = 'paid') or (p_from = 'paid' and p_to = 'refunded')) then
    raise exception 'invalid_payment_transition' using errcode = '22023';
  end if;
end;
$$;

create or replace function public.admin_update_order(
  p_order_id uuid,
  p_status public.order_status default null,
  p_payment_status public.payment_status default null,
  p_carrier text default null,
  p_tracking_number text default null,
  p_estimated_delivery date default null,
  p_admin_notes text default null,
  p_note text default null,
  p_changed_by uuid default null
)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_status public.order_status;
  v_payment_status public.payment_status;
  v_carrier text;
  v_tracking text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  v_status := coalesce(p_status, v_order.status);
  v_payment_status := coalesce(p_payment_status, v_order.payment_status);
  v_carrier := case when p_carrier is null then v_order.carrier else nullif(trim(p_carrier), '') end;
  v_tracking := case when p_tracking_number is null then v_order.tracking_number else nullif(trim(p_tracking_number), '') end;
  perform private.assert_order_transition(v_order.status, v_status);
  perform private.assert_payment_transition(v_order.payment_status, v_payment_status);
  if v_status = 'shipping' and (v_carrier is null or v_tracking is null) then
    raise exception 'shipping_details_required' using errcode = '22023';
  end if;
  perform set_config('app.changed_by', coalesce(p_changed_by::text, ''), true);
  perform set_config('app.change_note', coalesce(left(trim(p_note), 500), ''), true);
  update public.orders set
    status = v_status,
    payment_status = v_payment_status,
    carrier = v_carrier,
    tracking_number = v_tracking,
    estimated_delivery = case when p_estimated_delivery is not null then p_estimated_delivery else estimated_delivery end,
    admin_notes = case when p_admin_notes is not null then left(p_admin_notes, 2000) else admin_notes end
  where id = p_order_id returning * into v_order;
  return jsonb_build_object('id', v_order.id, 'orderNumber', v_order.order_number, 'status', v_order.status, 'paymentStatus', v_order.payment_status, 'carrier', v_order.carrier, 'trackingNumber', v_order.tracking_number, 'estimatedDelivery', v_order.estimated_delivery, 'updatedAt', v_order.updated_at);
end;
$$;

create or replace function public.cancel_order(p_order_id uuid, p_reason text)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_order public.orders%rowtype;
  v_reason text := left(trim(coalesce(p_reason, '')), 500);
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  if v_reason = '' then raise exception 'cancellation_reason_required' using errcode = '22023'; end if;
  select * into v_order from public.orders where id = p_order_id and user_id = v_user for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  if v_order.status <> 'pending' then raise exception 'cancel_not_allowed' using errcode = '22023'; end if;
  perform set_config('app.changed_by', v_user::text, true);
  perform set_config('app.change_note', v_reason, true);
  update public.orders set status = 'cancelled' where id = p_order_id;
  return jsonb_build_object('id', p_order_id, 'status', 'cancelled');
end;
$$;

create or replace function public.confirm_order_received(p_order_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_order public.orders%rowtype;
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  select * into v_order from public.orders where id = p_order_id and user_id = v_user for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  if v_order.status <> 'delivered' then raise exception 'confirmation_not_allowed' using errcode = '22023'; end if;
  perform set_config('app.changed_by', v_user::text, true);
  perform set_config('app.change_note', 'customer_confirmed_receipt', true);
  update public.orders set status = 'completed' where id = p_order_id;
  return jsonb_build_object('id', p_order_id, 'status', 'completed');
end;
$$;

create or replace function public.mark_notifications_read(p_notification_id uuid default null)
returns integer language plpgsql security definer set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_count integer;
begin
  if v_user is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  update public.notifications set read_at = coalesce(read_at, now())
  where user_id = v_user and (p_notification_id is null or id = p_notification_id);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

drop function if exists public.claim_notification_email_batch(integer);
create function public.claim_notification_email_batch(p_limit integer default 10)
returns table (outbox_id uuid, notification_id uuid, recipient text, event_type text, payload jsonb, preferred_locale text, order_id uuid, order_number text)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 50 then raise exception 'invalid_batch_limit' using errcode = '22023'; end if;
  update public.notification_email_outbox
  set status = 'failed', locked_at = null, next_attempt_at = now(), last_error_code = 'lease_expired', updated_at = now()
  where status = 'processing' and locked_at < now() - interval '15 minutes';
  return query
  with candidates as (
    select o.id from public.notification_email_outbox o
    where o.status in ('pending','failed') and o.next_attempt_at <= now() and o.attempt_count < 6
    order by o.next_attempt_at, o.created_at for update skip locked limit p_limit
  ), claimed as (
    update public.notification_email_outbox o
    set status = 'processing', attempt_count = o.attempt_count + 1, locked_at = now(), updated_at = now(), last_error_code = null
    from candidates c where o.id = c.id returning o.id, o.notification_id, o.recipient
  )
  select c.id, c.notification_id, c.recipient, n.event_type, n.payload, coalesce(p.preferred_locale, 'ar'), ord.id, ord.order_number
  from claimed c
  join public.notifications n on n.id = c.notification_id
  join public.orders ord on ord.id = n.order_id
  left join public.profiles p on p.id = n.user_id;
end;
$$;

create or replace function public.complete_notification_email(p_outbox_id uuid, p_provider_message_id text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_count integer;
begin
  update public.notification_email_outbox
  set status = 'sent', provider_message_id = left(p_provider_message_id, 500), sent_at = now(), locked_at = null, last_error_code = null, updated_at = now()
  where id = p_outbox_id and status = 'processing';
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

create or replace function public.fail_notification_email(p_outbox_id uuid, p_error_code text)
returns boolean language plpgsql security definer set search_path = ''
as $$
declare v_attempt_count integer;
begin
  update public.notification_email_outbox
  set status = 'failed', locked_at = null, last_error_code = left(coalesce(nullif(trim(p_error_code), ''), 'smtp_error'), 100),
      next_attempt_at = now() + make_interval(secs => least(3600, (30 * power(2, greatest(attempt_count - 1, 0)))::integer)), updated_at = now()
  where id = p_outbox_id and status = 'processing'
  returning attempt_count into v_attempt_count;
  return v_attempt_count is not null;
end;
$$;

create or replace function public.list_admin_customers(
  p_query text default '', p_status text default 'all', p_tier text default 'all', p_sort text default 'joined',
  p_offset integer default 0, p_limit integer default 20
)
returns table (
  id uuid, name text, email text, phone text, avatar_url text, status text, tier text, joined_at timestamptz,
  orders_count bigint, total_spent_minor bigint, last_order_at timestamptz, total_count bigint
)
language plpgsql security definer set search_path = ''
as $$
begin
  if p_status not in ('all','active','suspended','pending')
    or p_tier not in ('all','Regular','Gold','Platinum','VIP')
    or p_sort not in ('joined','orders','spent','activity')
    or p_offset < 0 or p_limit < 10 or p_limit > 100 or length(coalesce(p_query, '')) > 100 then
    raise exception 'invalid_customer_list_input' using errcode = '22023';
  end if;
  return query
  with customer_rows as (
    select p.id, coalesce(nullif(p.display_name, ''), split_part(p.email, '@', 1)) as name, p.email,
      coalesce(p.phone, '') as phone, p.avatar_url, p.status, p.tier, p.created_at as joined_at,
      count(o.id)::bigint as orders_count,
      coalesce(sum(o.total_minor) filter (where o.payment_status = 'paid' and o.status <> 'cancelled'), 0)::bigint as total_spent_minor,
      max(o.created_at) as last_order_at
    from public.profiles p
    left join public.admin_memberships am on am.user_id = p.id
    left join public.orders o on o.user_id = p.id and o.archived_at is null
    where am.user_id is null
      and (p_status = 'all' or p.status = p_status)
      and (p_tier = 'all' or p.tier = p_tier)
      and (coalesce(trim(p_query), '') = '' or p.display_name ilike '%' || trim(p_query) || '%' or p.email ilike '%' || trim(p_query) || '%' or coalesce(p.phone, '') ilike '%' || trim(p_query) || '%')
    group by p.id
  ), counted as (select customer_rows.*, count(*) over ()::bigint as total_count from customer_rows)
  select c.id,c.name,c.email,c.phone,c.avatar_url,c.status,c.tier,c.joined_at,c.orders_count,c.total_spent_minor,c.last_order_at,c.total_count
  from counted c
  order by
    case when p_sort = 'orders' then c.orders_count end desc nulls last,
    case when p_sort = 'spent' then c.total_spent_minor end desc nulls last,
    case when p_sort = 'activity' then c.last_order_at end desc nulls last,
    c.joined_at desc, c.id
  offset p_offset limit p_limit;
end;
$$;

revoke all on function public.order_event_type(public.order_status) from public, anon, authenticated;
revoke all on function private.record_order_lifecycle_event() from public, anon, authenticated;
revoke all on function private.record_order_payment_event() from public, anon, authenticated;
revoke all on function private.assert_order_transition(public.order_status, public.order_status) from public, anon, authenticated;
revoke all on function private.assert_payment_transition(public.payment_status, public.payment_status) from public, anon, authenticated;
revoke all on function public.admin_update_order(uuid, public.order_status, public.payment_status, text, text, date, text, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_update_order(uuid, public.order_status, public.payment_status, text, text, date, text, text, uuid) to service_role;
revoke all on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated, service_role;
revoke all on function public.confirm_order_received(uuid) from public, anon;
grant execute on function public.confirm_order_received(uuid) to authenticated, service_role;
revoke all on function public.mark_notifications_read(uuid) from public, anon;
grant execute on function public.mark_notifications_read(uuid) to authenticated, service_role;
revoke all on function public.claim_notification_email_batch(integer) from public, anon, authenticated;
grant execute on function public.claim_notification_email_batch(integer) to service_role;
revoke all on function public.complete_notification_email(uuid, text) from public, anon, authenticated;
grant execute on function public.complete_notification_email(uuid, text) to service_role;
revoke all on function public.fail_notification_email(uuid, text) from public, anon, authenticated;
grant execute on function public.fail_notification_email(uuid, text) to service_role;
revoke all on function public.list_admin_customers(text,text,text,text,integer,integer) from public, anon, authenticated;
grant execute on function public.list_admin_customers(text,text,text,text,integer,integer) to service_role;

insert into public.notifications (user_id, order_id, event_type, payload, created_at)
select o.user_id, o.id, public.order_event_type(o.status), jsonb_build_object('orderNumber', o.order_number, 'status', o.status), o.created_at
from public.orders o on conflict (order_id, event_type) do nothing;

insert into public.payment_events (order_id, user_id, from_status, to_status, amount_minor, currency, payment_method, created_at)
select o.id, o.user_id, null, o.payment_status, o.total_minor, o.currency, o.payment_method, o.created_at
from public.orders o where not exists (select 1 from public.payment_events pe where pe.order_id = o.id);

do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

commit;
