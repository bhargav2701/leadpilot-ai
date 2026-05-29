create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  source text,
  status text not null default 'New',
  notes text,
  created_at timestamp with time zone not null default now()
);

create index if not exists leads_user_id_idx on public.leads(user_id);
create index if not exists leads_user_status_idx on public.leads(user_id, status);
create index if not exists leads_user_created_at_idx on public.leads(user_id, created_at desc);

alter table public.leads enable row level security;

create policy "Users can view their own leads"
on public.leads
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own leads"
on public.leads
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own leads"
on public.leads
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own leads"
on public.leads
for delete
to authenticated
using (auth.uid() = user_id);
