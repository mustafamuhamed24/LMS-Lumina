import 'server-only';
import { headers } from 'next/headers';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0', '::1']);

export function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export function isLocalOrigin(value: string) {
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function configuredAppUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return raw ? trimTrailingSlash(raw) : '';
}

/**
 * Canonical public origin used in auth emails and redirects.
 *
 * `NEXT_PUBLIC_APP_URL` is the source of truth in production. If it is missing
 * or still points at localhost (for example a preview deployment that inherited
 * the development env), fall back to the incoming request host so confirmation
 * links never send users to `localhost`.
 */
export async function resolveAppUrl(): Promise<string> {
  const configured = configuredAppUrl();
  if (configured && !isLocalOrigin(configured)) return configured;

  try {
    const requestHeaders = await headers();
    const forwardedHost = requestHeaders.get('x-forwarded-host');
    const host = (forwardedHost ?? requestHeaders.get('host'))?.split(',')[0]?.trim();

    if (host) {
      const proto =
        requestHeaders.get('x-forwarded-proto')?.split(',')[0]?.trim() ||
        (host.startsWith('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
      const candidate = `${proto}://${host}`;
      if (!isLocalOrigin(candidate) || !configured) return candidate;
    }
  } catch {
    // headers() is unavailable in scripts and some build phases.
  }

  return configured || 'http://localhost:3000';
}

export function appUrlWithPath(appUrl: string, path: string) {
  const suffix = path.startsWith('/') ? path : `/${path}`;
  return `${trimTrailingSlash(appUrl)}${suffix}`;
}
