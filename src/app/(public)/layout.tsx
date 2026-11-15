import { getSessionUser } from '@/lib/auth/session';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PublicFooter, PublicHeader } from '@/components/layouts/public-shell';

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [user, settings] = await Promise.all([
    getSessionUser(),
    createServerSupabaseClient().then((supabase) =>
      supabase.from('platform_settings').select('*').eq('id', true).maybeSingle().then((result) => result.data),
    ),
  ]);
  const platformName = settings?.platform_name ?? 'Lumina LMS';

  return (
    <div className="flex min-h-dvh flex-col">
      <PublicHeader user={user} platformName={platformName} />
      <main className="flex-1">{children}</main>
      <PublicFooter platformName={platformName} />
    </div>
  );
}
