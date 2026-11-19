import { NextResponse, type NextRequest } from 'next/server';
import { resolveAppUrl } from '@/lib/app-url';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const ALLOWED_OTP_TYPES = ['signup', 'invite', 'magiclink', 'recovery', 'email_change', 'email'] as const;
type OtpType = (typeof ALLOWED_OTP_TYPES)[number];

function safeNext(value: string | null): string | null {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return null;
  return value;
}

function landingPath(type: string | null, requestedNext: string | null) {
  if (requestedNext) return requestedNext;
  if (type === 'recovery') return '/reset-password';
  if (type === 'signup') return '/login?confirmed=1';
  return '/dashboard';
}

function redirectTo(appUrl: string, path: string) {
  return NextResponse.redirect(new URL(path, appUrl));
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const appUrl = await resolveAppUrl();
  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const rawType = url.searchParams.get('type');
  const requestedNext = safeNext(url.searchParams.get('next'));
  const next = landingPath(rawType, requestedNext);
  const providerError = url.searchParams.get('error_code') ?? url.searchParams.get('error');

  if (providerError) return redirectTo(appUrl, '/login?error=link_expired');

  const supabase = await createServerSupabaseClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return redirectTo(appUrl, next);
  }

  if (tokenHash && rawType && ALLOWED_OTP_TYPES.includes(rawType as OtpType)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: rawType as OtpType });
    if (!error) return redirectTo(appUrl, next);
  }

  return redirectTo(appUrl, '/login?error=link_expired');
}
