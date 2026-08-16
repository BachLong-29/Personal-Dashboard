'use client';

import { useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import { buttonVariants } from '@/components/ui/Button';
import { Progress, type ProgressVariant } from '@/components/ui/Progress';
import { Link } from '@/i18n/navigation';
import type { Budget, FinanceCategory } from '@/types';

import { formatCurrency } from '../../utils';
import { SectionCard } from './SectionCard';

const MAX_ROWS = 5;

function variantFor(pct: number): ProgressVariant {
  if (pct >= 100) return 'danger';
  if (pct >= 80) return 'gold';
  return 'mint';
}

interface BudgetProgressCardProps {
  budgets: Budget[];
  categories: FinanceCategory[];
  isLoading: boolean;
}

/** This month's budgets as progress rows — overall first, then the categories closest to their limit. */
export function BudgetProgressCard({ budgets, categories, isLoading }: BudgetProgressCardProps) {
  const t = useTranslations('finance');
  const iconByCategoryId = new Map(categories.map((c) => [c.id, c.icon]));

  const rows = [...budgets].sort((a, b) => {
    if (!a.categoryId) return -1;
    if (!b.categoryId) return 1;
    return b.percentage - a.percentage;
  });

  return (
    <SectionCard
      title={t('overview.budgetProgress')}
      action={
        budgets.length > 0 ? { href: '/finance/budget', label: t('common.viewAll') } : undefined
      }
      index={2}
    >
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[42px] animate-pulse rounded-[var(--r-md)] bg-[var(--panel2)]"
            />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-[13px] font-bold text-[var(--text-hi)]">{t('overview.noBudget')}</p>
          <p className="text-[11px] text-[var(--text-mid)]">{t('overview.noBudgetHint')}</p>
          <Link
            href="/finance/budget"
            className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mt-1' })}
          >
            {t('overview.setBudget')}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {rows.slice(0, MAX_ROWS).map((b) => {
            const remaining = b.limit - b.spent;
            const categoryId = b.categoryId;
            const isOverall = !categoryId;

            return (
              <li key={b.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Icon icon={categoryId ? (iconByCategoryId.get(categoryId) ?? '📦') : '🧮'} />
                    <span className="truncate text-[12px] font-bold text-[var(--text-hi)]">
                      {isOverall ? t('overview.overallBudget') : b.categoryName}
                    </span>
                  </span>
                  <span className="shrink-0 text-[11px] tabular-nums text-[var(--text-mid)]">
                    <span className="font-bold text-[var(--text-hi)]">
                      {formatCurrency(b.spent)}
                    </span>{' '}
                    / {formatCurrency(b.limit)}
                  </span>
                </div>

                <Progress
                  value={b.spent}
                  max={b.limit}
                  variant={variantFor(b.percentage)}
                  className="mt-2"
                  // Only the budgets still running catch the light; a spent one is done moving.
                  shimmer={b.percentage < 100}
                />

                <div className="mt-1 flex items-baseline justify-between gap-3 text-[10px]">
                  <span
                    className={remaining < 0 ? 'text-[var(--crimson)]' : 'text-[var(--text-mid)]'}
                  >
                    {remaining < 0
                      ? t('overview.over', { amount: formatCurrency(-remaining) })
                      : t('overview.left', { amount: formatCurrency(remaining) })}
                  </span>
                  <span className="tabular-nums text-[var(--text-mid)]">
                    {t('overview.used', { percent: b.percentage })}
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
