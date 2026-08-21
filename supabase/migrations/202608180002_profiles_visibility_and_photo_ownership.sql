-- Profile names are visible only to the profile owner and users who share an
-- active team or a team activity with that profile. Existing policy names are
-- environment-specific, so replace the complete policy set deliberately.

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon, authenticated;
grant select, insert, update on table public.profiles to authenticated;

do $$
declare
  policy_name text;
begin
  for policy_name in
    select policyname from pg_policies where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', policy_name);
  end loop;
end;
$$;

create policy "profiles_select_self_or_team_activity"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
  or exists (
    select 1
    from public.workspace_members viewer
    join public.workspace_members peer on peer.workspace_id = viewer.workspace_id
    where viewer.user_id = (select auth.uid())
      and viewer.left_at is null
      and peer.user_id = profiles.id
      and peer.left_at is null
  )
  or exists (
    select 1
    from public.workspace_members viewer
    join public.workout_session_shares share on share.workspace_id = viewer.workspace_id
    join public.workout_sessions session on session.id = share.workout_session_id
    where viewer.user_id = (select auth.uid())
      and viewer.left_at is null
      and session.owner_id = profiles.id
      and session.deleted_at is null
  )
  or exists (
    select 1
    from public.workspace_members viewer
    join public.body_photos photo on photo.workspace_id = viewer.workspace_id
    where viewer.user_id = (select auth.uid())
      and viewer.left_at is null
      and photo.owner_id = profiles.id
      and photo.visibility = 'team'
      and photo.deleted_at is null
  )
);

create policy "profiles_insert_self"
on public.profiles
for insert
to authenticated
with check (id = (select auth.uid()));

create policy "profiles_update_self"
on public.profiles
for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Owner/Admin must not override another person's photo ownership. A member may
-- unshare only their own photo; deletion continues through the existing owner
-- Storage and body_photos deletion path in the client.
create or replace function public.unshare_team_body_photo(target_photo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  photo_owner_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select owner_id into photo_owner_id
  from body_photos
  where id = target_photo_id and deleted_at is null and visibility = 'team'
  for update;
  if photo_owner_id is null then
    raise exception 'Shared photo not found';
  end if;
  if photo_owner_id <> auth.uid() then
    raise exception 'Only the photo owner can unshare this photo';
  end if;

  update body_photos
  set visibility = 'private', workspace_id = null
  where id = target_photo_id;
end;
$$;

revoke all on function public.unshare_team_body_photo(uuid) from public;
grant execute on function public.unshare_team_body_photo(uuid) to authenticated;
