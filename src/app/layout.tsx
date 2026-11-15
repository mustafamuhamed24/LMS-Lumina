import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/providers';

export const metadata: Metadata = {
  title: {
    default: 'Lumina LMS — Knowledge, structured.',
    template: '%s · Lumina LMS',
  },
  description:
    'Lumina is a modern learning management system for organizations, instructors and learners — courses, assessments, progress and certificates in one place.',
  applicationName: 'Lumina LMS',
  authors: [{ name: 'Lumina' }],
  openGraph: {
    title: 'Lumina LMS',
    description: 'A modern, organization-ready learning platform.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#101014' },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
