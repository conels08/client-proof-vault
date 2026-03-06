-- User-level subscription and entitlement record.
create table if not exists public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  stripe_price_id text,
  stripe_product_id text,
  status text not null default 'inactive',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_subscriptions_user_id_unique unique (user_id),
  constraint user_subscriptions_status_check check (
    status in (
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused',
      'inactive'
    )
  )
);

create index if not exists user_subscriptions_status_idx
  on public.user_subscriptions (status);

alter table public.user_subscriptions enable row level security;

drop policy if exists user_subscriptions_select_owner on public.user_subscriptions;
create policy user_subscriptions_select_owner
  on public.user_subscriptions
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists user_subscriptions_insert_owner on public.user_subscriptions;
create policy user_subscriptions_insert_owner
  on public.user_subscriptions
  for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists user_subscriptions_update_owner on public.user_subscriptions;
create policy user_subscriptions_update_owner
  on public.user_subscriptions
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
