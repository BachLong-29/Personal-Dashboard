'use client';

import { useLocale, useTranslations } from 'next-intl';

import type { FinanceOverview } from '@/types';

import { formatCurrency, formatMonthLabel } from '../../utils';
import { SectionCard } from './SectionCard';

interface MonthSummaryCardProps {
  overview: FinanceOverview | null;
  month: string;
  isLoading: boolean;
}

/** Income / expense / savings / savings-rate for the selected month. */
export function MonthSummaryCard({ overview, month, isLoading }: MonthSummaryCardProps) {
  const t = useTranslations('finance');
  const locale = useLocale();

  const net = overview?.net ?? 0;
  const rate = overview?.savingsRate ?? null;

  return (
    <SectionCard title={formatMonthLabel(month, locale)} index={1}>
      {isLoading ? (
        <div className="h-[72px] animate-pulse rounded-[var(--r-md)] bg-[var(--panel2)]" />
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
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
        className="mt-1 truncate text-[17px] font-bold tabular-nums [font-family:var(--f-title)]"
        style={{ color: TONE[tone] }}
      >
        {value}
      </dd>
    </div>
  );
}
