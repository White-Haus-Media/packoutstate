-- "Get updates" list for the off-season site (Nov 2026 onward).
-- Applied to Supabase > studio-ops on Nov 12, 2026 (migration pos_subscribers).
--
-- One row per email. Signing up again with the same email updates the phone
-- number and keeps the original signup time. Nothing is sent to these people
-- automatically; the list is exported when there is news (next year's dates,
-- early access).

create table packoutstate.subscribers (
  id bigint generated always as identity primary key,
  email text not null,
  phone text,
  source text,                 -- the page they signed up from, e.g. "/" or "/block-party"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index subscribers_email_idx on packoutstate.subscribers (lower(email));
alter table packoutstate.subscribers enable row level security;
revoke all on packoutstate.subscribers from public, anon, authenticated;
grant all on packoutstate.subscribers to service_role;

-- Add or refresh one signup. Returns {"ok":true,"already":bool}.
create or replace function public.pos_subscribe(p_email text, p_phone text, p_source text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare existed boolean;
begin
  select true into existed from packoutstate.subscribers where lower(email) = lower(p_email);
  insert into packoutstate.subscribers (email, phone, source)
  values (lower(p_email), nullif(p_phone, ''), nullif(p_source, ''))
  on conflict (lower(email)) do update
    set phone = coalesce(excluded.phone, packoutstate.subscribers.phone),
        updated_at = now();
  return jsonb_build_object('ok', true, 'already', coalesce(existed, false));
end $$;
revoke all on function public.pos_subscribe(text, text, text) from public, anon, authenticated;
grant execute on function public.pos_subscribe(text, text, text) to service_role;
