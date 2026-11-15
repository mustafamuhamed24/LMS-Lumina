-- =============================================================================
-- Lumina LMS — storage buckets and policies
-- Avatars are public. Course media and submission files are private and are
-- uploaded/downloaded through authorized server routes using the admin client.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
  ('course-media', 'course-media', false, 52428800, array[
    'image/png', 'image/jpeg', 'image/webp', 'image/gif',
    'application/pdf', 'text/plain', 'text/markdown',
    'video/mp4', 'video/webm', 'audio/mpeg', 'audio/mp4',
    'application/zip'
  ]),
  ('submissions', 'submissions', false, 26214400, array[
    'image/png', 'image/jpeg', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain', 'text/markdown',
    'application/zip'
  ])
on conflict (id) do nothing;

-- Public avatar reads
create policy "avatars_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

-- Users manage only their own avatar folder: avatars/{userId}/file
create policy "avatars_user_insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars_user_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "avatars_user_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- No policies for course-media / submissions: direct access is denied. The app
-- serves these through authorized server routes using the service-role client.
