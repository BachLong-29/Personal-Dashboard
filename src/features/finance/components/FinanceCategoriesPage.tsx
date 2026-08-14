'use client';

import { useState } from 'react';
import type { AxiosError } from 'axios';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { Icon } from '@/components/common/Icon';
import { Button } from '@/components/ui/Button';
import { SkelBlock } from '@/components/ui/Skeleton';
import { GoldPanel } from '@/components/common/GoldPanel';
import { useUIStore } from '@/stores/ui.store';
import type { FinanceCategory, FinanceCategoryType } from '@/types';

import { COLOR_CSS } from '../constants';
import { useFinanceCategories } from '../hooks/useFinanceCategories';
import { useDeleteFinanceCategory } from '../hooks/useDeleteFinanceCategory';
import { FinanceCategoryFormModal } from './FinanceCategoryFormModal';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/**
 * Finance categories — the income/expense labels transactions and budgets are filed under.
 * These are their own collection: task and habit categories live elsewhere and never mix in.
 */
export function FinanceCategoriesPage() {
  const t = useTranslations('finance');
  const reduceMotion = useReducedMotion();

  const { data: categories = [], isLoading } = useFinanceCategories();
  const deleteCategory = useDeleteFinanceCategory();
  const addToast = useUIStore((s) => s.addToast);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<FinanceCategory | null>(null);
  const [formType, setFormType] = useState<FinanceCategoryType>('expense');

  const expense = categories.filter((c) => c.type === 'expense');
  const income = categories.filter((c) => c.type === 'income');

  function handleAdd(type: FinanceCategoryType) {
    setEditing(null);
    setFormType(type);
    setShowForm(true);
  }

  function handleEdit(category: FinanceCategory) {
    setEditing(category);
    setShowForm(true);
  }

  function handleDelete(category: FinanceCategory) {
    if (!confirm(t('categories.confirmDelete', { name: category.name }))) return;
    deleteCategory.mutate(category.id, {
      onSuccess: () => addToast({ type: 'success', message: t('categories.deleted') }),
      onError: (err) => {
        // The API refuses to delete a category that transactions or a live budget still point at,
        // and explains why — surface that instead of a generic failure.
        const message =
          (err as AxiosError<{ message?: string }>).response?.data?.message ??
          t('categories.deleteBlocked');
        addToast({ type: 'error', message });
      },
    });
  }

  return (
    <>
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        <motion.header
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.15 : 0.35, ease: EASE_OUT }}
          className="shrink-0"
        >
          <GoldPanel className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="text-[9px] tracking-[0.3em] text-[var(--gold)] [font-family:var(--f-title)]">
                {t('eyebrow')}
              </p>
              <h1 className="text-[22px] font-bold tracking-[0.03em] text-[var(--text-hi)] [font-family:var(--f-title)]">
                {t('categories.title')}
              </h1>
              <p className="mt-0.5 text-[11px] text-[var(--text-mid)]">
                {t('categories.subtitle')}
              </p>
            </div>

            <Button variant="primary" onClick={() => handleAdd('expense')}>
              ＋ {t('categories.addExpense')}
            </Button>
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
                {t('categories.panel')}
              </span>
              <span className="text-[8px] tracking-[3px] text-[var(--gold-dim)] opacity-60">
                ◆ ◆ ◆
              </span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {isLoading ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {[0, 1, 2, 3].map((i) => (
                    <SkelBlock key={i} className="h-[56px] rounded-[var(--r-lg)]" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-6">
                  <CategoryGroup
                    label={t('categories.expense')}
                    emptyLabel={t('categories.empty', { type: t('categories.expense') })}
                    addLabel={t('categories.addExpense')}
                    accent="var(--rose)"
                    categories={expense}
                    onAdd={() => handleAdd('expense')}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    editLabel={t('common.edit')}
                    deleteLabel={t('common.delete')}
                  />

                  <CategoryGroup
                    label={t('categories.income')}
                    emptyLabel={t('categories.empty', { type: t('categories.income') })}
                    addLabel={t('categories.addIncome')}
                    accent="var(--mint)"
                    categories={income}
                    onAdd={() => handleAdd('income')}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    editLabel={t('common.edit')}
                    deleteLabel={t('common.delete')}
                  />
                </div>
              )}
            </div>
          </GoldPanel>
        </motion.div>
      </div>

      <FinanceCategoryFormModal
        open={showForm}
        onClose={() => setShowForm(false)}
        category={editing}
        defaultType={formType}
        onSaved={(mode) =>
          addToast({
            type: 'success',
            message: mode === 'created' ? t('categories.created') : t('categories.updated'),
          })
        }
      />
    </>
  );
}

interface CategoryGroupProps {
  label: string;
  emptyLabel: string;
  addLabel: string;
  accent: string;
  categories: FinanceCategory[];
  onAdd: () => void;
  onEdit: (category: FinanceCategory) => void;
  onDelete: (category: FinanceCategory) => void;
  editLabel: string;
  deleteLabel: string;
}

function CategoryGroup({
  label,
  emptyLabel,
  addLabel,
  accent,
  categories,
  onAdd,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: CategoryGroupProps) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2">
        <span
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: accent }}
          aria-hidden
        />
        <h2 className="flex-1 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--text-hi)] [font-family:var(--f-title)]">
          {label}
        </h2>
        <span className="text-[10px] tabular-nums text-[var(--text-mid)]">{categories.length}</span>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-[var(--r-lg)] border border-dashed border-[var(--border)] px-4 py-6 text-center text-[11px] text-[var(--text-mid)]">
          {emptyLabel}
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((c) => {
            const color = COLOR_CSS[c.color];
            return (
              <li
                key={c.id}
                className="group flex items-center gap-3 rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--panel)] px-3 py-2.5 transition-colors hover:border-[var(--border-hi)]"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--r-sm)] border text-[17px]"
                  style={{
                    background: `color-mix(in oklch, ${color} 14%, transparent)`,
                    borderColor: `color-mix(in oklch, ${color} 35%, transparent)`,
                  }}
                >
                  <Icon icon={c.icon} />
                </span>

                <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-[var(--text-hi)]">
                  {c.name}
                </span>

                <span className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => onEdit(c)}
                    className={iconBtn}
                    title={editLabel}
                    aria-label={`${editLabel} ${c.name}`}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(c)}
                    className={`${iconBtn} hover:border-[var(--crimson)] hover:text-[var(--crimson)]`}
                    title={deleteLabel}
                    aria-label={`${deleteLabel} ${c.name}`}
                  >
                    🗑
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="mt-2 inline-flex items-center gap-1 rounded-[var(--r-sm)] border border-dashed border-[var(--border)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--text-mid)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]"
      >
        ＋ {addLabel}
      </button>
    </section>
  );
}

const iconBtn =
  'flex h-7 w-7 items-center justify-center rounded-[var(--r-sm)] border border-[var(--border)] text-[11px] text-[var(--text-mid)] transition-colors hover:border-[var(--gold)] hover:text-[var(--gold)]';
