create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_name text not null default 'Free',
  status text not null default 'Active',
  lead_limit integer not null default 100,
  ai_requests_limit integer not null default 50,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create unique index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_user_status_idx on public.subscriptions(user_id, status);

alter table public.subscriptions enable row level security;

create policy "Users can view their own subscription"
on public.subscriptions
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own subscription"
on public.subscriptions
for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Users can update their own subscription"
on public.subscriptions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.set_updated_at();
