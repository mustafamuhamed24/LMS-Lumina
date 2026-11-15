-- =============================================================================
-- Lumina LMS — allow trusted auth triggers to update derived profile fields.
--
-- The auth service updates auth.users after signup/confirmation. That fires
-- handle_user_confirmed(), which needs to set profiles.email_verified. The
-- privilege guard intentionally blocks user-scoped writes to protected fields,
-- so the auth trigger marks the transaction as a system update first.
-- =============================================================================

create or replace function public.protect_profile_privileges()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if auth.role() = 'service_role'
     or current_setting('lumina.system_update', true) = 'on' then
    return new;
  end if;

  if new.role is distinct from old.role
     or new.status is distinct from old.status
     or new.email is distinct from old.email
     or new.email_verified is distinct from old.email_verified
     or new.default_org_id is distinct from old.default_org_id
     or new.created_at is distinct from old.created_at then
    raise exception 'Protected profile fields can only be changed by an administrator'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

create or replace function public.handle_user_confirmed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.email_confirmed_at is not null then
    -- The guard is an invoker trigger; mark this transaction as a trusted
    -- auth-driven update so the derived flag can be written.
    perform set_config('lumina.system_update', 'on', true);
    update public.profiles
      set email_verified = true
      where id = new.id and email_verified = false;
    perform set_config('lumina.system_update', 'off', true);
  end if;
  return new;
end;
$$;
