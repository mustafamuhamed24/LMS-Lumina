import { getSessionUser } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: resource } = await supabase
    .from('lesson_resources')
    .select('id,lesson_id,storage_path,external_url,file_name,mime_type')
    .eq('id', id)
    .maybeSingle();

  if (!resource) return new Response('Resource not found', { status: 404 });
  if (resource.external_url && !resource.storage_path) {
    return Response.redirect(resource.external_url, 302);
  }
  if (!resource.storage_path) return new Response('Resource not found', { status: 404 });

  const { data: lesson } = await supabase.from('lessons').select('id,course_id').eq('id', resource.lesson_id).maybeSingle();
  if (!lesson) return new Response('Resource not found', { status: 404 });

  const [{ data: canAccess }, { data: canManage }] = await Promise.all([
    supabase.rpc('can_access_lesson_content', { p_lesson: lesson.id }),
    supabase.rpc('is_course_manager', { p_course: lesson.course_id }),
  ]);
  if (!canAccess && !canManage) return new Response('Forbidden', { status: 403 });

  const admin = createAdminClient();
  const { data: file, error } = await admin.storage.from('course-media').download(resource.storage_path);
  if (error || !file) return new Response('File unavailable', { status: 404 });

  return new Response(await file.arrayBuffer(), {
    headers: {
      'Content-Type': resource.mime_type ?? file.type ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(resource.file_name ?? 'resource')}"`,
      'Cache-Control': 'private, max-age=60',
    },
  });
}
