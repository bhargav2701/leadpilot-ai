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
    'WhatsApp Sent'
  )
);
