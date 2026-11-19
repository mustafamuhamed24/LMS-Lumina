import type { Locale } from '@/lib/i18n/config';
import { messages, type MessageKey } from '@/lib/i18n/messages';

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

export function createTranslator(locale: Locale): Translate {
  const table = messages[locale] ?? messages.en;

  return (key, vars) => {
    const template = table[key] ?? messages.en[key] ?? key;
    if (!vars) return template;

    return template.replace(/\{(\w+)\}/g, (_match, name: string) =>
      vars[name] === undefined ? `{${name}}` : String(vars[name]),
    );
  };
}
