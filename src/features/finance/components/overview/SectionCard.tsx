'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { GoldPanel } from '@/components/common/GoldPanel';
import { Link } from '@/i18n/navigation';
import { cn } from '@/libs/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface SectionCardProps {
  title: string;
  /** Optional right-aligned link in the card header. */
  action?: { href: string; label: string };
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Stagger index — cards enter in reading order. */
  index?: number;
}

/** The shared panel shell for every overview section: framed header + body. */
export function SectionCard({
  title,
  action,
  children,
  className,
  bodyClassName,
  index = 0,
}: SectionCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0.15 : 0.32,
        delay: reduceMotion ? 0 : index * 0.05,
        ease: EASE_OUT,
      }}
      className={className}
    >
      <GoldPanel background={false} className="flex h-full flex-col">
        <header className="flex items-center gap-3 border-b border-[var(--border)] px-[14px] py-[9px]">
          <h2 className="flex-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--gold)] [font-family:var(--f-title)]">
            {title}
          </h2>
          {action && (
            <Link
              href={action.href}
              className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-mid)] no-underline transition-colors hover:text-[var(--gold)]"
            >
              {action.label}
            </Link>
          )}
        </header>

        <div className={cn('flex-1 p-4', bodyClassName)}>{children}</div>
      </GoldPanel>
    </motion.section>
  );
}
