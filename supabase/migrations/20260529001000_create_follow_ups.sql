create table if not exists public.follow_ups (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  generated_message text not null,
  tone text not null,
  created_at timestamp with time zone not null default now()
);

create index if not exists follow_ups_user_id_idx on public.follow_ups(user_id);
create index if not exists follow_ups_lead_id_idx on public.follow_ups(lead_id);
create index if not exists follow_ups_user_created_at_idx on public.follow_ups(user_id, created_at desc);

alter table public.follow_ups enable row level security;

create policy "Users can view their own follow ups"
on public.follow_ups
for select
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.leads
    where leads.id = follow_ups.lead_id
      and leads.user_id = auth.uid()
  )
);

create policy "Users can create their own follow ups"
on public.follow_ups
for insert
to authenticated
with check (
  auth.uid() = user_id
  and exists (
    select 1
    from public.leads
    where leads.id = follow_ups.lead_id
      and leads.user_id = auth.uid()
  )
);

create policy "Users can delete their own follow ups"
on public.follow_ups
for delete
to authenticated
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.leads
    where leads.id = follow_ups.lead_id
      and leads.user_id = auth.uid()
  )
);
