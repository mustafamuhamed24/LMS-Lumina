'use client';

import { createContext, useContext, useMemo } from 'react';
import { defaultLocale, type Locale } from '@/lib/i18n/config';
import { createTranslator, type Translate } from '@/lib/i18n/translator';

const LocaleContext = createContext<Locale>(defaultLocale);

export function LocaleProvider({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useTranslator(): Translate {
  const locale = useLocale();
  return useMemo(() => createTranslator(locale), [locale]);
}
