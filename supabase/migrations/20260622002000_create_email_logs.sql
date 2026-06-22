create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  body text not null,
  status text not null default 'Sent',
  error_message text,
  sent_at timestamp with time zone not null default now()
);

create index if not exists email_logs_user_sent_at_idx
on public.email_logs(user_id, sent_at desc);

create index if not exists email_logs_lead_sent_at_idx
on public.email_logs(lead_id, sent_at desc);

alter table public.email_logs enable row level security;

create policy "Users can view their own email logs"
on public.email_logs
for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can create their own email logs"
on public.email_logs
for insert
to authenticated
with check (auth.uid() = user_id);

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
    'Reminder Completed',
    'WhatsApp Sent',
    'Email Sent',
    'Email Failed'
  )
);
