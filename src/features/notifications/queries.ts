import 'server-only';

import { createServerSupabaseClient } from '@/lib/supabase/server';

export type NotificationPreview = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  type: string;
  read_at: string | null;
  created_at: string;
};

export async function getNotificationSummary(userId: string) {
  const supabase = await createServerSupabaseClient();
  const [{ data: recent }, { count }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id, title, body, link, type, read_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', userId).is('read_at', null),
  ]);

  return { notifications: (recent ?? []) as NotificationPreview[], unreadCount: count ?? 0 };
}

export async function listNotifications(userId: string, limit = 100) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}
