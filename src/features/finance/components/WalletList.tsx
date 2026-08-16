'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import { cn } from '@/libs/utils';
import type { Wallet } from '@/types';

import { COLOR_CSS, WALLET_TYPE_OPTIONS } from '../constants';
import { useCountUp } from '../hooks/useCountUp';
import { AMOUNT_MASK, formatCurrency } from '../utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface WalletCardProps {
  wallet: Wallet;
  amountsHidden: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onManageSepay: () => void;
  delay: number;
}

function WalletCard({
  wallet,
  amountsHidden,
  onEdit,
  onDelete,
  onManageSepay,
  delay,
}: WalletCardProps) {
  const t = useTranslations('finance');
  const accent = COLOR_CSS[wallet.color];
  const balance = useCountUp(wallet.balance);
  const typeLabel = WALLET_TYPE_OPTIONS.find((t) => t.value === wallet.type)?.label ?? wallet.type;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: EASE_OUT }}
      className="flex flex-col gap-3 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--panel)] p-4 transition-colors hover:border-[var(--border-hi)]"
    >
      <div className="flex items-start gap-3">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--r-sm)] border text-[19px]"
          style={{
            background: `color-mix(in oklch, ${accent} 14%, transparent)`,
            borderColor: `color-mix(in oklch, ${accent} 35%, transparent)`,
          }}
        >
          <Icon icon={wallet.icon} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[14px] font-bold tracking-[0.02em] text-[var(--text-hi)] [font-family:var(--f-title)]">
            {wallet.name}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--text-lo)]">
            <span className="rounded-full border border-[var(--border)] px-2 py-0.5 font-bold uppercase tracking-[0.08em]">
              {typeLabel}
            </span>
            {wallet.bankCode && <span className="uppercase">{wallet.bankCode}</span>}
            {wallet.bankAccountNumber && (
              <span className="tabular-nums">•••• {wallet.bankAccountNumber.slice(-4)}</span>
            )}
          </div>
        </div>
      </div>

      <div
        className="truncate text-[20px] font-bold tabular-nums [font-family:var(--f-title)]"
        style={{ color: accent }}
      >
        {amountsHidden ? AMOUNT_MASK : formatCurrency(balance, wallet.currency)}
      </div>

      <div className="flex flex-wrap gap-1.5 border-t border-[var(--border)] pt-3">
        <button type="button" onClick={onEdit} className={actionBtn}>
          ✎ {t('common.edit')}
        </button>
        {wallet.type === 'bank' && (
          <button type="button" onClick={onManageSepay} className={actionBtn}>
            🔌 {t('accounts.sepay')}
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            actionBtn,
            'ml-auto hover:border-[var(--crimson)] hover:text-[var(--crimson)]',
          )}
        >
          🗑 {t('common.delete')}
        </button>
      </div>
    </motion.div>
  );
}

interface WalletListProps {
  wallets: Wallet[];
  amountsHidden: boolean;
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
  onManageSepay: (wallet: Wallet) => void;
}

export function WalletList({
  wallets,
  amountsHidden,
  onEdit,
  onDelete,
  onManageSepay,
}: WalletListProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {wallets.map((w, i) => (
        <WalletCard
          key={w.id}
          wallet={w}
          amountsHidden={amountsHidden}
          onEdit={() => onEdit(w)}
          onDelete={() => onDelete(w)}
          onManageSepay={() => onManageSepay(w)}
          delay={i * 0.04}
        />
      ))}
    </div>
  );
}

const actionBtn =
  'inline-flex items-center gap-1 rounded-[var(--r-sm)] border border-[var(--border)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-mid)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]';
