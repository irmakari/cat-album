-- The leaderboard: the user and their friends, by cats found this week and
-- by kinds of cat in their album.
--
-- Only cats the phone recognised as cats count. To keep it a game rather
-- than a dare, at most ten cats a day count, and a cat added more than two
-- days after it was seen does not count for its week, so a week cannot be
-- filled in afterwards. Only the totals ever leave the database.

create or replace function public.friends_leaderboard(tz text default 'UTC', week_offset integer default 0)
returns table (
  user_id uuid,
  username text,
  week_cats integer,
  kinds integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  me uuid := auth.uid();
  zone text := coalesce(nullif(btrim(tz), ''), 'UTC');
  local_start timestamp;
  week_start timestamptz;
  week_end timestamptz;
begin
  if me is null then
    raise exception 'Not signed in';
  end if;
  if not public.is_permanent() then
    raise exception 'Needs an account' using errcode = 'P0003';
  end if;
  if week_offset not between -1 and 0 then
    raise exception 'Only this week and last week';
  end if;
  -- Weeks are the viewer's: Monday to Sunday where they are.
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = zone) then
    zone := 'UTC';
  end if;
  local_start := date_trunc('week', now() at time zone zone) + make_interval(weeks => week_offset);
  week_start := local_start at time zone zone;
  week_end := (local_start + interval '7 days') at time zone zone;

  return query
    with circle as (
      select me as member
      union
      select case when f.requester_id = me then f.addressee_id else f.requester_id end
      from public.friendships f
      where f.status = 'accepted' and (f.requester_id = me or f.addressee_id = me)
    ),
    members as (
      select p.id, p.username
      from public.profiles p
      join circle c on c.member = p.id
      -- The viewer always sees themselves, even with the setting off.
      where p.on_leaderboard or p.id = me
    ),
    per_day as (
      select c.user_id as member, least(count(*), 10) as found
      from public.cats c
      join members m on m.id = c.user_id
      where c.has_cat
        and c.seen_at >= week_start
        and c.seen_at < week_end
        and c.created_at < c.seen_at + interval '2 days'
      group by c.user_id, (c.seen_at at time zone zone)::date
    ),
    week as (
      select d.member, sum(d.found)::integer as found
      from per_day d
      group by d.member
    ),
    album as (
      select c.user_id as member, count(distinct c.breed)::integer as kinds
      from public.cats c
      join members m on m.id = c.user_id
      where c.has_cat
      group by c.user_id
    )
    select m.id, m.username, coalesce(w.found, 0), coalesce(a.kinds, 0)
    from members m
    left join week w on w.member = m.id
    left join album a on a.member = m.id
    order by coalesce(w.found, 0) desc, coalesce(a.kinds, 0) desc, m.username;
end;
$$;

revoke execute on function public.friends_leaderboard(text, integer) from public, anon;
grant execute on function public.friends_leaderboard(text, integer) to authenticated;
