/**
 * Local-only storage compatibility fix.
 *
 * The storage-api image shipped with the Supabase CLI (1.27.x) uses
 * `on conflict (name, bucket_id)` when upserting objects, but the local
 * versioned storage schema only has partial/versioned unique indexes. This
 * script adds the matching unique index after the storage service has applied
 * its own migrations (i.e. after `supabase start` / `supabase db reset`).
 *
 * It connects as `supabase_storage_admin`, the owner of storage.objects.
 * Remote projects already have this index and do not need to run the script.
 */
import { Client } from 'pg';
import { loadEnvConfig } from '@next/env';

loadEnvConfig(process.cwd(), true);

const LOCAL_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

function localDatabaseUrl() {
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;

  const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (apiUrl) {
    const host = new URL(apiUrl).hostname;
    if (LOCAL_HOSTS.has(host)) {
      return `postgresql://supabase_storage_admin:postgres@${host}:54322/postgres`;
    }
  }

  return 'postgresql://supabase_storage_admin:postgres@127.0.0.1:54322/postgres';
}

async function main() {
  const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (apiUrl && !LOCAL_HOSTS.has(new URL(apiUrl).hostname) && !process.env.SUPABASE_DB_URL) {
    console.log('Storage compatibility index: skipped (remote Supabase project).');
    return;
  }

  const client = new Client({ connectionString: localDatabaseUrl() });
  try {
    await client.connect();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Could not connect to the local database as supabase_storage_admin (${message}). ` +
        'Start Supabase with `npx supabase start` and retry.',
    );
  }

  try {
    const objects = await client.query<{ exists: boolean }>("select to_regclass('storage.objects') is not null as exists");
    if (!objects.rows[0]?.exists) {
      console.log('Storage compatibility index: skipped (storage.objects does not exist yet).');
      return;
    }

    const duplicates = await client.query<{ count: string }>(
      'select count(*)::text as count from (select 1 from storage.objects group by bucket_id, name having count(*) > 1) d',
    );
    if (Number(duplicates.rows[0]?.count ?? '0') > 0) {
      console.log('Storage compatibility index: skipped (duplicate object names found).');
      return;
    }

    await client.query('create unique index if not exists objects_bucket_id_name_compat_key on storage.objects (bucket_id, name)');
    console.log('Storage compatibility index: ready.');
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
