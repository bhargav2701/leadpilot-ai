alter table public.activity_logs
drop constraint if exists activity_logs_activity_type_check;

alter table public.activity_logs
add constraint activity_logs_activity_type_check
check (
  activity_type in (
    'Lead Created',
    'Lead Updated',
    'Lead Deleted',
    'Lead Assigned',
    'Status Changed',
    'Follow-Up Generated',
    'CSV Import',
    'Reminder Created',
    'Reminder Completed'
  )
);

create table if not exists public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid not null references public.leads(id) on delete cascade,
  title text not null,
  reminder_date timestamp with time zone not null,
  reminder_type text not null check (
    reminder_type in ('Call', 'Email', 'WhatsApp', 'Meeting', 'Follow Up')
  ),
  completed boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create index if not exists reminders_user_completed_date_idx
on public.reminders(user_id, completed, reminder_date);

create index if not exists reminders_lead_date_idx
on public.reminders(lead_id, reminder_date);

create index if not exists reminders_type_idx
on public.reminders(reminder_type);

alter table public.reminders enable row level security;

drop policy if exists "Workspace members can view reminders" on public.reminders;
drop policy if exists "Workspace members can create reminders" on public.reminders;
drop policy if exists "Workspace members can update reminders" on public.reminders;
drop policy if exists "Workspace owners can delete reminders" on public.reminders;

create policy "Workspace members can view reminders"
on public.reminders
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.team_members
    where team_members.workspace_id = reminders.user_id
      and team_members.user_id = auth.uid()
  )
);

create policy "Workspace members can create reminders"
on public.reminders
for insert
to authenticated
with check (
  (
    user_id = auth.uid()
    or exists (
      select 1
      from public.team_members
      where team_members.workspace_id = reminders.user_id
        and team_members.user_id = auth.uid()
    )
  )
  and exists (
    select 1
    from public.leads
    where leads.id = reminders.lead_id
      and leads.user_id = reminders.user_id
  )
);

create policy "Workspace members can update reminders"
on public.reminders
for update
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.team_members
    where team_members.workspace_id = reminders.user_id
      and team_members.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  or exists (
    select 1
    from public.team_members
    where team_members.workspace_id = reminders.user_id
      and team_members.user_id = auth.uid()
  )
);

create policy "Workspace owners can delete reminders"
on public.reminders
for delete
to authenticated
using (user_id = auth.uid());
