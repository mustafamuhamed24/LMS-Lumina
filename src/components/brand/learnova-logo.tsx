'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useTranslator } from '@/lib/i18n/client';

export function LearnovaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label="Learnova"
      className={cn('size-9 shrink-0', className)}
    >
      <defs>
        <linearGradient id="learnova-mark-gradient" x1="4" y1="2" x2="44" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="0.55" stopColor="#7C3AED" />
          <stop offset="1" stopColor="#A855F7" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="14" fill="url(#learnova-mark-gradient)" />
      <rect
        x="0.75"
        y="0.75"
        width="46.5"
        height="46.5"
        rx="13.25"
        fill="none"
        stroke="white"
        strokeOpacity="0.18"
        strokeWidth="1.5"
      />
      <path
        d="M15.5 13v14.75A6.75 6.75 0 0 0 22.25 34.5H34"
        fill="none"
        stroke="white"
        strokeWidth="4.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M24.5 13h5.75A3.75 3.75 0 0 1 34 16.75v5.5"
        fill="none"
        stroke="white"
        strokeOpacity="0.5"
        strokeWidth="4.25"
        strokeLinecap="round"
      />
      <circle cx="35.5" cy="13.5" r="3" fill="#F6C85F" />
      <circle cx="35.5" cy="13.5" r="1.15" fill="white" fillOpacity="0.8" />
    </svg>
  );
}

export function LearnovaLogo({  href = '/',
  compact = false,
  subtitle = 'Learning platform',
  className,
  markClassName,
}: {
  href?: string | null;
  compact?: boolean;
  subtitle?: string;
  className?: string;
  markClassName?: string;
}) {
  const content = (
    <>
      <LearnovaMark className={cn('size-8', markClassName)} />
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight">Learnova</span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.18em] opacity-60">{subtitle}</span>
        </span>
      ) : null}
    </>
  );

  const classes = cn('group inline-flex items-center gap-2.5 text-current', className);

  if (!href) return <span className={classes}>{content}</span>;

  return (
    <Link href={href} className={classes} aria-label="Learnova home">
      {content}
    </Link>
  );
}

export function Brand({ href = '/', compact = false }: { href?: string; compact?: boolean }) {
  return <LearnovaLogo href={href} compact={compact} />;
}

export function DevelopedBy({ className }: { className?: string }) {
  const t = useTranslator();

  return (
    <p className={cn('text-[11px] leading-relaxed opacity-70', className)}>
      {t('common.developedByPrefix')} <span className="font-semibold">Mustafa Muhamed</span>
    </p>
  );
}
