'use client';

import { motion } from 'framer-motion';

import { Icon } from '@/components/common/Icon';
import type { FinanceCategory, Transaction, Wallet } from '@/types';

import { COLOR_CSS } from '../constants';
import { formatCurrency } from '../utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface TransactionRowProps {
  transaction: Transaction;
  category?: FinanceCategory;
  wallet?: Wallet;
  onClick: () => void;
  delay?: number;
}

export function TransactionRow({
  transaction,
  category,
  wallet,
  onClick,
  delay = 0,
}: TransactionRowProps) {
  const accent = category ? COLOR_CSS[category.color] : 'var(--text-lo)';
  const isIncome = transaction.type === 'income';

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3, delay, ease: EASE_OUT }}
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-[var(--r-md)] border border-transparent px-3 py-2.5 text-left transition-colors duration-150 hover:border-[var(--border)] hover:bg-[var(--panel2)]"
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] border text-[16px]"
        style={{
          background: `color-mix(in oklch, ${accent} 14%, transparent)`,
          borderColor: `color-mix(in oklch, ${accent} 35%, transparent)`,
        }}
      >
        <Icon icon={category?.icon ?? '❔'} />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-[var(--text-hi)]">
          {transaction.note || category?.name || 'Transaction'}
        </span>
        <span className="mt-[2px] flex items-center gap-1.5 text-[10px] text-[var(--text-lo)]">
          <span className="truncate">{category?.name}</span>
          {wallet && (
            <>
              <span className="opacity-40">·</span>
              <span className="truncate">{wallet.name}</span>
            </>
          )}
        </span>
      </span>

      <span
        className="shrink-0 text-[13px] font-bold tabular-nums [font-family:var(--f-title)]"
        style={{ color: isIncome ? 'var(--mint)' : 'var(--rose)' }}
      >
        {isIncome ? '+' : '−'}
        {formatCurrency(transaction.amount, wallet?.currency)}
      </span>
    </motion.button>
  );
}
