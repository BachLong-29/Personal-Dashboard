'use client';

import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocale, useTranslations } from 'next-intl';

import type { FinanceCategory, Transaction, Wallet } from '@/types';

import { formatCurrency, formatDateGroup } from '../utils';
import { TransactionRow } from './TransactionRow';

interface TransactionListProps {
  transactions: Transaction[];
  categories: FinanceCategory[];
  wallets: Wallet[];
  isLoading: boolean;
  onEdit: (transaction: Transaction) => void;
}

export function TransactionList({
  transactions,
  categories,
  wallets,
  isLoading,
  onEdit,
}: TransactionListProps) {
  const t = useTranslations('finance');
  const locale = useLocale();
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const walletMap = useMemo(() => new Map(wallets.map((w) => [w.id, w])), [wallets]);

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const list = map.get(tx.date) ?? [];
      list.push(tx);
      map.set(tx.date, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [transactions]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[64, 64, 64].map((h, i) => (
          <div
            key={i}
            className="animate-pulse rounded-[var(--r-md)]"
            style={{ height: h, background: 'var(--panel2)' }}
          />
        ))}
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center gap-3 py-16 text-center"
      >
        <div className="text-[40px] opacity-60">💸</div>
        <div className="text-[14px] font-bold text-[var(--text-hi)]">{t('transactions.empty')}</div>
        <div className="text-[12px] text-[var(--text-mid)]">{t('transactions.emptyHint')}</div>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map(([date, items], groupIdx) => {
        const net = items.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0);
        return (
          <div key={date}>
            <div className="mb-1.5 flex items-center justify-between px-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--text-mid)] [font-family:var(--f-title)]">
                {formatDateGroup(
                  date,
                  { today: t('common.today'), yesterday: t('common.yesterday') },
                  locale,
                )}
              </span>
              <span
                className="text-[10px] font-bold tabular-nums"
                style={{ color: net >= 0 ? 'var(--mint)' : 'var(--rose)' }}
              >
                {net >= 0 ? '+' : '−'}
                {formatCurrency(Math.abs(net))}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <AnimatePresence initial={false}>
                {items.map((tx, i) => (
                  <TransactionRow
                    key={tx.id}
                    transaction={tx}
                    category={categoryMap.get(tx.categoryId)}
                    wallet={walletMap.get(tx.walletId)}
                    onClick={() => onEdit(tx)}
                    delay={groupIdx === 0 ? i * 0.03 : 0}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
