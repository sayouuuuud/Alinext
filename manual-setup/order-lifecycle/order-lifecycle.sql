-- ALI FLEET order lifecycle extension
-- Run this file manually in your Supabase SQL editor after reviewing it.
-- It is idempotent where practical and does not require Resend.

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
  provider_message_id text,
  last_error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  from_status public.payment_status,
  to_status public.payment_status not null,
  amount_minor bigint not null check (amount_minor >= 0),
  currency text not null,
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

alter table public.notifications enable row level security;
alter table public.notification_email_outbox enable row level security;
alter table public.payment_events enable row level security;
alter table public.order_status_history enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists payment_events_select_own on public.payment_events;
create policy payment_events_select_own on public.payment_events for select to authenticated using (
  exists (select 1 from public.orders o where o.id = payment_events.order_id and o.user_id = (select auth.uid()))
);

drop policy if exists order_status_history_select_own on public.order_status_history;
create policy order_status_history_select_own on public.order_status_history for select to authenticated using (
  exists (select 1 from public.orders o where o.id = order_status_history.order_id and o.user_id = (select auth.uid()))
);

revoke all on public.notifications from anon;
revoke insert, update, delete on public.notifications from authenticated;
grant select on public.notifications to authenticated;
revoke all on public.notification_email_outbox from anon, authenticated;
revoke all on public.payment_events from anon;
revoke insert, update, delete on public.payment_events from authenticated;
grant select on public.payment_events to authenticated;

create or replace function public.order_event_type(p_status public.order_status)
returns text
language sql
immutable
set search_path = ''
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

create or replace function public.record_order_lifecycle_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_changed_by uuid;
  v_note text;
  v_notification_id uuid;
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  v_changed_by := nullif(current_setting('app.changed_by', true), '')::uuid;
  v_note := nullif(current_setting('app.change_note', true), '');

  if tg_op = 'UPDATE' then
    insert into public.order_status_history (order_id, from_status, to_status, note, changed_by)
    values (new.id, old.status, new.status, v_note, v_changed_by);
  end if;

  insert into public.notifications (user_id, order_id, event_type, payload)
  values (
    new.user_id,
    new.id,
    public.order_event_type(new.status),
    jsonb_build_object(
      'orderNumber', new.order_number,
      'status', new.status,
      'carrier', new.carrier,
      'trackingNumber', new.tracking_number,
      'estimatedDelivery', new.estimated_delivery,
      'note', v_note
    )
  )
  on conflict (order_id, event_type) do update set payload = excluded.payload
  returning id into v_notification_id;

  -- The outbox is deliberately only queued. No email provider is called by this SQL.
  insert into public.notification_email_outbox (notification_id, recipient)
  values (v_notification_id, new.customer_email)
  on conflict (notification_id) do nothing;

  return new;
end;
$$;

create or replace function public.record_order_payment_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_changed_by uuid;
  v_note text;
begin
  if tg_op = 'UPDATE' and new.payment_status is not distinct from old.payment_status then
    return new;
  end if;
  v_changed_by := nullif(current_setting('app.changed_by', true), '')::uuid;
  v_note := nullif(current_setting('app.change_note', true), '');
  insert into public.payment_events (order_id, user_id, from_status, to_status, amount_minor, currency, payment_method, changed_by, note)
  values (new.id, new.user_id, case when tg_op = 'INSERT' then null else old.payment_status end, new.payment_status, new.total_minor, new.currency, new.payment_method, v_changed_by, v_note);
  return new;
end;
$$;

drop trigger if exists orders_lifecycle_event on public.orders;
create trigger orders_lifecycle_event after insert or update of status on public.orders for each row execute function public.record_order_lifecycle_event();
drop trigger if exists orders_payment_event on public.orders;
create trigger orders_payment_event after insert or update of payment_status on public.orders for each row execute function public.record_order_payment_event();

create or replace function public.assert_order_transition(p_from public.order_status, p_to public.order_status)
returns void
language plpgsql
immutable
set search_path = ''
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
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_status public.order_status;
  v_carrier text;
  v_tracking text;
begin
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  v_status := coalesce(p_status, v_order.status);
  v_carrier := coalesce(p_carrier, v_order.carrier);
  v_tracking := coalesce(p_tracking_number, v_order.tracking_number);
  perform public.assert_order_transition(v_order.status, v_status);
  if v_status = 'shipping' and (nullif(trim(v_carrier), '') is null or nullif(trim(v_tracking), '') is null) then
    raise exception 'shipping_details_required' using errcode = '22023';
  end if;
  perform set_config('app.changed_by', coalesce(p_changed_by::text, ''), true);
  perform set_config('app.change_note', coalesce(p_note, ''), true);
  update public.orders set
    status = v_status,
    payment_status = coalesce(p_payment_status, payment_status),
    carrier = case when p_carrier is not null then nullif(trim(p_carrier), '') else carrier end,
    tracking_number = case when p_tracking_number is not null then nullif(trim(p_tracking_number), '') else tracking_number end,
    estimated_delivery = coalesce(p_estimated_delivery, estimated_delivery),
    admin_notes = case when p_admin_notes is not null then p_admin_notes else admin_notes end,
    updated_at = now()
  where id = p_order_id
  returning * into v_order;
  return jsonb_build_object('id', v_order.id, 'orderNumber', v_order.order_number, 'status', v_order.status, 'paymentStatus', v_order.payment_status, 'carrier', v_order.carrier, 'trackingNumber', v_order.tracking_number, 'estimatedDelivery', v_order.estimated_delivery, 'updatedAt', v_order.updated_at);
end;
$$;

create or replace function public.cancel_order(p_order_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  select * into v_order from public.orders where id = p_order_id and user_id = (select auth.uid()) for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  if v_order.status <> 'pending' then raise exception 'cancel_not_allowed' using errcode = '22023'; end if;
  for v_item in select product_id, quantity from public.order_items where order_id = p_order_id and product_id is not null loop
    update public.products set stock_quantity = stock_quantity + v_item.quantity, updated_at = now() where id = v_item.product_id;
  end loop;
  perform set_config('app.changed_by', (select auth.uid())::text, true);
  perform set_config('app.change_note', left(trim(p_reason), 500), true);
  update public.orders set status = 'cancelled', updated_at = now() where id = p_order_id;
  return jsonb_build_object('id', p_order_id, 'status', 'cancelled');
end;
$$;

create or replace function public.confirm_order_received(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  select * into v_order from public.orders where id = p_order_id and user_id = (select auth.uid()) for update;
  if not found then raise exception 'order_not_found' using errcode = 'P0002'; end if;
  if v_order.status <> 'delivered' then raise exception 'confirmation_not_allowed' using errcode = '22023'; end if;
  perform set_config('app.changed_by', (select auth.uid())::text, true);
  perform set_config('app.change_note', 'customer_confirmed_receipt', true);
  update public.orders set status = 'completed', updated_at = now() where id = p_order_id;
  return jsonb_build_object('id', p_order_id, 'status', 'completed');
end;
$$;

create or replace function public.mark_notifications_read(p_notification_id uuid default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if (select auth.uid()) is null then raise exception 'authentication_required' using errcode = '28000'; end if;
  update public.notifications set read_at = coalesce(read_at, now())
  where user_id = (select auth.uid()) and (p_notification_id is null or id = p_notification_id);
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.order_event_type(public.order_status) from public, anon, authenticated;
revoke all on function public.record_order_lifecycle_event() from public, anon, authenticated;
revoke all on function public.record_order_payment_event() from public, anon, authenticated;
revoke all on function public.assert_order_transition(public.order_status, public.order_status) from public, anon, authenticated;
revoke all on function public.admin_update_order(uuid, public.order_status, public.payment_status, text, text, date, text, text, uuid) from public, anon, authenticated;
grant execute on function public.admin_update_order(uuid, public.order_status, public.payment_status, text, text, date, text, text, uuid) to service_role;
revoke all on function public.cancel_order(uuid, text) from public, anon;
grant execute on function public.cancel_order(uuid, text) to authenticated;
revoke all on function public.confirm_order_received(uuid) from public, anon;
grant execute on function public.confirm_order_received(uuid) to authenticated;
revoke all on function public.mark_notifications_read(uuid) from public, anon;
grant execute on function public.mark_notifications_read(uuid) to authenticated;

-- Backfill only missing initial notifications/payment events.
insert into public.notifications (user_id, order_id, event_type, payload, created_at)
select o.user_id, o.id, public.order_event_type(o.status), jsonb_build_object('orderNumber', o.order_number, 'status', o.status), o.created_at
from public.orders o
on conflict (order_id, event_type) do nothing;

insert into public.payment_events (order_id, user_id, from_status, to_status, amount_minor, currency, payment_method, created_at)
select o.id, o.user_id, null, o.payment_status, o.total_minor, o.currency, o.payment_method, o.created_at
from public.orders o
where not exists (select 1 from public.payment_events pe where pe.order_id = o.id);

-- Realtime publication; duplicate membership is safely ignored.
do $$ begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;

commit;
