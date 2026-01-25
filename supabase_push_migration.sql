-- Create table for storing Web Push Subscriptions
create table if not exists public.push_subscriptions (
  id uuid not null default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  constraint push_subscriptions_pkey primary key (id),
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

-- RLS Policies
alter table public.push_subscriptions enable row level security;

-- Allow insert/select for authenticated users (managers)
create policy "Enable insert for authenticated users" on public.push_subscriptions
  for insert with check (auth.role() = 'authenticated');

create policy "Enable read for owners" on public.push_subscriptions
  for select using (auth.uid() = user_id);

create policy "Enable delete for owners" on public.push_subscriptions
  for delete using (auth.uid() = user_id);
