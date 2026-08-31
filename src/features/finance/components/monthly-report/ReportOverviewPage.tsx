'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

import { Icon } from '@/components/common/Icon';
import { GoldPanel } from '@/components/common/GoldPanel';
import type { Budget, OverviewCategorySlice, TaskColor } from '@/types';

import { COLOR_CSS } from '../../constants';
import { useCountUp } from '../../hooks/useCountUp';
import { formatCurrency } from '../../utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface StatTileProps {
  label: string;
  value: number;
  variant: 'mint' | 'rose' | 'gold';
  delay: number;
}

const STAT_COLOR: Record<StatTileProps['variant'], string> = {
  mint: 'var(--mint)',
  rose: 'var(--rose)',
  gold: 'var(--gold)',
};

function StatTile({ label, value, variant, delay }: StatTileProps) {
  const reduceMotion = useReducedMotion();
  const animated = useCountUp(value);

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0.15 : 0.35, delay, ease: EASE_OUT }}
      className="flex flex-col gap-1 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--panel2)] p-2.5 sm:p-3"
    >
      <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--text-lo)]">{label}</span>
      <span
        className="truncate text-[14px] font-bold tabular-nums sm:text-[17px]"
        style={{ color: STAT_COLOR[variant] }}
      >
        {formatCurrency(animated)}
      </span>
    </motion.div>
  );
}

export interface ReportOverviewPageProps {
  monthLabel: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  savings: number | null;
  savingsPercent: number | null;
  overBudget: Budget[];
  topCategories: OverviewCategorySlice[];
}

/** Trang 1 — headline numbers, warnings, and a spending breakdown donut. */
export function ReportOverviewPage({
  monthLabel,
  totalIncome,
  totalExpense,
  balance,
  savings,
  savingsPercent,
  overBudget,
  topCategories,
}: ReportOverviewPageProps) {
  const t = useTranslations('finance');
  const reduceMotion = useReducedMotion();

  return (
    <GoldPanel
      background={false}
      className="flex h-full flex-col gap-3 overflow-y-auto p-3 sm:gap-4 sm:p-6"
    >
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.15 : 0.3, ease: EASE_OUT }}
      >
        <div className="text-[9px] uppercase tracking-[0.2em] text-[var(--gold)]">
          {t('monthlyReport.page1Eyebrow')}
        </div>
        <h1 className="text-[19px] font-bold tracking-[0.02em] text-[var(--text-hi)] [font-family:var(--f-title)] sm:text-[24px]">
          {monthLabel}
        </h1>
      </motion.div>

      <div className="grid grid-cols-3 gap-2">
        <StatTile label={t('overview.income')} value={totalIncome} variant="mint" delay={0.05} />
        <StatTile label={t('overview.expense')} value={totalExpense} variant="rose" delay={0.1} />
        <StatTile
          label={t('monthlyReport.netBalance')}
          value={balance}
          variant="gold"
          delay={0.15}
        />
      </div>

      {savings != null && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.35, delay: 0.2, ease: EASE_OUT }}
          className="rounded-[var(--r-lg)] border border-[oklch(0.76_0.14_162_/_0.4)] bg-[oklch(0.76_0.14_162_/_0.09)] p-3 text-[12px] text-[var(--text-hi)]"
        >
          🎉{' '}
          {t('monthlyReport.savingsBanner', {
            amount: formatCurrency(savings),
            percent: savingsPercent ?? 0,
          })}
        </motion.div>
      )}

      {overBudget.length > 0 && (
        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.35, delay: 0.25, ease: EASE_OUT }}
          className="rounded-[var(--r-lg)] border border-[oklch(0.72_0.18_5_/_0.4)] bg-[oklch(0.72_0.18_5_/_0.08)] p-3"
        >
          <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--rose)]">
            ⚠ {t('monthlyReport.overBudgetTitle')}
          </div>
          <ul className="flex flex-col gap-1">
            {overBudget.map((b) => (
              <li
                key={b.id}
                className="flex items-center justify-between gap-2 text-[11px] text-[var(--text-hi)]"
              >
                <span className="min-w-0 truncate">
                  {b.categoryId ? b.categoryName : t('budget.overall')}
                </span>
                <span className="shrink-0 font-bold text-[var(--rose)] tabular-nums">
                  {formatCurrency(b.spent - b.limit)} · {b.percentage}%
                </span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.15 : 0.35, delay: 0.3, ease: EASE_OUT }}
        className="flex min-h-0 flex-1 flex-col gap-2"
      >
        <h2 className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--gold)]">
          {t('monthlyReport.spendingBreakdown')}
        </h2>
        {topCategories.length === 0 ? (
          <p className="text-[12px] text-[var(--text-mid)]">{t('overview.noSpending')}</p>
        ) : (
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-5">
            <div className="h-[140px] w-[140px] shrink-0 sm:h-[160px] sm:w-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topCategories}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="90%"
                    paddingAngle={2}
                    isAnimationActive={!reduceMotion}
                  >
                    {topCategories.map((c) => (
                      <Cell
                        key={c.categoryId}
                        fill={COLOR_CSS[c.color as TaskColor] ?? 'var(--gold)'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'var(--panel2)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: 'var(--text-mid)' }}
                    formatter={(value) => [formatCurrency(Number(value)), '']}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex w-full min-w-0 flex-col gap-1.5">
              {topCategories.map((c) => (
                <li key={c.categoryId} className="flex items-center gap-2 text-[12px]">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: COLOR_CSS[c.color as TaskColor] ?? 'var(--gold)' }}
                  />
                  <Icon icon={c.icon} className="shrink-0 text-[13px]" />
                  <span className="min-w-0 flex-1 truncate text-[var(--text-hi)]">{c.name}</span>
                  <span className="shrink-0 font-bold tabular-nums text-[var(--text-hi)]">
                    {c.percentage}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </motion.div>
    </GoldPanel>
  );
}
