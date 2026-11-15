'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { actionError, type ActionResult } from '@/lib/action-result';

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', user.id);
    if (error) throw error;
    revalidatePath('/student/notifications');
    revalidatePath('/instructor/notifications');
    revalidatePath('/admin/notifications');
    return { ok: true };
  } catch (error) {
    return actionError(error, 'markNotificationRead');
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('read_at', null);
    if (error) throw error;
    revalidatePath('/student/notifications');
    revalidatePath('/instructor/notifications');
    revalidatePath('/admin/notifications');
    return { ok: true };
  } catch (error) {
    return actionError(error, 'markAllNotificationsRead');
  }
}

export async function markNotificationReadFormAction(formData: FormData): Promise<void> {
  const notificationId = String(formData.get('notificationId') ?? '');
  if (!notificationId) return;
  await markNotificationRead(notificationId);
}

export async function markAllNotificationsReadFormAction(): Promise<void> {
  await markAllNotificationsRead();
}
