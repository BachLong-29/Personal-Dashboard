'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/libs/utils';

// Imported rather than referenced by path, so Next fingerprints it and a
// swapped logo is never served from cache.
import logo from '../../../public/logo.png';

interface Props {
  /** Sizing for the wrapper; the mark fills it. */
  className?: string;
  /** Off where the mark is too small for a highlight to read as anything. */
  sheen?: boolean;
}

/**
 * The app's mark, with a highlight travelling across it.
 *
 * The sweep is masked through the logo's own alpha rather than laid over a
 * box, so the light follows the fox's silhouette — over a square it would
 * read as a banner passing behind the logo instead of a sheen on it.
 */
export function LogoMark({ className, sheen = true }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <span className={cn('relative block', className)}>
      <Image src={logo} alt="" className="h-full w-full object-contain" priority />

      {sheen && !reduceMotion && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: SHEEN,
            backgroundSize: '250% 100%',
            maskImage: `url(${logo.src})`,
            maskSize: 'contain',
            maskRepeat: 'no-repeat',
            maskPosition: 'center',
            WebkitMaskImage: `url(${logo.src})`,
            WebkitMaskSize: 'contain',
            WebkitMaskRepeat: 'no-repeat',
            WebkitMaskPosition: 'center',
          }}
          // A long pause between passes: a highlight that never stops is a
          // flicker, not a shine.
          animate={{ backgroundPosition: ['160% 0%', '-60% 0%'] }}
          transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 3.2, ease: 'easeInOut' }}
        />
      )}
    </span>
  );
}

const SHEEN = [
  'linear-gradient(115deg,',
  'transparent 38%,',
  'oklch(1 0 0 / 0.1) 46%,',
  'oklch(1 0 0 / 0.72) 50%,',
  'oklch(1 0 0 / 0.1) 54%,',
  'transparent 62%)',
].join(' ');
