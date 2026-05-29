create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workspace_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'Member' check (role in ('Owner', 'Member')),
  created_at timestamp with time zone not null default now(),
  unique(user_id, workspace_id)
);

alter table public.leads
add column if not exists assigned_to uuid references auth.users(id) on delete set null;

create index if not exists team_members_user_id_idx
on public.team_members(user_id);

create index if not exists team_members_workspace_id_idx
on public.team_members(workspace_id);

create index if not exists leads_assigned_to_idx
on public.leads(assigned_to);

alter table public.team_members enable row level security;

drop policy if exists "Users can view their team memberships" on public.team_members;
drop policy if exists "Owners can manage team memberships" on public.team_members;
drop policy if exists "Owners can update team memberships" on public.team_members;
drop policy if exists "Owners can delete team memberships" on public.team_members;

create policy "Users can view their team memberships"
on public.team_members
for select
to authenticated
using (
  user_id = auth.uid()
  or workspace_id = auth.uid()
);

create policy "Owners can manage team memberships"
on public.team_members
for insert
to authenticated
with check (workspace_id = auth.uid() and role in ('Owner', 'Member'));

create policy "Owners can update team memberships"
on public.team_members
for update
to authenticated
using (workspace_id = auth.uid())
with check (workspace_id = auth.uid() and role in ('Owner', 'Member'));

create policy "Owners can delete team memberships"
on public.team_members
for delete
to authenticated
using (workspace_id = auth.uid());

drop policy if exists "Users can view their own leads" on public.leads;
drop policy if exists "Users can create their own leads" on public.leads;
drop policy if exists "Users can update their own leads" on public.leads;
drop policy if exists "Users can delete their own leads" on public.leads;
drop policy if exists "Workspace members can view leads" on public.leads;
drop policy if exists "Workspace members can create leads" on public.leads;
drop policy if exists "Workspace members can update leads" on public.leads;
drop policy if exists "Workspace owners can delete leads" on public.leads;

create policy "Workspace members can view leads"
on public.leads
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.team_members
    where team_members.workspace_id = leads.user_id
      and team_members.user_id = auth.uid()
  )
);

create policy "Workspace members can create leads"
on public.leads
for insert
to authenticated
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.team_members
    where team_members.workspace_id = leads.user_id
      and team_members.user_id = auth.uid()
  )
);

create policy "Workspace members can update leads"
on public.leads
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.team_members
    where team_members.workspace_id = leads.user_id
      and team_members.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.team_members
    where team_members.workspace_id = leads.user_id
      and team_members.user_id = auth.uid()
  )
);

create policy "Workspace owners can delete leads"
on public.leads
for delete
to authenticated
using (user_id = auth.uid());
