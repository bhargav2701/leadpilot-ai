alter table public.leads
add column if not exists lead_score integer not null default 0,
add column if not exists lead_temperature text not null default 'Cold';

create index if not exists leads_user_score_idx
on public.leads(user_id, lead_score desc);

create index if not exists leads_user_temperature_idx
on public.leads(user_id, lead_temperature);

create or replace function public.calculate_lead_score(
  lead_status text,
  lead_source text,
  lead_notes text,
  lead_created_at timestamp with time zone
)
returns integer
language plpgsql
stable
as $$
declare
  score integer := 0;
  normalized_source text := lower(coalesce(lead_source, ''));
  normalized_notes text := lower(coalesce(lead_notes, ''));
  lead_age_days integer := greatest(0, floor(extract(epoch from (now() - lead_created_at)) / 86400)::integer);
begin
  score := score + case lead_status
    when 'Converted' then 40
    when 'Qualified' then 25
    when 'New' then 10
    else 0
  end;

  score := score + case
    when normalized_source like '%referral%' then 30
    when normalized_source like '%website%' then 20
    when normalized_source like '%whatsapp%' then 15
    when normalized_source <> '' then 10
    else 0
  end;

  if normalized_notes like '%pricing%' then score := score + 5; end if;
  if normalized_notes like '%demo%' then score := score + 5; end if;
  if normalized_notes like '%interested%' then score := score + 5; end if;
  if normalized_notes like '%call%' then score := score + 5; end if;
  if normalized_notes like '%meeting%' then score := score + 5; end if;
  if normalized_notes like '%proposal%' then score := score + 5; end if;

  score := score + case
    when lead_age_days <= 1 then 20
    when lead_age_days <= 3 then 15
    when lead_age_days <= 7 then 10
    when lead_age_days <= 14 then 5
    else 0
  end;

  return least(100, greatest(0, score));
end;
$$;

create or replace function public.set_lead_score()
returns trigger
language plpgsql
as $$
begin
  new.lead_score := public.calculate_lead_score(
    new.status,
    new.source,
    new.notes,
    coalesce(new.created_at, now())
  );

  new.lead_temperature := case
    when new.lead_score >= 80 then 'Hot'
    when new.lead_score >= 50 then 'Warm'
    else 'Cold'
  end;

  return new;
end;
$$;

drop trigger if exists set_lead_score_trigger on public.leads;

create trigger set_lead_score_trigger
before insert or update of status, source, notes, created_at
on public.leads
for each row
execute function public.set_lead_score();

update public.leads
set
  lead_score = public.calculate_lead_score(status, source, notes, created_at),
  lead_temperature = case
    when public.calculate_lead_score(status, source, notes, created_at) >= 80 then 'Hot'
    when public.calculate_lead_score(status, source, notes, created_at) >= 50 then 'Warm'
    else 'Cold'
  end;
