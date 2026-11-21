import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { Providers } from '@/components/providers';
import { SupportWidget } from '@/components/support/support-widget';
import { NavigationProgress } from '@/components/shared/navigation-progress';
import { dirFor } from '@/lib/i18n/config';
import { getLocale } from '@/lib/i18n/server';
import { getPlatformSettings } from '@/lib/data/settings';

export const metadata: Metadata = {
  title: {
    default: 'Learnova LMS — Knowledge, structured.',
    template: '%s · Learnova LMS',
  },
  description:
    'Learnova is a modern learning management system for organizations, instructors and learners — courses, assessments, progress and certificates in one place.',
  applicationName: 'Learnova LMS',
  authors: [{ name: 'Mustafa Muhamed' }],
  creator: 'Mustafa Muhamed',
  publisher: 'Learnova',
  openGraph: {
    title: 'Learnova LMS',
    description: 'A modern, organization-ready learning platform.',
    type: 'website',
  },
  icons: {
    icon: '/icon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#101014' },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, settings] = await Promise.all([
    getLocale(),
    getPlatformSettings().catch(() => null),
  ]);
  const supportEmail =
    settings?.support_email || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@learnova.test';
  const supportWhatsapp =
    settings?.support_whatsapp ?? process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? '+201090861914';

  return (
    <html lang={locale} dir={dirFor(locale)} suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <Providers locale={locale}>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
          <SupportWidget email={supportEmail} whatsapp={supportWhatsapp} />
        </Providers>
      </body>
    </html>
  );
}
