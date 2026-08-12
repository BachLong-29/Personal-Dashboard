'use client';

import { motion } from 'framer-motion';

import { InputSearch } from '@/components/ui/InputSearch';
import { Select } from '@/components/ui/Select';
import type { FinanceCategory, TransactionType } from '@/types';

type TypeFilter = TransactionType | 'all';

const TYPE_TABS: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

interface FinanceFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  type: TypeFilter;
  onTypeChange: (v: TypeFilter) => void;
  categoryId: string;
  onCategoryChange: (v: string) => void;
  categories: FinanceCategory[];
}

export function FinanceFilters({
  search,
  onSearchChange,
  type,
  onTypeChange,
  categoryId,
  onCategoryChange,
  categories,
}: FinanceFiltersProps) {
  const categoryOptions = [
    { value: '', label: 'All categories' },
    ...categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` })),
  ];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
      <InputSearch
        value={search}
        onChange={onSearchChange}
        placeholder="Search transactions…"
        className="h-[42px] sm:max-w-[220px]"
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
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      <Select
        options={categoryOptions}
        value={categoryId}
        onValueChange={onCategoryChange}
        placeholder="All categories"
        containerClassName="sm:max-w-[180px]"
      />
    </div>
  );
}
