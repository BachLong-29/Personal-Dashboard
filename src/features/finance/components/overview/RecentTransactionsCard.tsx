'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import { Button } from '@/components/ui/Button';
import type { FinanceCategory, FinanceOverview, TaskColor, Wallet } from '@/types';

import { COLOR_CSS } from '../../constants';
import { parseQuickEntry, type QuickEntryDraft } from '../../quick-entry';
import { formatCurrency, formatDateGroup } from '../../utils';
import { SectionCard } from './SectionCard';

interface RecentTransactionsCardProps {
  overview: FinanceOverview | null;
  categories: FinanceCategory[];
  wallets: Wallet[];
  isLoading: boolean;
  /** Hands a parsed quick-entry to the page, which opens the form prefilled for confirmation. */
  onQuickAdd: (draft: QuickEntryDraft) => void;
}

/** The last handful of entries for the month — a glance, not the ledger. */
export function RecentTransactionsCard({
  overview,
  categories,
  wallets,
  isLoading,
  onQuickAdd,
}: RecentTransactionsCardProps) {
  const t = useTranslations('finance');
  const locale = useLocale();
  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const walletById = new Map(wallets.map((w) => [w.id, w]));
  const recent = overview?.recent ?? [];

  const [quickText, setQuickText] = useState('');
  const [quickError, setQuickError] = useState(false);

  function handleQuickAdd() {
    const draft = parseQuickEntry(quickText, wallets, categories);
    if (!draft) {
      setQuickError(true);
      return;
    }
    setQuickError(false);
    setQuickText('');
    onQuickAdd(draft);
  }

  return (
    <SectionCard
      title={t('overview.recent')}
      action={
        recent.length > 0
          ? { href: '/finance/transactions', label: t('common.viewAll') }
          : undefined
      }
      index={2}
    >
      {wallets.length > 0 && (
        <div className="mb-2 border-b border-[var(--border)] pb-2 sm:mb-4 sm:pb-4">
          <div className="flex gap-2">
            <input
              value={quickText}
              onChange={(e) => {
                setQuickText(e.target.value);
                setQuickError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleQuickAdd();
              }}
              placeholder={t('overview.quickAddPlaceholder')}
              aria-label={t('overview.quickAddPlaceholder')}
              aria-invalid={quickError}
              className="min-w-0 flex-1 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[12px] text-[var(--text-hi)] placeholder:text-[var(--text-mid)] focus:border-[var(--gold)] focus:outline-none"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleQuickAdd}
              disabled={!quickText.trim()}
            >
              {t('overview.add')}
            </Button>
          </div>
          <p
            className={`mt-1.5 text-[10px] ${quickError ? 'text-[var(--rose)]' : 'text-[var(--text-mid)]'}`}
          >
            {quickError ? t('overview.quickAddFailed') : t('overview.quickAddHelp')}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[40px] animate-pulse rounded-[var(--r-md)] bg-[var(--panel2)]"
            />
          ))}
        </div>
      ) : recent.length === 0 ? (
        <div className="flex flex-col gap-1">
          <p className="text-[13px] font-bold text-[var(--text-hi)]">
            {t('overview.noTransactions')}
          </p>
          <p className="text-[11px] text-[var(--text-mid)]">{t('overview.noTransactionsHint')}</p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {recent.map((tx, i) => {
            const category = categoryById.get(tx.categoryId);
            const wallet = walletById.get(tx.walletId);
            const accent = COLOR_CSS[(category?.color ?? 'gold') as TaskColor];
            const isIncome = tx.type === 'income';

            return (
              <li
                key={tx.id}
                className={`flex items-center gap-3 py-1.5 sm:py-2.5 ${i > 0 ? 'border-t border-[var(--border-lo)]' : ''}`}
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--r-sm)] border text-[14px]"
                  style={{
                    background: `color-mix(in oklch, ${accent} 14%, transparent)`,
                    borderColor: `color-mix(in oklch, ${accent} 32%, transparent)`,
                  }}
                >
                  <Icon icon={category?.icon ?? '📦'} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] font-bold text-[var(--text-hi)]">
                    {tx.note || category?.name || '—'}
                  </div>
                  <div className="truncate text-[10px] text-[var(--text-mid)]">
                    {[
                      category?.name,
                      wallet?.name,
                      formatDateGroup(
                        tx.date,
                        { today: t('common.today'), yesterday: t('common.yesterday') },
                        locale,
                      ),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                </div>

                <span
                  className="shrink-0 text-[13px] font-bold tabular-nums"
                  style={{ color: isIncome ? 'var(--mint)' : 'var(--text-hi)' }}
                >
                  {isIncome ? '+' : '−'}
                  {formatCurrency(tx.amount)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}
