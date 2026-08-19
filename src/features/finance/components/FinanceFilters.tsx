'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { InputSearch } from '@/components/ui/InputSearch';
import { Select } from '@/components/ui/Select';
import type { FinanceCategory, TransactionType, Wallet } from '@/types';

type TypeFilter = TransactionType | 'all';

const TYPE_TABS: { value: TypeFilter; key: 'all' | 'income' | 'expense' }[] = [
  { value: 'all', key: 'all' },
  { value: 'income', key: 'income' },
  { value: 'expense', key: 'expense' },
];

interface FinanceFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  type: TypeFilter;
  onTypeChange: (v: TypeFilter) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  categories: FinanceCategory[];
  walletId: string;
  onWalletChange: (v: string) => void;
  wallets: Wallet[];
}

export function FinanceFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  categoryId,
  onCategoryChange,
  categories,
  walletId,
  onWalletChange,
  wallets,
}: FinanceFiltersProps) {
  const t = useTranslations('finance.filters');

  const categoryOptions = [
    { value: '', label: t('allCategories') },
    ...categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
  ];
  const walletOptions = [
    { value: '', label: t('allWallets') },
    ...wallets.map((w) => ({ value: w.id, label: `${w.icon} ${w.name}` })),
  ];

  return (
    <div className="flex items-stretch gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
      <InputSearch
        value={search}
        onChange={onSearchChange}
        placeholder={t('search')}
        className="h-[42px] w-[180px] shrink-0 sm:w-auto sm:max-w-[220px] sm:shrink"
      />

      <div className="relative flex h-[42px] shrink-0 items-stretch gap-0.5 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--panel)] p-1">
        {TYPE_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onTypeChange(tab.value)}
            className="relative px-3 text-[11px] font-bold uppercase tracking-[0.06em] [font-family:var(--f-title)] transition-colors"
          >
            {type === tab.value && (
              <motion.span
                layoutId="finance-type-pill"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                className="absolute inset-0 rounded-[var(--r-sm)] bg-[oklch(0.74_0.17_85_/_0.14)]"
              />
            )}
            <span
              className={
                type === tab.value
                  ? 'relative flex h-full items-center text-[var(--gold)]'
                  : 'relative flex h-full items-center text-[var(--text-mid)] hover:text-[var(--text-hi)]'
              }
            >
              {t(tab.key)}
            </span>
          </button>
        ))}
      </div>

      <Select
        options={categoryOptions}
        value={categoryId}
        onValueChange={onCategoryChange}
        placeholder={t('allCategories')}
        containerClassName="w-[150px] shrink-0 sm:w-auto sm:max-w-[180px] sm:shrink"
      />

      <Select
        options={walletOptions}
        value={walletId}
        onValueChange={onWalletChange}
        placeholder={t('allWallets')}
        containerClassName="w-[150px] shrink-0 sm:w-auto sm:max-w-[180px] sm:shrink"
      />
    </div>
  );
}
