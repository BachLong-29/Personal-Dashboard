'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { Button } from '@/components/ui/Button';
import { cn } from '@/libs/utils';

interface Props {
  label: string;
  onDownload: () => void;
  downloading: boolean;
  disabled?: boolean;
  className?: string;
}

/** Where the three sparkles sit and how far apart their twinkles are. */
const SPARKLES = [
  { top: '22%', left: '14%', delay: 0 },
  { top: '64%', left: '52%', delay: 0.9 },
  { top: '30%', left: '84%', delay: 1.7 },
];

/**
 * The download action, dressed up.
 *
 * Everything decorative is `aria-hidden` and every loop stops under
 * `prefers-reduced-motion`, so what is left for a reader who opts out (or uses
 * a screen reader) is an ordinary button with an ordinary label.
 */
export function DownloadImageButton({
  label,
  onDownload,
  downloading,
  disabled,
  className,
}: Props) {
  const reduceMotion = useReducedMotion();

  // The file arrives almost instantly, so the only moment worth celebrating is
  // the edge from downloading back to idle.
  const [justFinished, setJustFinished] = useState(false);
  const wasDownloading = useRef(false);
  useEffect(() => {
    const finished = wasDownloading.current && !downloading;
    // Record the edge before the early return, or the ref never falls back.
    wasDownloading.current = downloading;
    if (!finished) return undefined;

    setJustFinished(true);
    const timer = setTimeout(() => setJustFinished(false), 900);
    return () => clearTimeout(timer);
  }, [downloading]);

  const alive = !disabled && !reduceMotion;

  return (
    <div className={cn('relative w-full sm:w-auto', className)}>
      {/* Outer halo — lives outside the button because the button clips itself */}
      {alive && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute -inset-1 rounded-[var(--r-sm)] blur-md"
          style={{ background: 'var(--gold-glow)' }}
          animate={{ opacity: justFinished ? [0.5, 1, 0.5] : [0.15, 0.4, 0.15] }}
          transition={{ duration: justFinished ? 0.9 : 3.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      <Button
        variant="default"
        onClick={onDownload}
        disabled={disabled || downloading}
        className={cn(
          'relative w-full justify-center overflow-hidden sm:w-auto',
          'border-[oklch(0.74_0.17_85_/_0.4)]',
          'hover:border-[var(--gold)] hover:text-[var(--gold)]',
          'transition-[border-color,color,box-shadow] duration-300',
          'hover:shadow-[0_0_18px_var(--gold-glow)]',
        )}
      >
        {/* Sheen — a band of light crossing the face every few seconds */}
        {alive && (
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 w-[45%] skew-x-[-20deg]"
            style={{
              background: 'linear-gradient(90deg, transparent, oklch(1 0 0 / 0.14), transparent)',
            }}
            animate={{ left: ['-50%', '150%'] }}
            transition={{
              duration: 1.1,
              ease: 'easeInOut',
              repeat: Infinity,
              repeatDelay: downloading ? 0.2 : 2.6,
            }}
          />
        )}

        {/* Sparkles */}
        {alive &&
          SPARKLES.map((s) => (
            <motion.span
              aria-hidden
              key={s.left}
              className="pointer-events-none absolute h-[3px] w-[3px] rounded-full"
              style={{ top: s.top, left: s.left, background: 'var(--gold)' }}
              animate={{ opacity: [0, 1, 0], scale: [0.4, 1.4, 0.4] }}
              transition={{
                duration: 1.6,
                repeat: Infinity,
                repeatDelay: 1.4,
                delay: s.delay,
                ease: 'easeInOut',
              }}
            />
          ))}

        <span className="relative z-10 flex items-center gap-2">
          <DownArrow animate={alive && downloading} />
          {label}
        </span>
      </Button>
    </div>
  );
}

/** Arrow into a tray. Falls on a loop while the file is being built. */
function DownArrow({ animate }: { animate: boolean }) {
  return (
    <span aria-hidden className="relative flex h-[14px] w-[14px] items-center justify-center">
      <motion.svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        animate={animate ? { y: [-6, 3], opacity: [0, 1, 1, 0] } : { y: 0, opacity: 1 }}
        transition={
          animate ? { duration: 0.9, repeat: Infinity, ease: 'easeIn' } : { duration: 0.2 }
        }
      >
        <path d="M7 1v7" />
        <path d="M4 5.5 7 8.5l3-3" />
      </motion.svg>
      {/* The tray stays put while the arrow falls into it */}
      <svg
        className="absolute bottom-0 left-0"
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      >
        <path d="M1.5 11.5h11" />
      </svg>
    </span>
  );
}
