'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import { Progress, type ProgressVariant } from '@/components/ui/Progress';
import type { Budget, FinanceCategory } from '@/types';

import { formatCurrency } from '../utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function progressVariant(pct: number): ProgressVariant {
  if (pct >= 100) return 'danger';
  if (pct >= 80) return 'gold';
  return 'mint';
}

interface BudgetCardProps {
  budget: Budget;
  icon: string;
  onEdit: () => void;
  onDelete: () => void;
  delay: number;
}

function BudgetCard({ budget, icon, onEdit, onDelete, delay }: BudgetCardProps) {
  const t = useTranslations('finance');
  const pct = Math.min(999, budget.percentage);
  const remaining = budget.limit - budget.spent;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, delay, ease: EASE_OUT }}
      className="flex flex-col gap-3 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--panel)] p-4 transition-colors hover:border-[var(--border-hi)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[18px] leading-none">
            <Icon icon={icon} />
          </span>
          <span className="truncate text-[13px] font-bold tracking-[0.02em] text-[var(--text-hi)] [font-family:var(--f-title)]">
            {budget.categoryId ? budget.categoryName : t('budget.overall')}
          </span>
          {budget.recurring && (
            <span
              className="shrink-0 text-[11px] text-[var(--gold)] opacity-80"
              title="Recurring — applies to future months too"
            >
              ↻
            </span>
          )}
        </div>
        <span
          className="shrink-0 text-[12px] font-bold tabular-nums"
          style={{
            color: pct >= 100 ? 'var(--crimson)' : pct >= 80 ? 'var(--gold)' : 'var(--text-mid)',
          }}
        >
          {pct}%
        </span>
      </div>

      <Progress value={budget.spent} max={budget.limit} variant={progressVariant(pct)} tall />

      <div className="flex items-center justify-between text-[11px]">
        <span className="text-[var(--text-hi)] tabular-nums">
          {formatCurrency(budget.spent)}{' '}
          <span className="text-[var(--text-lo)]">/ {formatCurrency(budget.limit)}</span>
        </span>
        <span className={remaining < 0 ? 'text-[var(--crimson)]' : 'text-[var(--text-lo)]'}>
          {remaining < 0
            ? t('budget.over', { amount: formatCurrency(-remaining) })
            : t('budget.left', { amount: formatCurrency(remaining) })}
        </span>
      </div>

      <div className="flex gap-1.5 border-t border-[var(--border)] pt-3">
        <button type="button" onClick={onEdit} className={actionBtn}>
          ✎ {t('common.edit')}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className={`${actionBtn} ml-auto hover:border-[var(--crimson)] hover:text-[var(--crimson)]`}
        >
          🗑 {t('common.delete')}
        </button>
      </div>
    </motion.div>
  );
}

interface BudgetListProps {
  budgets: Budget[];
  categories: FinanceCategory[];
  onEdit: (budget: Budget) => void;
  onDelete: (budget: Budget) => void;
}

export function BudgetList({ budgets, categories, onEdit, onDelete }: BudgetListProps) {
  const iconByCategoryId = new Map(categories.map((c) => [c.id, c.icon]));

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {budgets.map((b, i) => (
        <BudgetCard
          key={b.id}
          budget={b}
          icon={b.categoryId ? (iconByCategoryId.get(b.categoryId) ?? '📦') : '🧮'}
          onEdit={() => onEdit(b)}
          onDelete={() => onDelete(b)}
          delay={i * 0.04}
        />
      ))}
    </div>
  );
}

const actionBtn =
  'inline-flex items-center gap-1 rounded-[var(--r-sm)] border border-[var(--border)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-mid)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]';
