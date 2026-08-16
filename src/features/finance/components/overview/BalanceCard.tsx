'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import type { Wallet } from '@/types';

import { COLOR_CSS } from '../../constants';
import { useCountUp } from '../../hooks/useCountUp';
import { AMOUNT_MASK, formatCurrency } from '../../utils';
import { useFinanceUIStore } from '../../stores/finance-ui.store';
import { SectionCard } from './SectionCard';

interface BalanceCardProps {
  wallets: Wallet[];
  isLoading: boolean;
}

/** Total balance across active wallets, with a per-wallet breakdown and a privacy toggle. */
export function BalanceCard({ wallets, isLoading }: BalanceCardProps) {
  const t = useTranslations('finance');
  const hidden = useFinanceUIStore((s) => s.amountsHidden);
  const toggleHidden = useFinanceUIStore((s) => s.toggleAmountsHidden);

  const total = useMemo(() => wallets.reduce((sum, w) => sum + w.balance, 0), [wallets]);
  const animatedTotal = useCountUp(total);

  return (
    <SectionCard
      title={t('overview.totalBalance')}
      action={{ href: '/finance/wallets', label: t('common.manage') }}
      index={0}
    >
      {isLoading ? (
        <div className="h-[92px] animate-pulse rounded-[var(--r-md)] bg-[var(--panel2)]" />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className="text-[32px] font-bold leading-none tabular-nums text-[var(--gold)] [font-family:var(--f-title)] sm:text-[38px]">
              {hidden ? AMOUNT_MASK : formatCurrency(animatedTotal)}
            </span>
            <button
              type="button"
              onClick={toggleHidden}
              aria-label={hidden ? t('overview.showAmounts') : t('overview.hideAmounts')}
              aria-pressed={hidden}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] text-[13px] text-[var(--text-mid)] transition-colors duration-200 hover:border-[var(--gold)] hover:text-[var(--gold)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--gold)]"
            >
              {hidden ? '🙈' : '👁'}
            </button>
          </div>

          <p className="mt-1 text-[11px] text-[var(--text-mid)]">
            {t('overview.accountCount', { count: wallets.length })}
          </p>

          {wallets.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {wallets.map((w) => (
                <li
                  key={w.id}
                  className="flex min-w-[104px] flex-1 flex-col gap-1 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--panel2)] px-3 py-2 sm:flex-none"
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-mid)]">
                    <Icon icon={w.icon} />
                    <span className="truncate">{w.name}</span>
                  </span>
                  <span
                    className="truncate text-[13px] font-bold tabular-nums"
                    style={{ color: COLOR_CSS[w.color] }}
                  >
                    {hidden ? AMOUNT_MASK : formatCurrency(w.balance, w.currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </SectionCard>
  );
}
