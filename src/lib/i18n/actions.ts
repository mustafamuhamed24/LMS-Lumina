'use server';

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { isLocale, localeCookieName } from '@/lib/i18n/config';

export async function setLocaleAction(locale: string) {
  if (!isLocale(locale)) return { ok: false as const };

  const store = await cookies();
  store.set(localeCookieName, locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  revalidatePath('/', 'layout');
  return { ok: true as const, locale };
}
