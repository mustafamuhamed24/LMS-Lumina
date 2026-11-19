import 'server-only';

import { cookies } from 'next/headers';
import { defaultLocale, isLocale, localeCookieName, type Locale } from '@/lib/i18n/config';
import { createTranslator, type Translate } from '@/lib/i18n/translator';

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(localeCookieName)?.value;
  return isLocale(value) ? value : defaultLocale;
}

export async function getTranslator(): Promise<{ locale: Locale; t: Translate }> {
  const locale = await getLocale();
  return { locale, t: createTranslator(locale) };
}
