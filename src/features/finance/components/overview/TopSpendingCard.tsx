'use client';

import { useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import type { FinanceOverview, TaskColor } from '@/types';

import { COLOR_CSS } from '../../constants';
import { formatCurrency } from '../../utils';
import { SectionCard } from './SectionCard';

interface TopSpendingCardProps {
  overview: FinanceOverview | null;
  isLoading: boolean;
}

/** Where the month's money actually went — top expense categories as proportional bars. */
export function TopSpendingCard({ overview, isLoading }: TopSpendingCardProps) {
  const t = useTranslations('finance');
  const categories = overview?.topCategories ?? [];
  const max = categories[0]?.amount ?? 0;

  return (
    <SectionCard title={t('overview.topSpending')} index={1}>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[34px] animate-pulse rounded-[var(--r-md)] bg-[var(--panel2)]"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <p className="text-[12px] text-[var(--text-mid)]">{t('overview.noSpending')}</p>
      ) : (
        <ul className="flex flex-col gap-1.5 sm:gap-3">
          {categories.map((c) => {
            const accent = COLOR_CSS[c.color as TaskColor] ?? 'var(--gold)';
            const width = max > 0 ? Math.max(4, Math.round((c.amount / max) * 100)) : 0;

            return (
              <li key={c.categoryId}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-[var(--text-hi)]">
                    <Icon icon={c.icon} />
                    <span className="truncate">{c.name}</span>
                  </span>
                  <span className="shrink-0 text-[12px] font-bold tabular-nums text-[var(--text-hi)]">
                    {formatCurrency(c.amount)}
                  </span>
                </div>

                <div className="mt-1 flex items-center gap-2 sm:mt-1.5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--bg-3)]">
                    <div
                      className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                      style={{ width: `${width}%`, background: accent }}
                    />
                  </div>
                  <span className="w-9 shrink-0 text-right text-[10px] tabular-nums text-[var(--text-mid)]">
                    {c.percentage}%
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
