import Link from 'next/link';
import type { SessionUser } from '@/types/app';
import { Badge } from '@/components/ui/badge';
import { Brand, DevelopedBy } from '@/components/brand/learnova-logo';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { getTranslator } from '@/lib/i18n/server';
import { roleHome } from '@/lib/roles';

export async function PublicHeader({ user, platformName }: { user: SessionUser | null; platformName: string }) {
  const { t } = await getTranslator();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Brand />
          <nav className="hidden items-center gap-6 text-sm md:flex">
            <Link href="/courses" className="text-muted-foreground transition-colors hover:text-foreground">
              {t('header.courses')}
            </Link>
            <Link href="/#for-organizations" className="text-muted-foreground transition-colors hover:text-foreground">
              {t('header.organizations')}
            </Link>
            <Link href="/verify" className="text-muted-foreground transition-colors hover:text-foreground">
              {t('header.verify')}
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <Link
              href={roleHome(user.profile.role)}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              <span className="hidden sm:inline">
                {t('header.yourDashboard', { name: user.profile.full_name.split(' ')[0] ?? user.profile.full_name })}
              </span>
              <span className="sm:hidden">{t('header.dashboard')}</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden h-9 items-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
              >
                {t('common.signIn')}
              </Link>
              <Link
                href="/register"
                className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
              >
                {t('header.getStarted')}
              </Link>
            </>
          )}
        </div>
      </div>
      <div className="border-t bg-muted/30 px-4 py-1.5 text-center text-[11px] text-muted-foreground md:hidden">
        {platformName} &middot; {t('header.tagline')}
      </div>
    </header>
  );
}

export async function PublicFooter({ platformName }: { platformName: string }) {
  const { t } = await getTranslator();

  return (
    <footer className="border-t bg-muted/25">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div className="space-y-3 md:col-span-2">
          <Brand />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            {t('footer.about', { platform: platformName })}
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('footer.platform')}</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/courses" className="text-muted-foreground hover:text-foreground">
                {t('footer.catalog')}
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-muted-foreground hover:text-foreground">
                {t('footer.createAccount')}
              </Link>
            </li>
            <li>
              <Link href="/verify" className="text-muted-foreground hover:text-foreground">
                {t('footer.certificateVerification')}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('footer.access')}</p>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                {t('footer.studentSignIn')}
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                {t('footer.instructorSignIn')}
              </Link>
            </li>
            <li>
              <Link href="/login" className="text-muted-foreground hover:text-foreground">
                {t('footer.adminSignIn')}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t px-4 py-5">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <span>{t('common.copyright', { year: new Date().getFullYear(), platform: platformName })}</span>
            <DevelopedBy />
          </div>
          <Badge variant="outline" className="font-normal">
            {t('common.secured')}
          </Badge>
        </div>
      </div>
    </footer>
  );
}
