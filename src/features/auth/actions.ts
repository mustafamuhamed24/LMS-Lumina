'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveAppUrl } from '@/lib/app-url';
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

function isEmailUnconfirmed(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code;
  const message = error instanceof Error ? error.message : '';
  return code === 'email_not_confirmed' || /email not confirmed/i.test(message);
}

/**
 * Learnova does not require email verification. Accounts created before this
 * behaviour was introduced may still be unconfirmed, so we confirm them
 * server-side before retrying the sign-in.
 */
async function confirmAccountByEmail(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (error) throw error;

  const account = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (!account) return false;

  if (!account.email_confirmed_at) {
    const { error: confirmError } = await admin.auth.admin.updateUserById(account.id, {
      email_confirm: true,
    });
    if (confirmError) throw confirmError;
  }

  return true;
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
    const credentials = {
      email: parsed.data.email,
      password: parsed.data.password,
    };

    let { data, error } = await supabase.auth.signInWithPassword(credentials);

    if (error && isEmailUnconfirmed(error)) {
      const confirmed = await confirmAccountByEmail(parsed.data.email);
      if (confirmed) {
        ({ data, error } = await supabase.auth.signInWithPassword(credentials));
      }
    }

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

    // Learnova does not require email verification, so create the account with
    // the service role: the user is confirmed on creation, no confirmation mail
    // is sent, and Supabase's signup email rate limit cannot block registration.
    const admin = createAdminClient();
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: { full_name: parsed.data.fullName },
    });

    if (createError) {
      const code = (createError as { code?: string }).code ?? '';
      if (code === 'email_exists' || /already (been )?registered|email exists/i.test(createError.message)) {
        return errorState('An account with that email already exists. Sign in instead, or reset your password.');
      }
      throw createError;
    }

    if (!created.user) return errorState('Unable to create your account. Please try again.');

    // Open a session immediately so people land in their workspace.
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });
    if (signInError) throw signInError;

    let instructorRequested = false;
    if (parsed.data.accountType === 'instructor') {
      // The signup trigger creates a student profile in the first active
      // organization. Record the teaching request there for an admin to review;
      // the role itself is never granted by public signup.
      const { data: profile } = await admin
        .from('profiles')
        .select('default_org_id')
        .eq('id', created.user.id)
        .maybeSingle();
      const orgId = profile?.default_org_id ?? null;

      if (orgId) {
        const { error: requestError } = await admin.from('instructor_requests').insert({
          user_id: created.user.id,
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
                body: `${parsed.data.fullName} (${parsed.data.email}) asked to teach on Learnova.`,
                link: '/admin/users',
              })),
            );
          }

          await admin.from('activity_logs').insert({
            org_id: orgId,
            user_id: created.user.id,
            action: 'instructor.requested',
            entity_type: 'profile',
            entity_id: created.user.id,
            metadata: { email: parsed.data.email },
          });
        }
      }
    }

    // The account is confirmed and signed in at this point, so send the person
    // straight to their workspace. `welcome=1` triggers a one-time toast.
    redirect(instructorRequested ? '/student/become-instructor?requested=1&welcome=1' : '/student?welcome=1');
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
    const appUrl = await resolveAppUrl();
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${appUrl}/auth/callback?next=/reset-password`,
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
    const appUrl = await resolveAppUrl();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${appUrl}/auth/callback` },
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
