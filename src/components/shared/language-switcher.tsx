'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Languages, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale, useTranslator } from '@/lib/i18n/client';
import { setLocaleAction } from '@/lib/i18n/actions';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ compact = false, className }: { compact?: boolean; className?: string }) {
  const locale = useLocale();
  const t = useTranslator();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = locale === 'ar' ? 'en' : 'ar';

  return (
    <Button
      type="button"
      variant="ghost"
      size={compact ? 'icon-sm' : 'sm'}
      className={cn(className)}
      aria-label={t('language.switchTo')}
      title={t('language.switchTo')}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await setLocaleAction(next);
          router.refresh();
        })
      }
    >
      {pending ? <Loader2 className="animate-spin" /> : <Languages />}
      {compact ? null : <span className="text-xs font-medium">{t('common.switchTo')}</span>}
    </Button>
  );
}
