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

/** How often the strip re-checks which event is on air. */
const LIVE_TICK_MS = 30_000;

/** Is this occurrence happening right now? */
function isLive(occ: EventOccurrence, now: Date): boolean {
  // An all-day event is on for the whole day, which would leave it burning from
  // midnight — the effect is meant to say "this is happening at this moment".
  if (occ.allDay || !occ.startTime || occ.duration <= 0) return false;

  const [h = 0, m = 0] = occ.startTime.split(':').map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const start = h * 60 + m;
  return minutesNow >= start && minutesNow < start + occ.duration;
}

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

  // Coarse on purpose: a minute either side of an event starting is invisible
  // to a reader, and this re-renders the whole strip.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), LIVE_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const anyLive = events.some((occ) => isLive(occ, now));

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
        'relative shrink-0 border-b border-[var(--border)] bg-[var(--panel2)]',
        // Without motion the strip cannot carry content past the edge on its
        // own, so it hands scrolling back to the reader.
        reduceMotion ? 'overflow-x-auto' : 'overflow-hidden',
      )}
      aria-label={t('marquee.ariaLabel')}
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      {/* Something is on air — the strip's two edges catch light. Kept off the
          words themselves so the times stay legible while they scroll past. */}
      {anyLive && <AuroraEdge reduceMotion={reduceMotion} />}

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

/** The swirl's colour run — cool, warm, cool — so the loop never lands on a seam. */
const AURORA =
  'linear-gradient(90deg, var(--cyan), var(--mint), var(--gold), var(--rose), var(--violet), var(--cyan))';

/**
 * Where the sparks sit along an edge, in percent. Deliberately uneven: spaced
 * evenly they read as a dotted rule rather than as stray light.
 */
const SPARKS = [6, 19, 34, 52, 68, 81, 93];

/** Sparks are not all the same white — the art scatters a few tinted ones. */
const SPARK_TINTS = ['var(--text-hi)', 'var(--gold)', 'var(--cyan)', 'var(--violet)'];

/**
 * A drifting aurora along the top and bottom rules of the strip.
 *
 * Three layers per edge, each carrying the same gradient at a different speed:
 * a hairline for the drawn outline, a blurred ribbon that breathes behind it,
 * and a halftone of dots for texture. Because the speeds never divide into one
 * another the colours keep sliding past each other, which is what makes the
 * band look like it is flowing rather than being dragged sideways in one piece.
 * Sparks ride the line on top.
 */
function AuroraEdge({ reduceMotion }: { reduceMotion: boolean | null }) {
  const flow = (seconds: number) =>
    reduceMotion
      ? {}
      : {
          animate: { backgroundPosition: ['0% 50%', '200% 50%'] },
          transition: { duration: seconds, repeat: Infinity, ease: 'linear' as const },
        };

  return (
    <>
      {(['top', 'bottom'] as const).map((edge) => (
        <span
          key={edge}
          aria-hidden
          // Column-reverse on the bottom edge keeps the hairline against the
          // outside and the glow inside the bar, mirroring the top.
          className={cn(
            'pointer-events-none absolute inset-x-0 flex',
            edge === 'top' ? 'flex-col' : 'flex-col-reverse',
          )}
          style={{ [edge]: 0 }}
        >
          {/* The drawn line — thin and fully saturated, like the ink outline
              around the ribbons. */}
          <motion.span
            className="block h-[2px] w-full shrink-0 [background-size:200%_100%]"
            style={{ backgroundImage: AURORA }}
            {...flow(9)}
          />

          {/* The ribbon: same colours blurred wide, travelling the other way and
              breathing, so the pair never moves as one block. */}
          <motion.span
            className="block h-[9px] w-full shrink-0 blur-[5px] [background-size:200%_100%]"
            style={{ backgroundImage: AURORA }}
            animate={
              reduceMotion
                ? { opacity: 0.4 }
                : { backgroundPosition: ['200% 50%', '0% 50%'], opacity: [0.28, 0.55, 0.28] }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    backgroundPosition: { duration: 14, repeat: Infinity, ease: 'linear' },
                    opacity: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
                  }
            }
          />

          {/* Halftone — the dotted shading in the art. The mask is an alpha
              stencil, not a colour: what shows through is still the gradient. */}
          <motion.span
            className="block h-[10px] w-full shrink-0 opacity-25 [background-size:200%_100%]"
            style={{
              backgroundImage: AURORA,
              maskImage: DOT_MASK,
              maskSize: '7px 7px',
              WebkitMaskImage: DOT_MASK,
              WebkitMaskSize: '7px 7px',
            }}
            {...flow(23)}
          />

          {/* Stray light riding the line. Motion is the whole point of a spark,
              so under reduced motion they simply stay away. */}
          {!reduceMotion &&
            SPARKS.map((left, i) => {
              const tint = SPARK_TINTS[i % SPARK_TINTS.length];
              return (
                <motion.span
                  key={left}
                  className="absolute block h-[7px] w-[7px]"
                  style={{
                    [edge]: -2,
                    left: `${left}%`,
                    background: tint,
                    clipPath: SPARK_SHAPE,
                    filter: `drop-shadow(0 0 3px ${tint})`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.3, 1, 0.3],
                    rotate: [0, 90],
                    y: edge === 'top' ? [0, -3, 0] : [0, 3, 0],
                  }}
                  transition={{
                    duration: 2.2 + i * 0.35,
                    delay: i * 0.45,
                    repeat: Infinity,
                    repeatDelay: 1.2,
                    ease: 'easeInOut',
                  }}
                />
              );
            })}
        </span>
      ))}
    </>
  );
}

/** A four-point sparkle, pinched at the waist so the arms taper. */
const SPARK_SHAPE =
  'polygon(50% 0%, 58% 42%, 100% 50%, 58% 58%, 50% 100%, 42% 58%, 0% 50%, 42% 42%)';

/** Black here is opacity, not ink — `mask-image` reads the alpha channel. */
const DOT_MASK = 'radial-gradient(circle at center, #000 0.9px, transparent 1.1px)';
