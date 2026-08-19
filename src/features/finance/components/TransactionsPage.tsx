'use client';

import { useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { GoldPanel } from '@/components/common/GoldPanel';
import type { Transaction, TransactionType } from '@/types';

import { useWallets } from '../hooks/useWallets';
import { useFinanceCategories } from '../hooks/useFinanceCategories';
import { useTransactions } from '../hooks/useTransactions';
import { getMonthOptions, getMonthRange } from '../utils';
import { FinanceFilters } from './FinanceFilters';
import { TransactionList } from './TransactionList';
import { TransactionFormModal } from './TransactionFormModal';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** The full ledger: every entry, with search and filters. The overview only shows the latest few. */
export function TransactionsPage() {
  const t = useTranslations('finance');
  const locale = useLocale();
  const reduceMotion = useReducedMotion();

  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useFinanceCategories();

  const [search, setSearch] = useState('');
  const [type, setType] = useState<TransactionType | 'all'>('all');
  const [categoryId, setCategoryId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [month, setMonth] = useState('');

  const monthRange = useMemo(() => (month ? getMonthRange(month) : null), [month]);
  const monthOptions = useMemo(
    () => [{ value: '', label: t('filters.allMonths') }, ...getMonthOptions(12, locale)],
    [t, locale],
  );

  const { data: transactions = [], isLoading } = useTransactions({
    walletId: walletId || undefined,
    type: type === 'all' ? undefined : type,
    categoryId: categoryId || undefined,
    search: search || undefined,
    from: monthRange?.from,
    to: monthRange?.to,
  });

  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [showAddTx, setShowAddTx] = useState(false);

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 sm:gap-4 sm:p-4">
        <motion.header
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: EASE_OUT }}
          className="shrink-0"
        >
          <GoldPanel className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
            <div>
              <p className="text-[9px] tracking-[0.3em] text-[var(--gold)] [font-family:var(--f-title)]">
                {t('eyebrow')}
              </p>
              <h1 className="text-[18px] font-bold tracking-[0.03em] text-[var(--text-hi)] [font-family:var(--f-title)] sm:text-[22px]">
                {t('transactions.title')}
              </h1>
            </div>

            <div className="flex flex-nowrap items-center gap-2">
              <Select
                options={monthOptions}
                value={month}
                onValueChange={setMonth}
                placeholder={t('filters.allMonths')}
                containerClassName="w-[130px] shrink-0 sm:w-auto sm:min-w-[150px]"
              />
              <Button
                variant="primary"
                size="sm"
                className="shrink-0 sm:px-4 sm:py-[9px] sm:text-[13px]"
                onClick={() => setShowAddTx(true)}
                disabled={wallets.length === 0}
              >
                ＋ {t('transactions.addTransaction')}
              </Button>
            </div>
          </GoldPanel>
        </motion.header>

        <motion.div
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.35, delay: 0.05, ease: EASE_OUT }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <GoldPanel background={false} className="flex min-h-0 flex-1 flex-col">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-[14px] pb-[8px] pt-[10px]">
              <span className="flex-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--gold)] [font-family:var(--f-title)]">
                {t('transactions.panel')}
              </span>
              <span className="text-[8px] tracking-[3px] text-[var(--gold-dim)] opacity-60">
                ◆ ◆ ◆
              </span>
            </div>

            <div className="shrink-0 border-b border-[var(--border)] p-3 sm:p-4">
              <FinanceFilters
                search={search}
                onSearchChange={setSearch}
                type={type}
                onTypeChange={setType}
                categoryId={categoryId}
                onCategoryChange={setCategoryId}
                categories={categories}
                walletId={walletId}
                onWalletChange={setWalletId}
                wallets={wallets}
              />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-3 sm:p-4">
              <TransactionList
                transactions={transactions}
                categories={categories}
                wallets={wallets}
                isLoading={isLoading}
                onEdit={setEditingTx}
              />
            </div>
          </GoldPanel>
        </motion.div>
      </div>

      <TransactionFormModal
        open={showAddTx}
        onClose={() => setShowAddTx(false)}
        wallets={wallets}
        categories={categories}
        defaultWalletId={walletId || null}
      />

      <TransactionFormModal
        open={!!editingTx}
        onClose={() => setEditingTx(null)}
        wallets={wallets}
        categories={categories}
        transaction={editingTx}
      />
    </>
  );
}
