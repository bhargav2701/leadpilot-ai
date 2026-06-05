create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  activity_type text not null check (
    activity_type in (
      'Lead Created',
      'Lead Updated',
      'Lead Deleted',
      'Lead Assigned',
      'Status Changed',
      'Follow-Up Generated',
      'CSV Import'
    )
  ),
  description text not null,
  created_at timestamp with time zone not null default now()
);

create index if not exists activity_logs_user_created_at_idx
on public.activity_logs(user_id, created_at desc);

create index if not exists activity_logs_lead_created_at_idx
on public.activity_logs(lead_id, created_at desc);

create index if not exists activity_logs_activity_type_idx
on public.activity_logs(activity_type);

alter table public.activity_logs enable row level security;

drop policy if exists "Workspace members can view activity logs" on public.activity_logs;
drop policy if exists "Workspace members can create activity logs" on public.activity_logs;

create policy "Workspace members can view activity logs"
on public.activity_logs
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.team_members
    where team_members.workspace_id = activity_logs.user_id
      and team_members.user_id = auth.uid()
  )
);

create policy "Workspace members can create activity logs"
on public.activity_logs
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.team_members
    where team_members.workspace_id = activity_logs.user_id
      and team_members.user_id = auth.uid()
  )
);
