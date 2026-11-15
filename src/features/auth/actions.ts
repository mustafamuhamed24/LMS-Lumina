'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { publicEnv } from '@/lib/env';
import { roleHome } from '@/lib/auth/session';
import { actionError, zodFieldErrors } from '@/lib/action-result';
import type { FormState } from '@/lib/form-state';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from '@/lib/validations';
import type { Role } from '@/types/app';

function errorState(message: string, fieldErrors?: Record<string, string[]>): FormState {
  return { status: 'error', message, fieldErrors };
}

function safeNext(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null;
  if (!value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  });

  if (!parsed.success) {
    return errorState('Please check your details.', zodFieldErrors(parsed.error));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) throw error;
    if (!data.user) return errorState('Unable to sign in. Please try again.');

    const { data: profile } = await supabase
      .from('profiles')
      .select('role, status')
      .eq('id', data.user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.auth.signOut();
      return errorState('Your profile is unavailable. Please contact an administrator.');
    }

    if (profile.status === 'suspended') {
      await supabase.auth.signOut();
      return errorState('This account has been suspended. Please contact support.');
    }

    await supabase.from('profiles').update({ last_login_at: new Date().toISOString() }).eq('id', data.user.id);

    const next = safeNext(formData.get('next'));
    redirect(next ?? roleHome(profile.role as Role));
  } catch (error) {
    if (error instanceof Error && 'digest' in error) throw error;
    const result = actionError(error, 'signIn');
    return errorState(result.ok ? 'Unable to sign in.' : result.error, result.ok ? undefined : result.fieldErrors);
  }
}

export async function signUpAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = signUpSchema.safeParse({
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    password: formData.get('password'),
    accountType: formData.get('accountType') ?? undefined,
    instructorNote: formData.get('instructorNote') ?? undefined,
    acceptTerms: formData.get('acceptTerms'),
  });

  if (!parsed.success) {
    return errorState('Please check your details.', zodFieldErrors(parsed.error));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: settings } = await supabase.from('platform_settings').select('allow_signups').eq('id', true).maybeSingle();

    if (settings && !settings.allow_signups) {
      return errorState('New registrations are currently disabled. Please contact your administrator.');
    }

    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: { full_name: parsed.data.fullName },
        emailRedirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard`,
      },
    });

    if (error) throw error;

    let instructorRequested = false;
    if (parsed.data.accountType === 'instructor' && data.user) {
      // The signup trigger creates a student profile in the first active
      // organization. Record the teaching request there for an admin to review;
      // the role itself is never granted by public signup.
      const admin = createAdminClient();
      const { data: profile } = await admin
        .from('profiles')
        .select('default_org_id')
        .eq('id', data.user.id)
        .maybeSingle();
      const orgId = profile?.default_org_id ?? null;

      if (orgId) {
        const { error: requestError } = await admin.from('instructor_requests').insert({
          user_id: data.user.id,
          org_id: orgId,
          status: 'pending',
          message: parsed.data.instructorNote,
        });

        if (!requestError || requestError.code === '23505') {
          instructorRequested = true;
          const { data: admins } = await admin
            .from('profiles')
            .select('id')
            .eq('default_org_id', orgId)
            .eq('role', 'org_admin')
            .eq('status', 'active');

          if (admins?.length) {
            await admin.from('notifications').insert(
              admins.map((adminUser) => ({
                org_id: orgId,
                user_id: adminUser.id,
                type: 'system' as const,
                title: 'New instructor request',
                body: `${parsed.data.fullName} (${parsed.data.email}) asked to teach on Lumina.`,
                link: '/admin/users',
              })),
            );
          }

          await admin.from('activity_logs').insert({
            org_id: orgId,
            user_id: data.user.id,
            action: 'instructor.requested',
            entity_type: 'profile',
            entity_id: data.user.id,
            metadata: { email: parsed.data.email },
          });
        }
      }
    }

    if (data.session) {
      redirect(instructorRequested ? '/student/become-instructor?requested=1' : '/student');
    }

    return {
      status: 'success',
      message: instructorRequested
        ? 'Account created. Your instructor request is pending review. Check your email to verify your address, then sign in.'
        : 'Account created. Check your email to verify your address, then sign in.',
    };
  } catch (error) {
    if (error instanceof Error && 'digest' in error) throw error;
    const result = actionError(error, 'signUp');
    return errorState(result.ok ? 'Unable to create your account.' : result.error, result.ok ? undefined : result.fieldErrors);
  }
}

export async function forgotPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return errorState('Enter a valid email address.', zodFieldErrors(parsed.error));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
    });
    if (error) throw error;
    return {
      status: 'success',
      message: 'If an account exists for that address, a password reset link has been sent.',
    };
  } catch (error) {
    const result = actionError(error, 'forgotPassword');
    return errorState(result.ok ? 'Unable to send the reset email.' : result.error);
  }
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
  });

  if (!parsed.success) {
    return errorState('Please check your new password.', zodFieldErrors(parsed.error));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorState('Your reset link is invalid or has expired. Request a new one.');
    }

    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) throw error;

    redirect('/dashboard');
  } catch (error) {
    if (error instanceof Error && 'digest' in error) throw error;
    const result = actionError(error, 'resetPassword');
    return errorState(result.ok ? 'Unable to reset your password.' : result.error);
  }
}

export async function resendVerificationAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return errorState('Enter your email address.');

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${publicEnv.NEXT_PUBLIC_APP_URL}/auth/callback?next=/dashboard` },
    });
    if (error) throw error;
    return { status: 'success', message: 'Verification email sent. Check your inbox.' };
  } catch (error) {
    const result = actionError(error, 'resendVerification');
    return errorState(result.ok ? 'Unable to resend the email.' : result.error);
  }
}

export async function signOutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect('/login');
}
