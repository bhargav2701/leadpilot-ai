drop trigger if exists set_lead_score_trigger on public.leads;

drop function if exists public.set_lead_score();

drop function if exists public.calculate_lead_score(text, text, text, timestamp with time zone);

create function public.calculate_lead_score(
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
  lead_age_days integer := greatest(
    0,
    floor(extract(epoch from (now() - coalesce(lead_created_at, now()))) / 86400)::integer
  );
begin
  score := score + case lead_status
    when 'Converted' then 55
    when 'Qualified' then 40
    when 'New' then 5
    when 'Lost' then 0
    else 0
  end;

  score := score + case
    when normalized_source like '%referral%' then 20
    when normalized_source like '%website%' then 10
    when normalized_source like '%whatsapp%' then 8
    when normalized_source <> '' then 5
    else 0
  end;

  if normalized_notes like '%pricing%' then
    score := score + 12;
  end if;

  if normalized_notes like '%demo%' then
    score := score + 12;
  end if;

  if normalized_notes like '%proposal%' then
    score := score + 12;
  end if;

  if normalized_notes like '%meeting%' then
    score := score + 10;
  end if;

  if normalized_notes like '%interested%' then
    score := score + 8;
  end if;

  score := score + case
    when lead_age_days <= 1 then 5
    when lead_age_days <= 3 then 3
    when lead_age_days <= 7 then 1
    else 0
  end;

  return least(100, greatest(0, score));
end;
$$;

create function public.set_lead_score()
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
    when new.lead_score >= 75 then 'Hot'
    when new.lead_score >= 40 then 'Warm'
    else 'Cold'
  end;

  return new;
end;
$$;

create trigger set_lead_score_trigger
before insert or update of status, source, notes, created_at
on public.leads
for each row
execute function public.set_lead_score();

update public.leads
set
  lead_score = public.calculate_lead_score(status, source, notes, created_at),
  lead_temperature = case
    when public.calculate_lead_score(status, source, notes, created_at) >= 75 then 'Hot'
    when public.calculate_lead_score(status, source, notes, created_at) >= 40 then 'Warm'
    else 'Cold'
  end;
