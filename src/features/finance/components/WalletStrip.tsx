'use client';

import { motion } from 'framer-motion';

import { Icon } from '@/components/common/Icon';
import { cn } from '@/libs/utils';
import type { Wallet } from '@/types';

import { COLOR_CSS } from '../constants';
import { useCountUp } from '../hooks/useCountUp';
import { formatCurrency } from '../utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

interface WalletCardProps {
  wallet: Wallet;
  selected: boolean;
  onClick: () => void;
  onManageSepay?: () => void;
  delay: number;
}

function WalletCard({ wallet, selected, onClick, onManageSepay, delay }: WalletCardProps) {
  const accent = COLOR_CSS[wallet.color];
  const balance = useCountUp(wallet.balance);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: EASE_OUT }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      className={cn(
        'relative flex shrink-0 flex-col gap-2 rounded-[var(--r-lg)] border px-4 py-3 min-w-[152px] text-left',
        'bg-[var(--panel)] transition-colors duration-200',
        selected
          ? 'border-[var(--gold)] shadow-[var(--sh-glow-gold)]'
          : 'border-[var(--border)] hover:border-[var(--border-hi)]',
      )}
    >
      <span className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--r-sm)] border text-[15px]"
          style={{
            background: `color-mix(in oklch, ${accent} 14%, transparent)`,
            borderColor: `color-mix(in oklch, ${accent} 35%, transparent)`,
          }}
        >
          <Icon icon={wallet.icon} />
        </span>
        <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-[var(--text-hi)] [font-family:var(--f-title)] tracking-[0.02em]">
          {wallet.name}
        </span>
      </span>
      <span
        className="truncate text-[15px] font-bold tabular-nums [font-family:var(--f-title)]"
        style={{ color: accent }}
      >
        {formatCurrency(balance, wallet.currency)}
      </span>
      {wallet.type === 'bank' && onManageSepay && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onManageSepay();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.stopPropagation();
              e.preventDefault();
              onManageSepay();
            }
          }}
          className="inline-flex w-fit items-center gap-1 self-start rounded-full border border-[var(--border)] px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--text-lo)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
        >
          🔌 SePay
        </span>
      )}
      {selected && (
        <motion.span
          layoutId="wallet-selected-dot"
          className="absolute right-2.5 top-2.5 h-1.5 w-1.5 rounded-full bg-[var(--gold)] shadow-[0_0_6px_var(--gold-glow)]"
        />
      )}
    </motion.button>
  );
}

interface WalletStripProps {
  wallets: Wallet[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddWallet: () => void;
  onManageSepay?: (wallet: Wallet) => void;
}

export function WalletStrip({
  wallets,
  selectedId,
  onSelect,
  onAddWallet,
  onManageSepay,
}: WalletStripProps) {
  return (
    <div className="flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1">
      {wallets.map((w, i) => (
        <WalletCard
          key={w.id}
          wallet={w}
          selected={selectedId === w.id}
          onClick={() => onSelect(selectedId === w.id ? null : w.id)}
          onManageSepay={onManageSepay ? () => onManageSepay(w) : undefined}
          delay={i * 0.05}
        />
      ))}
      <motion.button
        type="button"
        onClick={onAddWallet}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: wallets.length * 0.05, ease: EASE_OUT }}
        whileHover={{ y: -3 }}
        whileTap={{ scale: 0.97 }}
        className="flex shrink-0 min-w-[92px] flex-col items-center justify-center gap-1 rounded-[var(--r-lg)] border border-dashed border-[var(--border)] px-4 py-3 text-[var(--text-lo)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
      >
        <span className="text-[18px] leading-none">＋</span>
        <span className="text-[9px] font-bold uppercase tracking-[0.08em] [font-family:var(--f-title)]">
          Wallet
        </span>
      </motion.button>
    </div>
  );
}
