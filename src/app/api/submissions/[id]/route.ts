import { getSessionUser } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: submission } = await supabase
    .from('assignment_submissions')
    .select('id,storage_path,file_name,mime_type')
    .eq('id', id)
    .maybeSingle();

  if (!submission || !submission.storage_path) return new Response('Submission not found', { status: 404 });

  const admin = createAdminClient();
  const { data: file, error } = await admin.storage.from('submissions').download(submission.storage_path);
  if (error || !file) return new Response('File unavailable', { status: 404 });

  return new Response(await file.arrayBuffer(), {
    headers: {
      'Content-Type': submission.mime_type ?? file.type ?? 'application/octet-stream',
      'Content-Disposition': `inline; filename="${encodeURIComponent(submission.file_name ?? 'submission')}"`,
      'Cache-Control': 'private, max-age=60',
    },
  });
}
