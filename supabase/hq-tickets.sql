-- Ticket sales readings from OasisTix, for the internal HQ page.
-- Applied to Supabase > studio-ops on Oct 6, 2026 (migration pos_ticket_counts).
--
-- OasisTix (VenuePilot underneath) has no API this account can use, so
-- readings are recorded either by a scheduled Claude task that reads the
-- OasisTix events list, or typed in on HQ. Every reading is kept, so HQ can
-- show change over time.

create table packoutstate.ticket_counts (
  id bigint generated always as identity primary key,
  event_key text not null check (event_key in ('warm-up','talley-tapes','block-party')),
  sold int not null check (sold >= 0),
  available int check (available >= 0),
  sales_cents bigint check (sales_cents >= 0),
  source text not null check (source in ('sync','manual')),
  recorded_at timestamptz not null default now()
);
create index ticket_counts_event_time_idx on packoutstate.ticket_counts (event_key, recorded_at desc);
alter table packoutstate.ticket_counts enable row level security;
revoke all on packoutstate.ticket_counts from public, anon, authenticated;
grant all on packoutstate.ticket_counts to service_role;

-- Record one reading per event. p is a json array:
-- [{"event_key":"talley-tapes","sold":45,"available":435,"sales_cents":114000}, ...]
create or replace function public.pos_tickets_record(p jsonb, p_source text)
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  insert into packoutstate.ticket_counts (event_key, sold, available, sales_cents, source)
  select x->>'event_key', (x->>'sold')::int, nullif(x->>'available','')::int,
         nullif(x->>'sales_cents','')::bigint, p_source
  from jsonb_array_elements(p) x;
  get diagnostics n = row_count;
  return n;
end $$;
revoke all on function public.pos_tickets_record(jsonb, text) from public, anon, authenticated;
grant execute on function public.pos_tickets_record(jsonb, text) to service_role;

-- Latest reading per event (with the sold count from the latest reading at
-- least 24 hours older, for "last 24 hours"), plus every reading for the
-- sales-over-time chart. Readings are few, four a day per event.
-- Updated Oct 6, 2026 (migration pos_hq_tickets_history).
create or replace function public.pos_hq_tickets()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'latest', coalesce((select json_agg(json_build_object(
        'event_key', l.event_key, 'sold', l.sold, 'available', l.available,
        'sales_cents', l.sales_cents, 'source', l.source, 'recorded_at', l.recorded_at,
        'sold_day_before', (select o.sold from packoutstate.ticket_counts o
                            where o.event_key = l.event_key and o.recorded_at <= l.recorded_at - interval '24 hours'
                            order by o.recorded_at desc limit 1)))
      from (select distinct on (event_key) * from packoutstate.ticket_counts
            order by event_key, recorded_at desc) l), '[]'::json),
    'history', coalesce((select json_agg(json_build_object(
        'event_key', event_key, 'sold', sold, 'recorded_at', recorded_at) order by recorded_at)
      from packoutstate.ticket_counts), '[]'::json)
  )
$$;
revoke all on function public.pos_hq_tickets() from public, anon, authenticated;
grant execute on function public.pos_hq_tickets() to service_role;
