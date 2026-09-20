'use client';

import { useSyncExternalStore } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * The artwork, as video rather than GIF: hardware decoded, paused by the
 * browser while the tab is hidden, and carrying a real alpha channel instead
 * of a backdrop we would have to paint the chip to match.
 *
 * Two encodings because no single one plays with alpha everywhere. Safari
 * needs HEVC, and takes it from a `video/quicktime` source — a type Chrome and
 * Firefox refuse, so they fall through to the VP9 they do support. Order
 * matters: swap these and Chrome grabs the HEVC and drops the transparency.
 */
const ART_HEVC = '/events/flame.mov';
const ART_VP9 = '/events/flame.webm';

/** Full bleed behind the chip's own text, clipped by the chip's rounded edge. */
const SHELL = 'pointer-events-none absolute inset-0 block overflow-hidden rounded-[inherit]';

/**
 * One tongue of flame: a sharp tip over a wide base. Straight edges on purpose
 * — the reference art is cel-shaded, and a rounded teardrop just reads as a blob.
 */
const TONGUE = 'polygon(50% 0%, 78% 38%, 100% 72%, 82% 100%, 18% 100%, 0% 72%, 22% 38%)';

/**
 * Outside in: cool at the edge, hot at the heart, which is the order the
 * reference burns in and the reason it reads as flame rather than as paint.
 */
const TONGUES = [
  { tint: 'var(--violet)', w: 18, h: 28, x: 1, seconds: 1.45, blur: 0.8, opacity: 0.85 },
  { tint: 'var(--rose)', w: 13, h: 20, x: 3.5, seconds: 1.1, blur: 0.4, opacity: 0.95 },
  { tint: 'var(--text-hi)', w: 6, h: 10, x: 7, seconds: 0.8, blur: 0, opacity: 0.9 },
] as const;

/** Two motes only — more in a strip this narrow turns into static. */
const EMBERS = [
  { tint: 'var(--rose)', x: 13, delay: 0, seconds: 1.9 },
  { tint: 'var(--text-hi)', x: 4, delay: 0.9, seconds: 2.3 },
] as const;

// ── Is the artwork there? ─────────────────────────────────────────────────────
// Asked once for the whole page rather than per chip, and with HEAD so the
// question costs a header exchange instead of the file itself.

let artState: 'unknown' | 'pending' | 'ready' | 'missing' = 'unknown';
const listeners = new Set<() => void>();

function probeArt() {
  if (artState !== 'unknown') return;
  artState = 'pending';

  const settle = (next: 'ready' | 'missing') => {
    artState = next;
    for (const notify of listeners) notify();
  };

  fetch(ART_VP9, { method: 'HEAD' })
    .then((res) => settle(res.ok ? 'ready' : 'missing'))
    .catch(() => settle('missing'));
}

function useArtReady(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      probeArt();
      return () => listeners.delete(onChange);
    },
    () => artState === 'ready',
    // The server cannot know, and guessing "yes" would flash an empty box.
    () => false,
  );
}

/**
 * A flame down the side of an event.
 *
 * Uses the artwork when it is present. Otherwise three tongues flicker on
 * their own clocks — none of the durations divide into another, so the shape
 * never repeats a pose — over a bloom that breathes, with embers off the tip.
 */
export function EventFlame() {
  const reduceMotion = useReducedMotion();
  const artReady = useArtReady();

  if (artReady) {
    return (
      <span aria-hidden className={SHELL}>
        <video
          // Stillness is a request the GIF could not honour; a video simply
          // holds its first frame, which `preload` is here to have ready.
          autoPlay={!reduceMotion}
          loop
          muted
          playsInline
          preload="auto"
          tabIndex={-1}
          disablePictureInPicture
          className="h-full w-full object-cover"
        >
          <source src={ART_HEVC} type="video/quicktime" />
          <source src={ART_VP9} type="video/webm" />
        </video>
      </span>
    );
  }

  return (
    <span aria-hidden className={SHELL}>
      {/* Light on the card behind the flame, not on the flame itself. */}
      <motion.span
        className="absolute right-0 bottom-0 block h-[18px] w-[22px] rounded-full bg-[var(--violet)] blur-[5px]"
        animate={reduceMotion ? { opacity: 0.3 } : { opacity: [0.22, 0.42, 0.22] }}
        transition={
          reduceMotion ? undefined : { duration: 1.7, repeat: Infinity, ease: 'easeInOut' }
        }
      />

      {TONGUES.map((tongue) => (
        <motion.span
          key={tongue.tint}
          className="absolute bottom-0 block origin-bottom"
          style={{
            right: tongue.x,
            width: tongue.w,
            height: tongue.h,
            background: tongue.tint,
            clipPath: TONGUE,
            filter: tongue.blur ? `blur(${tongue.blur}px)` : undefined,
            opacity: tongue.opacity,
          }}
          // Squeezing in x while stretching in y keeps the tongue's area roughly
          // constant, so it licks upward instead of swelling.
          animate={
            reduceMotion
              ? undefined
              : { scaleY: [1, 1.22, 0.9, 1], scaleX: [1, 0.86, 1.08, 1], x: [0, -0.8, 0.8, 0] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: tongue.seconds, repeat: Infinity, ease: 'easeInOut' }
          }
        />
      ))}

      {/* An ember is nothing but its motion, so under reduced motion there is
          nothing worth drawing. */}
      {!reduceMotion &&
        EMBERS.map((ember) => (
          <motion.span
            key={ember.tint}
            className="absolute bottom-[16px] block h-[2px] w-[2px] rounded-full"
            style={{ right: ember.x, background: ember.tint }}
            animate={{ y: [0, -14], x: [0, ember.x > 8 ? -3 : 3], opacity: [0, 0.9, 0] }}
            transition={{
              duration: ember.seconds,
              delay: ember.delay,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        ))}
    </span>
  );
}
