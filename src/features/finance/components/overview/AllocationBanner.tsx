'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import type { FinanceGoal } from '@/types';

import { formatCurrency, formatMonthLabel } from '../../utils';

interface AllocationBannerProps {
  /** The goal with the largest unfunded share of this month, if any. */
  goal: FinanceGoal | null;
  month: string;
  onAllocate: (goal: FinanceGoal) => void;
}

/**
 * The one thing that needs a decision this month: a goal whose monthly share hasn't been set
 * aside yet. Shows nothing when every goal is funded — a banner that's always there is wallpaper.
 */
export function AllocationBanner({ goal, month, onAllocate }: AllocationBannerProps) {
  const t = useTranslations('finance');
  const locale = useLocale();
  const reduceMotion = useReducedMotion();

  if (!goal) return null;

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-wrap items-center gap-2 rounded-[var(--r-lg)] border border-[var(--gold-border)] bg-[oklch(0.74_0.17_85_/_0.07)] px-3 py-2 sm:gap-3 sm:px-4 sm:py-3"
    >
      <span aria-hidden className="text-[13px] text-[var(--gold)]">
        ◆
      </span>
      <p className="min-w-[16ch] flex-1 text-[12px] text-[var(--text-hi)]">
        {t('overview.unallocated', {
          amount: formatCurrency(goal.unallocatedThisMonth),
          goal: goal.name,
          month: formatMonthLabel(month, locale),
        })}
      </p>
      <Button variant="ghost" size="sm" onClick={() => onAllocate(goal)}>
        {t('overview.allocateNow')}
      </Button>
    </motion.div>
  );
}
