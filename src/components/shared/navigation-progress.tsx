'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Thin top progress bar for client-side navigation. Server actions keep their
 * own in-button spinners, so this only reacts to internal link clicks. It
 * clears as soon as the new route renders, or after a safety timeout.
 */
export function NavigationProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [active, setActive] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clear = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = null;
    };

    const stop = () => {
      clear();
      setActive(false);
    };

    const onSubmit = (event: SubmitEvent) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const method = (form.getAttribute('method') ?? 'get').toLowerCase();
      if (method !== 'get') return;

      clear();
      setActive(true);
      timer.current = setTimeout(() => setActive(false), 12000);
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#')) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;

      clear();
      setActive(true);
      timer.current = setTimeout(() => setActive(false), 12000);
    };

    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
      clear();
    };
  }, []);

  useEffect(() => {
    setActive(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden"
      data-active={active}
    >
      <div
        className={
          active
            ? 'h-full w-full origin-left animate-[route-progress_1.15s_ease-in-out_infinite] bg-primary'
            : 'h-full w-full bg-transparent'
        }
      />
    </div>
  );
}
