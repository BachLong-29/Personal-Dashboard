'use client';

import { useLocale, useTranslations } from 'next-intl';

import type { FinanceOverview } from '@/types';

import { useBudgets } from '../../hooks/useBudgets';
import { formatCurrency, formatMonthLabel, monthBudgetLimit } from '../../utils';
import { SectionCard } from './SectionCard';

interface MonthSummaryCardProps {
  overview: FinanceOverview | null;
  month: string;
  isLoading: boolean;
}

/**
 * Income, expense and two readings of savings for the selected month.
 *
 * The first is what happened — income minus what was actually spent. The
 * second is what was meant to happen — income minus the month's budget — so a
 * month still in progress can be read against its plan rather than only
 * against a total that is not finished yet.
 */
export function MonthSummaryCard({ overview, month, isLoading }: MonthSummaryCardProps) {
  const t = useTranslations('finance');
  const locale = useLocale();
  const { data: budgets = [] } = useBudgets(month);

  const income = overview?.income ?? 0;
  const net = overview?.net ?? 0;
  const rate = overview?.savingsRate ?? null;

  const budgetLimit = monthBudgetLimit(budgets);
  // No budget set is not zero planned spending — there is simply no plan to
  // compare against, and a dash says that where a number would lie.
  const planNet = budgetLimit > 0 ? income - budgetLimit : null;
  const planRate = planNet !== null && income > 0 ? Math.round((planNet / income) * 100) : null;

  return (
    <SectionCard title={formatMonthLabel(month, locale)} index={1}>
      {isLoading ? (
        <div className="h-[72px] animate-pulse rounded-[var(--r-md)] bg-[var(--panel2)]" />
      ) : (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3 sm:gap-x-4 sm:gap-y-4">
          <Stat
            label={t('overview.income')}
            value={formatCurrency(overview?.income ?? 0)}
            tone="mint"
          />
          <Stat
            label={t('overview.expense')}
            value={formatCurrency(overview?.expense ?? 0)}
            tone="rose"
          />
          <Stat
            label={t('overview.savings')}
            value={formatCurrency(net)}
            tone={net < 0 ? 'rose' : 'gold'}
          />
          <Stat
            label={t('overview.savingsRate')}
            value={rate === null ? '—' : `${rate}%`}
            tone={rate !== null && rate < 0 ? 'rose' : 'text'}
          />
          <Stat
            label={t('overview.savingsPlan')}
            value={planNet === null ? '—' : formatCurrency(planNet)}
            tone={planNet !== null && planNet < 0 ? 'rose' : 'gold'}
          />
          <Stat
            label={t('overview.savingsPlanRate')}
            value={planRate === null ? '—' : `${planRate}%`}
            tone={planRate !== null && planRate < 0 ? 'rose' : 'text'}
          />
        </dl>
      )}
    </SectionCard>
  );
}

const TONE: Record<string, string> = {
  mint: 'var(--mint)',
  rose: 'var(--rose)',
  gold: 'var(--gold)',
  text: 'var(--text-hi)',
};

function Stat({ label, value, tone }: { label: string; value: string; tone: keyof typeof TONE }) {
  return (
    <div className="min-w-0">
      <dt className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-mid)]">
        {label}
      </dt>
      <dd
        className="mt-0.5 truncate text-[14px] font-bold tabular-nums [font-family:var(--f-title)] sm:mt-1 sm:text-[17px]"
        style={{ color: TONE[tone] }}
      >
        {value}
      </dd>
    </div>
  );
}
