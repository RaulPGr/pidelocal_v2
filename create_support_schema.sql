-- Support Tickets
create table if not exists public.support_tickets (
    id uuid not null default gen_random_uuid(),
    business_id uuid references public.businesses(id) on delete cascade,
    subject text not null,
    status text not null default 'open', -- open, closed, answered
    priority text not null default 'normal',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),

    constraint support_tickets_pkey primary key (id)
);

-- Support Messages
create table if not exists public.support_messages (
    id uuid not null default gen_random_uuid(),
    ticket_id uuid references public.support_tickets(id) on delete cascade,
    sender_role text not null, -- 'business' or 'superadmin'
    message text not null,
    created_at timestamptz default now(),
    read boolean default false,

    constraint support_messages_pkey primary key (id)
);

-- RLS
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

-- Policies for tickets (Simplified for now - we will enforce via Server Actions mostly, but good to have)
-- We allow authenticated users to view tickets if they belong to the business.
create policy "Ticket access for members" on public.support_tickets
    for select using (
        business_id in (
            select business_id from public.business_members where user_id = auth.uid()
        )
    );

create policy "Ticket insert for members" on public.support_tickets
    for insert with check (
        business_id in (
            select business_id from public.business_members where user_id = auth.uid()
        )
    );

-- Messages policies
create policy "Message access for members" on public.support_messages
    for select using (
        ticket_id in (
            select id from public.support_tickets 
            where business_id in (
                select business_id from public.business_members where user_id = auth.uid()
            )
        )
    );

create policy "Message insert for members" on public.support_messages
    for insert with check (
        ticket_id in (
            select id from public.support_tickets 
            where business_id in (
                select business_id from public.business_members where user_id = auth.uid()
            )
        )
    );

-- SuperAdmin Access (Usually disabled RLS for service role, but if we log in as superadmin user:
-- We assume SuperAdmin uses Service Role or specific checks. For now we will rely on Service Role in our Actions).
