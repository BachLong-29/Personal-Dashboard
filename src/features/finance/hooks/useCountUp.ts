'use client';

import { useEffect, useRef, useState } from 'react';
import { animate } from 'framer-motion';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Animates numeric changes with a smooth tween instead of snapping. */
export function useCountUp(value: number, duration = 0.7): number {
  const [display, setDisplay] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    const controls = animate(prev.current, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => setDisplay(v),
    });
    prev.current = value;
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return display;
}
