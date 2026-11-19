export const locales = ['en', 'ar'] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeCookieName = 'learnova_locale';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  ar: 'العربية',
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

export function dirFor(locale: Locale) {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
