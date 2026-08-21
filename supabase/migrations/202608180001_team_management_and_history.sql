-- Team management actions are SECURITY DEFINER so their authorization stays
-- atomic and independent from client-side role checks. Existing RLS policies
-- remain in force for normal table access.

create or replace function public.leave_team_workspace(target_workspace_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  workspace_type text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select type into workspace_type from workspaces where id = target_workspace_id and deleted_at is null;
  if workspace_type is distinct from 'team' then
    raise exception 'Team workspace not found';
  end if;

  select system_role into actor_role
  from workspace_members
  where workspace_id = target_workspace_id and user_id = auth.uid() and left_at is null
  for update;

  if actor_role is null then
    raise exception 'Active membership not found';
  end if;
  if actor_role = 'owner' then
    raise exception 'Transfer ownership before leaving';
  end if;

  update workspace_members
  set left_at = now()
  where workspace_id = target_workspace_id and user_id = auth.uid() and left_at is null;
end;
$$;

create or replace function public.remove_team_member(target_workspace_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_role text;
  target_role text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'Use leave_team_workspace to leave a team';
  end if;
  if not exists (select 1 from workspaces where id = target_workspace_id and type = 'team' and deleted_at is null) then
    raise exception 'Team workspace not found';
  end if;

  select system_role into actor_role
  from workspace_members
  where workspace_id = target_workspace_id and user_id = auth.uid() and left_at is null;
  select system_role into target_role
  from workspace_members
  where workspace_id = target_workspace_id and user_id = target_user_id and left_at is null
  for update;

  if actor_role not in ('owner', 'admin') then
    raise exception 'Only owners or admins can remove members';
  end if;
  if target_role is null or target_role = 'owner' then
    raise exception 'Target member cannot be removed';
  end if;
  if actor_role = 'admin' and target_role <> 'member' then
    raise exception 'Admins can remove members only';
  end if;

  update workspace_members
  set left_at = now()
  where workspace_id = target_workspace_id and user_id = target_user_id and left_at is null;
end;
$$;

create or replace function public.transfer_team_ownership(target_workspace_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if target_user_id = auth.uid() then
    raise exception 'Choose another active member';
  end if;
  if not exists (select 1 from workspaces where id = target_workspace_id and type = 'team' and deleted_at is null) then
    raise exception 'Team workspace not found';
  end if;

  perform 1
  from workspace_members
  where workspace_id = target_workspace_id and user_id = auth.uid() and system_role = 'owner' and left_at is null
  for update;
  if not found then
    raise exception 'Only the owner can transfer ownership';
  end if;

  select system_role into target_role
  from workspace_members
  where workspace_id = target_workspace_id and user_id = target_user_id and left_at is null
  for update;
  if target_role is null then
    raise exception 'Target must be an active member';
  end if;

  update workspace_members
  set system_role = 'admin'
  where workspace_id = target_workspace_id and user_id = auth.uid() and left_at is null;
  update workspace_members
  set system_role = 'owner'
  where workspace_id = target_workspace_id and user_id = target_user_id and left_at is null;
end;
$$;

create or replace function public.unshare_workout_session(target_share_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  share_workspace_id uuid;
  session_owner_id uuid;
  actor_role text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select share.workspace_id, session.owner_id
  into share_workspace_id, session_owner_id
  from workout_session_shares share
  join workout_sessions session on session.id = share.workout_session_id
  where share.id = target_share_id
  for update of share;
  if share_workspace_id is null then
    raise exception 'Shared workout not found';
  end if;

  select system_role into actor_role
  from workspace_members
  where workspace_id = share_workspace_id and user_id = auth.uid() and left_at is null;
  if session_owner_id <> auth.uid() and actor_role not in ('owner', 'admin') then
    raise exception 'Not allowed to unshare this workout';
  end if;

  delete from workout_session_shares where id = target_share_id;
end;
$$;

create or replace function public.unshare_team_body_photo(target_photo_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  photo_workspace_id uuid;
  photo_owner_id uuid;
  actor_role text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select workspace_id, owner_id into photo_workspace_id, photo_owner_id
  from body_photos
  where id = target_photo_id and deleted_at is null
  for update;
  if photo_workspace_id is null then
    raise exception 'Shared photo not found';
  end if;

  select system_role into actor_role
  from workspace_members
  where workspace_id = photo_workspace_id and user_id = auth.uid() and left_at is null;
  if photo_owner_id <> auth.uid() and actor_role not in ('owner', 'admin') then
    raise exception 'Not allowed to unshare this photo';
  end if;

  update body_photos
  set visibility = 'private', workspace_id = null
  where id = target_photo_id;
end;
$$;

create or replace function public.rename_workspace(target_workspace_id uuid, new_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  workspace_type text;
  actor_role text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if char_length(btrim(new_name)) = 0 or char_length(btrim(new_name)) > 80 then
    raise exception 'Workspace name must be between 1 and 80 characters';
  end if;

  select workspace.type, member.system_role
  into workspace_type, actor_role
  from workspaces workspace
  join workspace_members member on member.workspace_id = workspace.id
  where workspace.id = target_workspace_id and member.user_id = auth.uid() and member.left_at is null and workspace.deleted_at is null;
  if workspace_type is null or (workspace_type = 'team' and actor_role <> 'owner') then
    raise exception 'Not allowed to rename this workspace';
  end if;

  update workspaces set name = btrim(new_name) where id = target_workspace_id;
end;
$$;

create or replace function public.update_quick_workout_record(target_session_id uuid, new_weight_kg numeric, new_reps integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_set_id uuid;
  target_kind text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;
  if new_reps <= 0 then
    raise exception 'Reps must be positive';
  end if;
  if new_weight_kg is not null and new_weight_kg < 0 then
    raise exception 'Weight must not be negative';
  end if;

  select workout_set.id, exercise.kind_snapshot into target_set_id, target_kind
  from workout_sessions session
  join workout_exercises exercise on exercise.session_id = session.id
  join workout_sets workout_set on workout_set.workout_exercise_id = exercise.id
  where session.id = target_session_id
    and session.owner_id = auth.uid()
    and session.type = 'quick'
    and session.deleted_at is null
  order by exercise.position, workout_set.position
  limit 1
  for update of workout_set;
  if target_set_id is null then
    raise exception 'Quick workout set not found';
  end if;

  update workout_sets
  set weight_kg = case when target_kind = '自重' then null else new_weight_kg end, reps = new_reps
  where id = target_set_id;
end;
$$;

create or replace function public.delete_own_workout_session(target_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update workout_sessions
  set deleted_at = now()
  where id = target_session_id and owner_id = auth.uid() and deleted_at is null;
  if not found then
    raise exception 'Workout not found';
  end if;

  delete from workout_session_shares where workout_session_id = target_session_id;
end;
$$;

revoke all on function public.leave_team_workspace(uuid) from public;
revoke all on function public.remove_team_member(uuid, uuid) from public;
revoke all on function public.transfer_team_ownership(uuid, uuid) from public;
revoke all on function public.unshare_workout_session(uuid) from public;
revoke all on function public.unshare_team_body_photo(uuid) from public;
revoke all on function public.rename_workspace(uuid, text) from public;
revoke all on function public.update_quick_workout_record(uuid, numeric, integer) from public;
revoke all on function public.delete_own_workout_session(uuid) from public;
grant execute on function public.leave_team_workspace(uuid) to authenticated;
grant execute on function public.remove_team_member(uuid, uuid) to authenticated;
grant execute on function public.transfer_team_ownership(uuid, uuid) to authenticated;
grant execute on function public.unshare_workout_session(uuid) to authenticated;
grant execute on function public.unshare_team_body_photo(uuid) to authenticated;
grant execute on function public.rename_workspace(uuid, text) to authenticated;
grant execute on function public.update_quick_workout_record(uuid, numeric, integer) to authenticated;
grant execute on function public.delete_own_workout_session(uuid) to authenticated;
