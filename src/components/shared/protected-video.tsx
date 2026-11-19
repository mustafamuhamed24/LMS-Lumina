'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { EyeOff, Lock, Play, ShieldCheck } from 'lucide-react';
import { useTranslator } from '@/lib/i18n/client';

/**
 * Deterrent player for course videos. Browsers cannot technically prevent OS
 * or hardware screen recording, so this layer removes the easy paths and makes
 * casual capture useless:
 *
 * - pauses and blurs playback when the tab or window loses focus
 * - removes the download menu, playback-rate menu and picture-in-picture
 * - blocks the context menu, dragging and save/print shortcuts
 * - burns the viewer's email into the frame so recordings are traceable
 */
export function ProtectedVideo({
  src,
  title,
  watermark,
  poster,
}: {
  src: string;
  title: string;
  watermark?: string | null;
  poster?: string | null;
}) {
  const t = useTranslator();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [interrupted, setInterrupted] = useState(false);
  const label = watermark?.trim() || 'Learnova';

  const pauseForPrivacy = useCallback(() => {
    const video = videoRef.current;
    if (video && !video.paused) {
      video.pause();
      setInterrupted(true);
    }
  }, []);

  useEffect(() => {
    const onBlur = () => pauseForPrivacy();
    const onVisibility = () => {
      if (document.hidden) pauseForPrivacy();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.ctrlKey || event.metaKey;
      if (modifier && ['s', 'p', 'u'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
    };

    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [pauseForPrivacy]);

  const resume = () => {
    setInterrupted(false);
    videoRef.current?.play().catch(() => {});
  };

  return (
    <div
      data-protected-video
      className="overflow-hidden rounded-lg border bg-black"
      onContextMenu={(event) => event.preventDefault()}
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="relative">
        <video
          ref={videoRef}
          src={src}
          poster={poster ?? undefined}
          title={title}
          controls
          controlsList="nodownload noplaybackrate noremoteplayback"
          disablePictureInPicture
          playsInline
          preload="metadata"
          className="aspect-video w-full select-none bg-black"
        >
          {t('video.unsupported')}
        </video>

        {/* Traceability watermark: repeated, low-contrast, non-interactive. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 grid grid-cols-2 gap-6 overflow-hidden p-6 opacity-[0.14] select-none"
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <span
              key={index}
              className="flex items-center justify-center -rotate-[22deg] whitespace-nowrap text-[11px] font-semibold tracking-wide text-white"
            >
              {label}
            </span>
          ))}
        </div>

        {interrupted ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/80 px-6 text-center backdrop-blur-md">
            <span className="flex size-11 items-center justify-center rounded-full bg-white/10 text-white">
              <EyeOff className="size-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{t('video.paused')}</p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-white/70">{t('video.pausedBody')}</p>
            </div>
            <button
              type="button"
              onClick={resume}
              className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-xs font-semibold text-slate-900 transition-colors hover:bg-white/90"
            >
              <Play className="size-3.5" /> {t('video.resume')}
            </button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/90 px-3 py-2 text-[11px] text-white/70">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-400" /> {t('video.secureTitle')}
        </span>
        <span className="inline-flex items-center gap-1.5 text-white/55">
          <Lock className="size-3" /> {t('video.notice')}
        </span>
      </div>
    </div>
  );
}

export function ProtectedEmbed({
  src,
  title,
  watermark,
  allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope',
}: {
  src: string;
  title: string;
  watermark?: string | null;
  allow?: string;
}) {
  const t = useTranslator();
  const label = watermark?.trim() || 'Learnova';

  return (
    <div
      data-protected-video
      className="overflow-hidden rounded-lg border bg-black"
      onContextMenu={(event) => event.preventDefault()}
    >
      <div className="relative">
        <iframe
          src={src}
          title={title}
          className="aspect-video w-full"
          allow={allow}
          referrerPolicy="strict-origin-when-cross-origin"
          sandbox="allow-scripts allow-same-origin allow-presentation"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-10 grid grid-cols-2 gap-6 overflow-hidden p-6 opacity-[0.14] select-none"
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <span
              key={index}
              className="flex items-center justify-center -rotate-[22deg] whitespace-nowrap text-[11px] font-semibold tracking-wide text-white"
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-black/90 px-3 py-2 text-[11px] text-white/70">
        <span className="inline-flex items-center gap-1.5">
          <ShieldCheck className="size-3.5 text-emerald-400" /> {t('video.secureTitle')}
        </span>
        <span className="inline-flex items-center gap-1.5 text-white/55">
          <Lock className="size-3" /> {t('video.notice')}
        </span>
      </div>
    </div>
  );
}
