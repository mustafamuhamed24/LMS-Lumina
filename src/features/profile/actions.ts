'use server';

import 'server-only';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth/session';
import { actionError, zodFieldErrors } from '@/lib/action-result';
import { changePasswordSchema, profileSchema } from '@/lib/validations';
import type { FormState } from '@/lib/form-state';

const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export async function updateProfileAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = profileSchema.safeParse({
    fullName: formData.get('fullName'),
    headline: formData.get('headline'),
    bio: formData.get('bio'),
  });
  if (!parsed.success) {
    return { status: 'error', message: 'Please review your profile details.', fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    const user = await requireUser();
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: parsed.data.fullName,
        headline: parsed.data.headline,
        bio: parsed.data.bio,
      })
      .eq('id', user.id);
    if (error) throw error;

    revalidatePath('/student/profile');
    revalidatePath('/admin/settings');
    revalidatePath('/instructor');
    revalidatePath('/student');
    return { status: 'success', message: 'Profile updated.' };
  } catch (error) {
    const result = actionError(error, 'updateProfile');
    return { status: 'error', message: result.ok ? 'Unable to update your profile.' : result.error };
  }
}

export async function uploadAvatarAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const file = formData.get('avatar');
  if (!(file instanceof File) || file.size === 0) {
    return { status: 'error', message: 'Choose an image to upload.' };
  }
  if (!AVATAR_TYPES.includes(file.type)) {
    return { status: 'error', message: 'Use a PNG, JPG, WEBP or GIF image.' };
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return { status: 'error', message: 'Images must be 2 MB or smaller.' };
  }

  try {
    const user = await requireUser();
    const supabase = await createServerSupabaseClient();
    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'png';
    const path = `${user.id}/avatar-${Date.now()}.${extension}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const { error } = await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    if (error) throw error;

    revalidatePath('/student/profile');
    revalidatePath('/admin/settings');
    return { status: 'success', message: 'Photo updated.' };
  } catch (error) {
    const result = actionError(error, 'uploadAvatar');
    return { status: 'error', message: result.ok ? 'Unable to upload the image.' : result.error };
  }
}

export async function removeAvatarAction(): Promise<void> {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
  revalidatePath('/student/profile');
  revalidatePath('/admin/settings');
}

export async function changePasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get('currentPassword'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });
  if (!parsed.success) {
    return { status: 'error', message: 'Please review your password details.', fieldErrors: zodFieldErrors(parsed.error) };
  }

  try {
    const user = await requireUser();
    const supabase = await createServerSupabaseClient();
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: parsed.data.currentPassword,
    });
    if (verifyError) return { status: 'error', message: 'Your current password is incorrect.' };

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) throw error;
    return { status: 'success', message: 'Password changed successfully.' };
  } catch (error) {
    const result = actionError(error, 'changePassword');
    return { status: 'error', message: result.ok ? 'Unable to change your password.' : result.error };
  }
}
