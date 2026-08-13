'use client';

import { useLocale, useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import { buttonVariants } from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';
import type { FinanceGoal, TaskColor } from '@/types';

import { COLOR_CSS } from '../../constants';
import { formatCurrency } from '../../utils';
import { SectionCard } from './SectionCard';

const MAX_ROWS = 3;

interface SavingsGoalsCardProps {
  goals: FinanceGoal[];
  isLoading: boolean;
  onContribute: (goal: FinanceGoal) => void;
}

/** Active savings goals with their pace — behind-schedule ones first, since those need a decision. */
export function SavingsGoalsCard({ goals, isLoading, onContribute }: SavingsGoalsCardProps) {
  const t = useTranslations('finance');
  const locale = useLocale();

  const active = [...goals]
    .filter((g) => g.status !== 'archived')
    .sort((a, b) => Number(a.onTrack) - Number(b.onTrack));

  return (
    <SectionCard
      title={t('overview.savingsGoals')}
      action={goals.length > 0 ? { href: '/finance/goals', label: t('common.viewAll') } : undefined}
      index={1}
    >
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-[54px] animate-pulse rounded-[var(--r-md)] bg-[var(--panel2)]"
            />
          ))}
        </div>
      ) : active.length === 0 ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-[13px] font-bold text-[var(--text-hi)]">{t('overview.noGoals')}</p>
          <p className="text-[11px] text-[var(--text-mid)]">{t('overview.noGoalsHint')}</p>
          <Link
            href="/finance/goals"
            className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'mt-1' })}
          >
            ＋ {t('overview.addGoal')}
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-4">
          {active.slice(0, MAX_ROWS).map((g) => {
            const accent = COLOR_CSS[(g.color as TaskColor) ?? 'gold'] ?? 'var(--gold)';
            const done = g.status === 'completed';

            return (
              <li key={g.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <Icon icon={g.icon} />
                    <span className="truncate text-[12px] font-bold text-[var(--text-hi)]">
                      {g.name}
                    </span>
                  </span>

                  {done ? (
                    <span className={badge('mint')}>✓ {t('goals.completed')}</span>
                  ) : g.onTrack ? (
                    <span className={badge('mint')}>{t('overview.onTrack')}</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onContribute(g)}
                      className={badge('gold', true)}
                    >
                      ▾ {t('overview.behindSchedule')}
                    </button>
                  )}
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bg-3)]">
                  <div
                    className="h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none"
                    style={{ width: `${g.progress}%`, background: accent }}
                  />
                </div>

                <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-[11px]">
                  <span className="tabular-nums text-[var(--text-hi)]">
                    {t('goals.saved', {
                      current: formatCurrency(g.currentAmount),
                      target: formatCurrency(g.targetAmount),
                    })}
                  </span>
                  {g.targetDate && (
                    <span className="tabular-nums text-[var(--text-mid)]">
                      {new Date(`${g.targetDate}T00:00:00`).toLocaleDateString(locale)}
                    </span>
                  )}
                </div>

                {g.requiredMonthly !== null && !done && (
                  <p className="mt-1 text-[11px] text-[var(--text-mid)]">
                    {t('overview.perMonthNeeded', { amount: formatCurrency(g.requiredMonthly) })}
                    {g.requiredDaily !== null && (
                      <>
                        {' · '}
                        {t('overview.perDayNeeded', { amount: formatCurrency(g.requiredDaily) })}
                      </>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

function badge(tone: 'mint' | 'gold', interactive = false): string {
  const base =
    'shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]';
  const colors =
    tone === 'mint'
      ? 'border-[var(--mint)] text-[var(--mint)]'
      : 'border-[var(--gold)] text-[var(--gold)]';
  return `${base} ${colors}${interactive ? ' transition-colors hover:bg-[oklch(0.74_0.17_85_/_0.12)]' : ''}`;
}
