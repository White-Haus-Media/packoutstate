-- Talley Mixtape results for the internal HQ page.
-- Applied to Supabase > studio-ops on Oct 6, 2026 (migration pos_hq_mixtape).
-- Read only. Called by api/hq.js with the service key after the HQ password
-- checks out. Hidden contributors and hidden picks are left out, same as the
-- views in talley-mixtape.sql.

create or replace function public.pos_hq_mixtape()
returns json language sql stable security definer set search_path = '' as $$
  select json_build_object(
    'totals', json_build_object(
      'contributors', (select count(*) from talley_mixtape.contributors where not hidden),
      'opted_in',     (select count(*) from talley_mixtape.contributors where not hidden and marketing_opt_in),
      'songs',        (select count(distinct match_key) from talley_mixtape.picks_resolved),
      'picks',        (select count(*) from talley_mixtape.picks_resolved),
      'to_review',    (select count(*) from talley_mixtape.review_queue),
      'last_at',      (select max(updated_at) from talley_mixtape.contributors where not hidden)
    ),
    'rankings', coalesce((select json_agg(r) from (
        select title, artist, contributors, takes_me_back, lights_coming_on, top10
        from talley_mixtape.rankings limit 25) r), '[]'::json),
    'dj', coalesce((select json_object_agg(slot, songs) from (
        select slot, json_agg(json_build_object('title',title,'artist',artist,'contributors',contributors)
                              order by contributors desc, title) filter (where rn <= 10) as songs
        from (select d.*, row_number() over (partition by slot order by contributors desc, title) rn
              from talley_mixtape.dj_brief d) x
        group by slot) s), '{}'::json),
    'decades', coalesce((select json_agg(json_build_object('decade', decade, 'songs', songs) order by decade) from (
        select decade, json_agg(json_build_object('title',title,'artist',artist,'contributors',contributors)
                                order by contributors desc, title) filter (where rn <= 5) as songs
        from (select d.*, row_number() over (partition by decade order by contributors desc, title) rn
              from talley_mixtape.rankings_by_decade d) x
        group by decade) s), '[]'::json),
    'people', coalesce((select json_agg(p order by p.created_at desc) from (
        select c.full_name, c.email, c.ig_handle, c.era_start, c.era_end, c.marketing_opt_in, c.created_at,
               (select count(*) from talley_mixtape.picks p where p.contributor_id = c.id and not p.hidden) as picks
        from talley_mixtape.contributors c where not c.hidden) p), '[]'::json)
  )
$$;
revoke all on function public.pos_hq_mixtape() from public, anon, authenticated;
grant execute on function public.pos_hq_mixtape() to service_role;
