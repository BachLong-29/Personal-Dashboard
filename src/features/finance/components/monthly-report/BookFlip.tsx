'use client';

import { useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from 'framer-motion';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const SWIPE_THRESHOLD = 80;

interface BookFlipProps {
  pages: ReactNode[];
  labels: { prev: string; next: string; page: (n: number, total: number) => string };
}

/** A 2-page (or more) "book" with a 3D page-turn transition — click, swipe, or dot-jump between pages. */
export function BookFlip({ pages, labels }: BookFlipProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const reduceMotion = useReducedMotion();

  function go(next: number) {
    if (next < 0 || next >= pages.length || next === index) return;
    setDirection(next > index ? 1 : -1);
    setIndex(next);
  }

  function handleDragEnd(_e: unknown, info: PanInfo) {
    if (info.offset.x <= -SWIPE_THRESHOLD) go(index + 1);
    else if (info.offset.x >= SWIPE_THRESHOLD) go(index - 1);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        className="relative min-h-0 flex-1"
        style={{ perspective: reduceMotion ? undefined : 1600 }}
      >
        <AnimatePresence mode="wait" custom={direction} initial={false}>
          <motion.div
            key={index}
            custom={direction}
            drag={pages.length > 1 ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.15}
            onDragEnd={handleDragEnd}
            initial={
              reduceMotion ? { opacity: 0 } : { rotateY: direction > 0 ? 78 : -78, opacity: 0 }
            }
            animate={reduceMotion ? { opacity: 1 } : { rotateY: 0, opacity: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { rotateY: direction > 0 ? -78 : 78, opacity: 0 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.5, ease: EASE_OUT }}
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: direction > 0 ? 'left center' : 'right center',
            }}
            className="h-full"
          >
            {pages[index]}
          </motion.div>
        </AnimatePresence>
      </div>

      {pages.length > 1 && (
        <div className="flex shrink-0 items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => go(index - 1)}
            disabled={index === 0}
            aria-label={labels.prev}
            className={navBtn}
          >
            ◂
          </button>
          <div className="flex items-center gap-1.5">
            {pages.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => go(i)}
                aria-label={labels.page(i + 1, pages.length)}
                aria-current={i === index}
                className={i === index ? dotActive : dot}
              />
            ))}
          </div>
          <button
            type="button"
            onClick={() => go(index + 1)}
            disabled={index === pages.length - 1}
            aria-label={labels.next}
            className={navBtn}
          >
            ▸
          </button>
        </div>
      )}
    </div>
  );
}

const navBtn =
  'flex h-8 w-8 items-center justify-center rounded-full border border-[var(--border)] text-[14px] text-[var(--text-mid)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)] disabled:pointer-events-none disabled:opacity-30 cursor-pointer';
const dot = 'h-1.5 w-1.5 rounded-full bg-[var(--border-hi)] transition-all cursor-pointer';
const dotActive = 'h-1.5 w-4 rounded-full bg-[var(--gold)] transition-all cursor-pointer';
