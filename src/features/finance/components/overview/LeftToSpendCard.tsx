'use client';

import { useTranslations } from 'next-intl';

import { buttonVariants } from '@/components/ui/Button';
import { Progress } from '@/components/ui/Progress';
import { Link } from '@/i18n/navigation';
import type { Budget, FinanceOverview } from '@/types';

import { formatCurrency } from '../../utils';
import { SectionCard } from './SectionCard';

interface LeftToSpendCardProps {
  overallBudget: Budget | null;
  overview: FinanceOverview | null;
  isLoading: boolean;
}

/**
 * How much of the month's overall budget is still spendable, and what that works out to per
 * remaining day — the number the user actually acts on before spending.
 */
export function LeftToSpendCard({ overallBudget, overview, isLoading }: LeftToSpendCardProps) {
  const t = useTranslations('finance');

  if (isLoading) {
    return (
      <SectionCard title={t('overview.leftToSpend')} index={0}>
        <div className="h-[132px] animate-pulse rounded-[var(--r-md)] bg-[var(--panel2)]" />
      </SectionCard>
    );
  }

  if (!overallBudget) {
    return (
      <SectionCard title={t('overview.leftToSpend')} index={0}>
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
      </SectionCard>
    );
  }

  const remaining = overallBudget.limit - overallBudget.spent;
  const overspent = remaining < 0;
  const daysLeft = overview?.daysLeft ?? 0;
  const daysInMonth = overview?.daysInMonth ?? 30;

  // Today's allowance spreads what's left over the days left; the flat monthly rate is the
  // baseline, and the difference is what earlier days went under budget by.
  const perDay = daysLeft > 0 && remaining > 0 ? Math.floor(remaining / daysLeft) : null;
  const basePerDay = Math.floor(overallBudget.limit / daysInMonth);
  const carriedOver = perDay === null ? 0 : Math.max(0, perDay - basePerDay);

  return (
    <SectionCard title={t('overview.leftToSpend')} index={0}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span
          className="text-[22px] font-bold leading-none tabular-nums [font-family:var(--f-title)] sm:text-[30px]"
          style={{ color: overspent ? 'var(--crimson)' : 'var(--mint)' }}
        >
          {formatCurrency(Math.abs(remaining))}
        </span>
        {daysLeft > 0 && (
          <span className="text-[11px] text-[var(--text-mid)]">
            {t('overview.daysLeft', { days: daysLeft })}
          </span>
        )}
      </div>

      <p className="mt-1 text-[11px] text-[var(--text-mid)]">
        {overspent
          ? t('overview.overBudget', { amount: formatCurrency(-remaining) })
          : t('overview.ofBudget')}
      </p>

      <Progress
        value={overallBudget.spent}
        max={overallBudget.limit}
        variant={
          overallBudget.percentage >= 100
            ? 'danger'
            : overallBudget.percentage >= 80
              ? 'gold'
              : 'mint'
        }
        className="mt-2 sm:mt-3"
        tall
      />
      <p className="mt-1 text-[11px] tabular-nums text-[var(--text-mid)] sm:mt-1.5">
        {formatCurrency(overallBudget.spent)} / {formatCurrency(overallBudget.limit)} ·{' '}
        {t('overview.used', { percent: overallBudget.percentage })}
      </p>

      {perDay !== null && (
        <div className="mt-2 border-t border-[var(--border)] pt-2 sm:mt-4 sm:pt-3">
          <div className="text-[15px] font-bold tabular-nums text-[var(--gold)] [font-family:var(--f-title)] sm:text-[17px]">
            {t('overview.perDay', { amount: formatCurrency(perDay) })}
          </div>

          <p className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-[11px] text-[var(--text-mid)]">
            <span>{t('overview.baseAllowance', { amount: formatCurrency(basePerDay) })}</span>
            {carriedOver > 0 && (
              <span className="text-[var(--mint)]">
                {t('overview.carriedOver', { amount: formatCurrency(carriedOver) })}
              </span>
            )}
          </p>

          <details className="mt-1.5 group">
            <summary className="cursor-pointer list-none text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-mid)] transition-colors hover:text-[var(--gold)]">
              <span
                aria-hidden
                className="mr-1 inline-block transition-transform group-open:rotate-90"
              >
                ▸
              </span>
              {t('overview.howItsCalculated')}
            </summary>
            <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-mid)]">
              {t('overview.allowanceExplainer', { days: daysInMonth })}
            </p>
          </details>
        </div>
      )}

      <dl className="mt-2 flex gap-6 border-t border-[var(--border)] pt-2 sm:mt-4 sm:pt-3">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-mid)]">
            {t('overview.spentToday')}
          </dt>
          <dd className="mt-0.5 text-[13px] font-bold tabular-nums text-[var(--text-hi)]">
            {formatCurrency(overview?.spentToday ?? 0)}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-mid)]">
            {t('overview.spentWeek')}
          </dt>
          <dd className="mt-0.5 text-[13px] font-bold tabular-nums text-[var(--text-hi)]">
            {formatCurrency(overview?.spentWeek ?? 0)}
          </dd>
        </div>
      </dl>
    </SectionCard>
  );
}
