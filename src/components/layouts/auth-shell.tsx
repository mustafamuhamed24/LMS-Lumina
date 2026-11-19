import { ShieldCheck, Sparkles } from 'lucide-react';
import { DevelopedBy, LearnovaLogo } from '@/components/brand/learnova-logo';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { getTranslator } from '@/lib/i18n/server';

export async function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { t } = await getTranslator();

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      <div className="absolute end-4 top-4 z-30">
        <LanguageSwitcher />
      </div>

      <aside className="relative hidden overflow-hidden bg-[oklch(0.2_0.05_277)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 surface-grid opacity-[0.08]" />
        <LearnovaLogo className="relative" markClassName="size-10" />
        <div className="relative space-y-8">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium">
              <Sparkles className="size-3.5" /> {t('auth.eyebrow')}
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-balance">
              {t('auth.heading')}
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/70">{t('auth.body')}</p>
          </div>
          <ul className="space-y-3 text-sm text-white/75">
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 shrink-0 text-emerald-300" /> {t('auth.private')}
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 shrink-0 text-emerald-300" /> {t('auth.secure')}
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="size-4 shrink-0 text-emerald-300" /> {t('auth.progress')}
            </li>
          </ul>
        </div>
        <div className="relative space-y-1 text-white/50">
          <p className="text-xs">{t('common.copyright', { year: new Date().getFullYear(), platform: 'Learnova LMS' })}</p>
          <DevelopedBy />
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <LearnovaLogo className="mb-8 lg:hidden" />
          <div className="mb-7">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
          </div>
          {children}
          <div className="mt-10 border-t pt-4 text-center text-muted-foreground lg:hidden">
            <DevelopedBy />
          </div>
        </div>
      </main>
    </div>
  );
}
