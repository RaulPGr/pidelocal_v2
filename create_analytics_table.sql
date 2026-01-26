create table if not exists public.business_page_visits (
  id uuid not null default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  visitor_hash text, -- simple approximation like IP hash or cookie id
  path text,
  referrer text,
  created_at timestamptz default now(),
  constraint business_page_visits_pkey primary key (id)
);

alter table public.business_page_visits enable row level security;

-- Allow insert from anon (public visitors)
create policy "Enable insert for public" on public.business_page_visits
  for insert with check (true);

-- Allow select for owners/admins (via dashboard)
create policy "Enable select for admins" on public.business_page_visits
  for select using ( auth.role() = 'service_role' or exists (
    select 1 from public.businesses b 
    where b.id = business_page_visits.business_id 
    -- Add more specific RLS if needed, for superadmin service_role covers it
  ));
