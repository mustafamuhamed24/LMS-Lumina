'use client';

import { useEffect, useRef, useState } from 'react';
import { Headset, Mail, MessageCircle, X } from 'lucide-react';
import { useTranslator } from '@/lib/i18n/client';
import { cn } from '@/lib/utils';

function whatsappHref(number: string, message: string) {
  const digits = number.replace(/[^\d]/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function mailtoHref(email: string, subject: string, body: string) {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export function SupportWidget({
  email,
  whatsapp,
}: {
  email: string;
  whatsapp?: string | null;
}) {
  const t = useTranslator();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
    };
  }, [open]);

  const message = t('support.message');
  const waNumber = whatsapp?.trim();

  return (
    <div ref={rootRef} className="fixed bottom-5 end-5 z-50 flex flex-col items-end gap-3 print:hidden">
      <div
        role="dialog"
        aria-label={t('support.title')}
        aria-hidden={!open}
        className={cn(
          'w-[min(20rem,calc(100vw-2.5rem))] origin-bottom-end overflow-hidden rounded-2xl border bg-card shadow-2xl transition-all duration-200',
          open ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0',
        )}
      >
        <div className="relative bg-[oklch(0.24_0.06_277)] px-4 py-4 text-white">
          <div className="absolute inset-0 surface-grid opacity-10" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{t('support.title')}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/70">{t('support.body')}</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label={t('support.close')}
              className="rounded-md p-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-2 p-3">
          {waNumber ? (
            <a
              href={whatsappHref(waNumber, message)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-emerald-500/40 hover:bg-emerald-500/5"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <MessageCircle className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium">{t('support.whatsapp')}</span>
                <span className="block text-xs text-muted-foreground">{t('support.whatsappHint')}</span>
              </span>
            </a>
          ) : null}

          <a
            href={mailtoHref(email, t('support.emailSubject'), message)}
            className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Mail className="size-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-medium">{t('support.email')}</span>
              <span className="block truncate text-xs text-muted-foreground">{t('support.emailHint')}</span>
            </span>
          </a>
        </div>
      </div>

      <button
        type="button"
        aria-label={t('support.open')}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'group flex size-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_12px_30px_-10px_color-mix(in_oklch,var(--primary)_65%,transparent)] outline-none transition-transform hover:scale-105 focus-visible:ring-4 focus-visible:ring-ring/30',
          open && 'rotate-6',
        )}
      >
        {open ? <X className="size-5" /> : <Headset className="size-5" />}
      </button>
    </div>
  );
}
