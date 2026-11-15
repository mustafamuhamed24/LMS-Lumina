-- =============================================================================
-- Local storage compatibility index
--
-- The local storage-api image used by the Supabase CLI (1.27.x) issues
-- `insert into storage.objects ... on conflict (name, bucket_id)`, while the
-- versioned storage schema only ships partial/versioned unique indexes. That
-- makes every upload fail locally with "no unique or exclusion constraint
-- matching the ON CONFLICT specification".
--
-- Hosted Supabase already has a compatible unique index, so this migration is
-- a no-op there. Migrations run as a role that does not own `storage.objects`,
-- so index creation is skipped with a notice; `npm run db:seed` (via
-- `scripts/storage-compat.ts`) re-applies it as `supabase_storage_admin` once
-- the storage service is available.
-- =============================================================================

do $$
begin
  if to_regclass('storage.objects') is null then
    raise notice 'storage.objects does not exist yet; skipping compatibility index';
    return;
  end if;

  if exists (
    select 1
    from storage.objects
    group by bucket_id, name
    having count(*) > 1
  ) then
    raise notice 'storage.objects contains duplicate (bucket_id, name) rows; skipping compatibility index';
    return;
  end if;

  begin
    execute 'create unique index if not exists objects_bucket_id_name_compat_key on storage.objects (bucket_id, name)';
  exception
    when insufficient_privilege then
      raise notice 'not owner of storage.objects; run npm run db:compat after supabase start';
  end;
end
$$;
