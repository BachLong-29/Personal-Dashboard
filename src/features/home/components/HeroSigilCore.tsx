'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { LogoMark } from '@/components/common/LogoMark';

/**
 * The sphere at the centre of the hero sigil.
 *
 * Violet rather than the gold it used to be: the gold was chosen as a backdrop
 * for a black letter, and the logo's own artwork is cool-toned — on gold it
 * fought the background instead of sitting in it. The orbit rings stay gold,
 * so the two still read as one ornament.
 *
 * Its own component because LandingHero renders on the server, and the pulse
 * needs a client. Rebuilt in framer rather than reusing `.lp-sigil-core`,
 * whose keyframes repaint the gold glow on every cycle and would override
 * anything set from here.
 */
export function HeroSigilCore() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={core}
      // The rim keeps the circle legible once the fill is mostly see-through.
      style={{
        background: SPHERE,
        border: '1px solid color-mix(in oklch, var(--violet) 30%, transparent)',
      }}
      animate={
        reduceMotion ? { boxShadow: GLOW_LOW } : { boxShadow: [GLOW_LOW, GLOW_HIGH, GLOW_LOW] }
      }
      transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <LogoMark className="h-[62%] w-[62%]" />
    </motion.div>
  );
}

/**
 * Tinted glass, not a solid ball: every stop mixes toward `transparent`, so the
 * starfield and aurora behind the hero keep showing through while the orb still
 * reads as violet. Densest where the light falls, thinnest at the rim.
 */
const SPHERE = [
  'radial-gradient(circle at 40% 30%,',
  'color-mix(in oklch, var(--violet) 42%, transparent) 0%,',
  'color-mix(in oklch, var(--violet) 26%, transparent) 45%,',
  'color-mix(in oklch, var(--violet) 8%, transparent) 88%)',
].join(' ');

// A lit top edge only. The old rule also darkened the bottom, which on a
// translucent orb reads as a smudge rather than as volume.
const INSET = 'inset 0 8px 20px color-mix(in oklch, white 16%, transparent)';

const GLOW_LOW = `0 0 60px var(--violet-glow), 0 0 120px color-mix(in oklch, var(--violet) 25%, transparent), ${INSET}`;
const GLOW_HIGH = `0 0 90px color-mix(in oklch, var(--violet) 60%, transparent), 0 0 160px color-mix(in oklch, var(--violet) 32%, transparent), ${INSET}`;

// 86px below 640px, 140px above — the sizes the old rule used.
const core = [
  'relative z-[2] flex h-[86px] w-[86px] items-center justify-center rounded-full',
  'backdrop-blur-[3px] sm:h-[140px] sm:w-[140px]',
].join(' ');
