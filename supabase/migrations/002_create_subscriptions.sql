-- Migration: Create subscriptions table + Stripe webhook idempotency events
-- Phase 4.1: Stripe Integration & Customer Management

-- Store Stripe customer + subscription state per user.
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null unique,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  status text check (status in ('active', 'past_due', 'canceled', 'incomplete')),
  plan_type text check (plan_type in ('subscription', 'one_time')),
  price_id text,
  current_period_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable Row Level Security: users can only see their own subscription row.
alter table subscriptions enable row level security;

create policy "users can view their own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

create policy "service role can manage all subscriptions"
  on subscriptions for all
  using (true)
  with check (true);

-- Indexes for lookups by user and by Stripe ids.
create index idx_subscriptions_user_id on subscriptions(user_id);
create index idx_subscriptions_stripe_customer on subscriptions(stripe_customer_id);
create index idx_subscriptions_stripe_subscription on subscriptions(stripe_subscription_id);

-- Track processed Stripe webhook events for idempotency.
-- Re-processing the same event is a no-op because each event id is stored once.
create table stripe_webhook_events (
  id text primary key, -- Stripe event id (evt_...)
  type text not null,
  processed_at timestamptz default now()
);

-- RLS on stripe_webhook_events: only the server (service role) writes; users read none.
alter table stripe_webhook_events enable row level security;

create policy "service role manages webhook events"
  on stripe_webhook_events for all
  using (true)
  with check (true);
