'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame, useMotionValue, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import { todayISO } from '@/features/tasks/utils/date.utils';
import { Link } from '@/i18n/navigation';
import { cn } from '@/libs/utils';
import type { EventOccurrence } from '@/types';

import { useEventOccurrences } from '../hooks/useEvents';

/** Pixels per second the strip travels — slow enough to read while walking past. */
const SCROLL_SPEED = 36;

/**
 * Guard against a pathological repeat count when a single pass is very narrow
 * (one short event on a wide screen).
 */
const MAX_PASSES = 24;

/**
 * A strip under the topbar listing today's events on a loop.
 *
 * Events also stay in the week view; this is an extra glance, not a move.
 */
export function EventMarquee() {
  const t = useTranslations('events');
  const reduceMotion = useReducedMotion();

  // Held in state rather than recomputed per render so the query key only
  // changes when the day actually rolls over.
  const [today, setToday] = useState(todayISO);

  // A tab left open past midnight would otherwise keep yesterday on screen.
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const timer = setTimeout(
      () => setToday(todayISO()),
      // A second of slack so the clock has certainly ticked over.
      nextMidnight.getTime() - now.getTime() + 1000,
    );
    return () => clearTimeout(timer);
  }, [today]);

  const { data: events = [] } = useEventOccurrences(today, today);

  const x = useMotionValue(0);
  const shellRef = useRef<HTMLDivElement>(null);
  const passRef = useRef<HTMLDivElement>(null);
  const paused = useRef(false);
  const [passWidth, setPassWidth] = useState(0);
  const [shellWidth, setShellWidth] = useState(0);

  // Scrolling exactly one pass lands on the start of the next one, so the reset
  // is invisible — but only if enough passes are laid out to cover the strip.
  useEffect(() => {
    const pass = passRef.current;
    const shell = shellRef.current;
    if (!pass || !shell) return;

    const measure = () => {
      setPassWidth(pass.scrollWidth);
      setShellWidth(shell.clientWidth);
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(pass);
    observer.observe(shell);
    return () => observer.disconnect();
  }, [events]);

  // One pass fills the visible strip, plus one more to feed the wrap. Two was
  // not enough: a short list left most of a wide strip empty.
  const passes = passWidth > 0 ? Math.min(MAX_PASSES, Math.ceil(shellWidth / passWidth) + 1) : 2;

  useAnimationFrame((_, delta) => {
    if (paused.current || reduceMotion || passWidth === 0) return;
    const next = x.get() - (delta / 1000) * SCROLL_SPEED;
    x.set(next <= -passWidth ? next + passWidth : next);
  });

  // Nothing today — the strip disappears rather than sitting there empty.
  if (events.length === 0) return null;

  return (
    <div
      ref={shellRef}
      className={cn(
        'shrink-0 border-b border-[var(--border)] bg-[var(--panel2)]',
        // Without motion the strip cannot carry content past the edge on its
        // own, so it hands scrolling back to the reader.
        reduceMotion ? 'overflow-x-auto' : 'overflow-hidden',
      )}
      aria-label={t('marquee.ariaLabel')}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <motion.div className="flex w-max" style={{ x: reduceMotion ? 0 : x }}>
        <EventRun ref={passRef} events={events} />
        {/* Repeats exist only to keep the strip full — the reader sees one list. */}
        {!reduceMotion &&
          Array.from({ length: passes - 1 }, (_, i) => (
            <EventRun key={i} events={events} aria-hidden />
          ))}
      </motion.div>
    </div>
  );
}

function EventRun({
  ref,
  events,
  'aria-hidden': ariaHidden,
}: {
  ref?: React.Ref<HTMLDivElement>;
  events: EventOccurrence[];
  'aria-hidden'?: boolean;
}) {
  const t = useTranslations('events');

  return (
    <div ref={ref} className="flex shrink-0 items-center" aria-hidden={ariaHidden}>
      {events.map((occ) => (
        <Link
          key={occ.id}
          href="/manage/events"
          tabIndex={ariaHidden ? -1 : undefined}
          className={cn(
            'flex shrink-0 items-center gap-1.5 px-4 py-1.5 text-[11px] no-underline',
            'transition-colors hover:bg-[oklch(0.74_0.17_85_/_0.06)]',
          )}
        >
          <span className="text-[13px] leading-none">
            <Icon icon={occ.icon} />
          </span>
          <span className="font-bold tracking-[0.04em] text-[var(--gold)] [font-family:var(--f-title)]">
            {occ.allDay ? t('marquee.allDay') : occ.startTime}
          </span>
          <span className="text-[var(--text-dim)]">·</span>
          <span className="whitespace-nowrap text-[var(--text-mid)]">{occ.title}</span>
        </Link>
      ))}
    </div>
  );
}
