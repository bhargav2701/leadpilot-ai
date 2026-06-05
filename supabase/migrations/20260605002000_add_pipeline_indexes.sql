create index if not exists leads_user_status_score_idx
on public.leads(user_id, status, lead_score desc);

create index if not exists leads_user_source_idx
on public.leads(user_id, source);

create index if not exists leads_user_temperature_idx
on public.leads(user_id, lead_temperature);
