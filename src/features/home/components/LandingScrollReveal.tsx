'use client';

import { useEffect } from 'react';

export function LandingScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    );
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

    const countIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const target = parseFloat(el.dataset.count ?? '0');
          const isDecimal = String(target).includes('.');
          const duration = 1400;
          const start = performance.now();
          const tick = (now: number) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const val = target * eased;
            el.textContent = isDecimal ? val.toFixed(1) : Math.round(val).toLocaleString();
            if (t < 1) requestAnimationFrame(tick);
          };
          el.textContent = '0';
          requestAnimationFrame(tick);
          countIO.unobserve(el);
        });
      },
      { threshold: 0.5 },
    );
    document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

    return () => {
      io.disconnect();
      countIO.disconnect();
    };
  }, []);

  return null;
}
