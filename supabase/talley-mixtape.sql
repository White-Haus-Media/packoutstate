-- The Talley Mixtape: database setup
-- Run once in Supabase > studio-ops > SQL Editor.
-- Everything lives in its own "talley_mixtape" schema, separate from the
-- existing contact-form "submissions" table. Nothing existing is changed.
-- The site's server writes through one function: public.talley_mixtape_submit.

create schema talley_mixtape;
revoke all on schema talley_mixtape from public, anon, authenticated;
grant usage on schema talley_mixtape to service_role;

create table talley_mixtape.contributors (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  ig_handle text,
  era_start int not null check (era_start between 1960 and 2030),
  era_end int not null check (era_end >= era_start and era_end <= era_start + 15),
  marketing_opt_in boolean not null default false,
  opt_in_at timestamptz,
  source text,
  submission_count int not null default 1,
  hidden boolean not null default false,
  ip text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index contributors_email_key on talley_mixtape.contributors (lower(email));

create table talley_mixtape.tracks (
  id uuid primary key default gen_random_uuid(),
  itunes_track_id bigint unique,
  title text not null,
  artist text not null,
  album text,
  release_year int,
  genre text,
  apple_url text,
  is_manual boolean not null default false,
  match_key text not null,
  merged_into uuid references talley_mixtape.tracks(id),
  created_at timestamptz not null default now()
);
create index tracks_match_key_idx on talley_mixtape.tracks (match_key);

create table talley_mixtape.picks (
  id uuid primary key default gen_random_uuid(),
  contributor_id uuid not null references talley_mixtape.contributors(id) on delete cascade,
  track_id uuid not null references talley_mixtape.tracks(id),
  slot text not null check (slot in ('takes_me_back','first_five_seconds','whole_room_knew','lights_coming_on','top10')),
  position int not null,
  hidden boolean not null default false,
  created_at timestamptz not null default now(),
  unique (contributor_id, track_id, slot)
);
create index picks_track_idx on talley_mixtape.picks (track_id);

alter table talley_mixtape.contributors enable row level security;
alter table talley_mixtape.tracks enable row level security;
alter table talley_mixtape.picks enable row level security;
grant all on all tables in schema talley_mixtape to service_role;

-- Normalized key so album, clean, remaster and "feat." versions count as one song.
create function talley_mixtape.match_key(p_title text, p_artist text)
returns text language sql immutable set search_path = '' as $$
  select trim(regexp_replace(
           split_part(split_part(split_part(split_part(lower(coalesce(p_artist,'')), ' feat', 1), ' ft.', 1), ' & ', 1), ', ', 1),
           '[^a-z0-9]+', ' ', 'g'))
      || ' | ' ||
         trim(regexp_replace(
           regexp_replace(
             regexp_replace(lower(coalesce(p_title,'')),
               '\s*[\(\[][^\)\]]*(feat|ft\.|with |remaster|clean|explicit|radio|edit|version|mono|stereo|live|mix)[^\)\]]*[\)\]]', '', 'g'),
             '\s+-\s+.*(remaster|radio edit|clean|explicit|version|edit|mix).*$', '', 'g'),
           '[^a-z0-9]+', ' ', 'g'))
$$;

-- One call per submission: upsert the contributor by email, then replace all their picks.
create function public.talley_mixtape_submit(p jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_contributor uuid;
  v_track uuid;
  v_pick jsonb;
  v_key text;
begin
  insert into talley_mixtape.contributors as c
    (email, full_name, ig_handle, era_start, era_end, marketing_opt_in, opt_in_at, source, ip, user_agent)
  values (
    lower(p->>'email'), p->>'full_name', nullif(p->>'ig_handle',''),
    (p->>'era_start')::int, (p->>'era_end')::int,
    coalesce((p->>'marketing_opt_in')::boolean, false),
    case when coalesce((p->>'marketing_opt_in')::boolean,false) then now() end,
    nullif(p->>'source',''), p->>'ip', p->>'user_agent')
  on conflict (lower(email)) do update set
    full_name = excluded.full_name,
    ig_handle = excluded.ig_handle,
    era_start = excluded.era_start,
    era_end = excluded.era_end,
    marketing_opt_in = excluded.marketing_opt_in,
    opt_in_at = case when excluded.marketing_opt_in then coalesce(c.opt_in_at, now()) else null end,
    source = coalesce(c.source, excluded.source),
    submission_count = c.submission_count + 1,
    ip = excluded.ip,
    user_agent = excluded.user_agent,
    updated_at = now()
  returning id into v_contributor;

  delete from talley_mixtape.picks where contributor_id = v_contributor;

  for v_pick in select * from jsonb_array_elements(p->'picks') loop
    v_track := null;
    v_key := talley_mixtape.match_key(v_pick->>'title', v_pick->>'artist');
    if nullif(v_pick->>'itunes_track_id','') is not null then
      insert into talley_mixtape.tracks (itunes_track_id, title, artist, album, release_year, genre, apple_url, match_key)
      values ((v_pick->>'itunes_track_id')::bigint, v_pick->>'title', v_pick->>'artist', v_pick->>'album',
              nullif(v_pick->>'release_year','')::int, v_pick->>'genre', v_pick->>'apple_url', v_key)
      on conflict (itunes_track_id) do update set title = excluded.title
      returning id into v_track;
    else
      select id into v_track from talley_mixtape.tracks where match_key = v_key order by is_manual, created_at limit 1;
      if v_track is null then
        insert into talley_mixtape.tracks (title, artist, is_manual, match_key)
        values (v_pick->>'title', v_pick->>'artist', true, v_key)
        returning id into v_track;
      end if;
    end if;
    insert into talley_mixtape.picks (contributor_id, track_id, slot, position)
    values (v_contributor, v_track, v_pick->>'slot', (v_pick->>'position')::int)
    on conflict (contributor_id, track_id, slot) do nothing;
  end loop;

  return v_contributor;
end $$;
revoke all on function public.talley_mixtape_submit(jsonb) from public, anon, authenticated;
grant execute on function public.talley_mixtape_submit(jsonb) to service_role;

-- Views: open these in Table Editor (switch the schema dropdown to talley_mixtape).
create view talley_mixtape.picks_resolved as
select p.id as pick_id, p.slot, p.position, c.id as contributor_id, c.full_name, c.era_start, c.era_end,
       t.id as track_id, t.match_key, t.title, t.artist, t.genre, t.release_year
from talley_mixtape.picks p
join talley_mixtape.contributors c on c.id = p.contributor_id and not c.hidden
join talley_mixtape.tracks t0 on t0.id = p.track_id
join talley_mixtape.tracks t on t.id = coalesce(t0.merged_into, t0.id)
where not p.hidden;

create view talley_mixtape.rankings as
select match_key,
       (array_agg(title order by length(title), title))[1] as title,
       (array_agg(artist order by length(title), title))[1] as artist,
       count(distinct contributor_id) as contributors,
       count(distinct contributor_id) filter (where slot = 'takes_me_back') as takes_me_back,
       count(distinct contributor_id) filter (where slot = 'first_five_seconds') as first_five_seconds,
       count(distinct contributor_id) filter (where slot = 'whole_room_knew') as whole_room_knew,
       count(distinct contributor_id) filter (where slot = 'lights_coming_on') as lights_coming_on,
       count(distinct contributor_id) filter (where slot = 'top10') as top10
from talley_mixtape.picks_resolved
group by match_key
order by contributors desc, title;

create view talley_mixtape.rankings_by_decade as
select d.decade, r.match_key,
       (array_agg(r.title order by length(r.title), r.title))[1] as title,
       (array_agg(r.artist order by length(r.title), r.title))[1] as artist,
       count(distinct r.contributor_id) as contributors
from talley_mixtape.picks_resolved r
cross join lateral generate_series((r.era_start/10)*10, (r.era_end/10)*10, 10) as d(decade)
group by d.decade, r.match_key
order by d.decade, contributors desc;

create view talley_mixtape.rankings_by_genre as
select coalesce(genre,'Unknown') as genre, match_key,
       (array_agg(title order by length(title), title))[1] as title,
       (array_agg(artist order by length(title), title))[1] as artist,
       count(distinct contributor_id) as contributors
from talley_mixtape.picks_resolved
group by coalesce(genre,'Unknown'), match_key
order by genre, contributors desc;

create view talley_mixtape.dj_brief as
select slot, match_key,
       (array_agg(title order by length(title), title))[1] as title,
       (array_agg(artist order by length(title), title))[1] as artist,
       count(distinct contributor_id) as contributors
from talley_mixtape.picks_resolved
group by slot, match_key
order by slot, contributors desc;

create view talley_mixtape.review_queue as
select t.id, t.title, t.artist, t.match_key, t.created_at,
       (select count(*) from talley_mixtape.picks p where p.track_id = t.id) as picks
from talley_mixtape.tracks t
where t.is_manual and t.merged_into is null
order by picks desc, created_at;

create view talley_mixtape.era_outreach as
select full_name, email, ig_handle, era_start, era_end, marketing_opt_in, created_at
from talley_mixtape.contributors
where not hidden
order by era_start, era_end;
