'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { GoldPanel } from '@/components/common/GoldPanel';
import { Progress, type ProgressVariant } from '@/components/ui/Progress';
import type { Budget } from '@/types';

import { formatCurrency } from '../../utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function progressVariant(pct: number): ProgressVariant {
  if (pct >= 100) return 'danger';
  if (pct >= 80) return 'gold';
  return 'mint';
}

export interface ReportBudgetPageProps {
  budgets: Budget[];
  totalBudgetLimit: number;
}

/** Trang 2 — full per-budget breakdown, each with its share of the month's total budget. */
export function ReportBudgetPage({ budgets, totalBudgetLimit }: ReportBudgetPageProps) {
  const t = useTranslations('finance');
  const reduceMotion = useReducedMotion();

  return (
    <GoldPanel
      background={false}
      className="flex h-full flex-col gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-6"
    >
      <motion.h2
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: EASE_OUT }}
        className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--gold)]"
      >
        {t('monthlyReport.budgetBreakdownTitle')}
      </motion.h2>

      {budgets.length === 0 ? (
        <p className="text-[12px] text-[var(--text-mid)]">{t('monthlyReport.noBudgets')}</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {budgets.map((b, i) => {
            const pct = Math.min(999, b.percentage);
            const shareOfTotal =
              totalBudgetLimit > 0 ? Math.round((b.limit / totalBudgetLimit) * 100) : 0;

            return (
              <motion.div
                key={b.id}
                initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0.15 : 0.3,
                  delay: i * 0.05,
                  ease: EASE_OUT,
                }}
                className="rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--panel2)] p-3"
              >
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <span className="min-w-0 truncate text-[12px] font-bold text-[var(--text-hi)]">
                    {b.categoryId ? b.categoryName : t('budget.overall')}
                  </span>
                  <span
                    className="shrink-0 text-[11px] font-bold tabular-nums"
                    style={{
                      color:
                        pct >= 100 ? 'var(--rose)' : pct >= 80 ? 'var(--gold)' : 'var(--text-mid)',
                    }}
                  >
                    {pct}%
                  </span>
                </div>

                <Progress
                  value={b.spent}
                  max={b.limit}
                  variant={progressVariant(pct)}
                  tall
                  shimmer={false}
                />

                <div className="mt-1.5 flex items-center justify-between text-[10px] text-[var(--text-lo)]">
                  <span className="tabular-nums">
                    {formatCurrency(b.spent)} / {formatCurrency(b.limit)}
                  </span>
                  {totalBudgetLimit > 0 && (
                    <span className="tabular-nums">
                      {shareOfTotal}% {t('monthlyReport.shareOfBudget')}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </GoldPanel>
  );
}
