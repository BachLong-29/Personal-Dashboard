'use client';

import { useState } from 'react';

import { useLocale, useTranslations } from 'next-intl';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { cn } from '@/libs/utils';
import type { Budget, FinanceCategory } from '@/types';

import { formatAmountInput, formatMonthLabel, toAmountDigits } from '../utils';
import { useCreateBudget } from '../hooks/useCreateBudget';
import { useUpdateBudget } from '../hooks/useUpdateBudget';

const OVERALL_VALUE = '__overall__';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Target month for a new budget — ignored when editing (month can't change). */
  month: string;
  /** Expense categories to offer in the dropdown. */
  categories: FinanceCategory[];
  /** categoryIds (or null for the overall budget) already set for `month` — disabled in the dropdown. */
  existingCategoryIds: (string | null)[];
  /** Provided when editing — only `limit` can change. */
  budget?: Budget | null;
}

export function BudgetFormModal({
  open,
  onClose,
  month,
  categories,
  existingCategoryIds,
  budget,
}: Props) {
  const t = useTranslations('finance');
  const locale = useLocale();
  const isEdit = !!budget;
  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const isPending = createBudget.isPending || updateBudget.isPending;

  const [categoryValue, setCategoryValue] = useState(OVERALL_VALUE);
  const [limit, setLimit] = useState('');
  const [recurring, setRecurring] = useState(false);

  // Re-seed form fields whenever the modal opens for a different context.
  // Adjusted during render (not an effect) to avoid an extra render pass on open.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setCategoryValue(budget?.categoryId ?? OVERALL_VALUE);
      setLimit(budget ? String(budget.limit) : '');
      setRecurring(false);
    }
  }

  const limitNum = parseFloat(limit);
  const canSave = limitNum > 0 && !isPending;

  const categoryOptions = [
    {
      value: OVERALL_VALUE,
      label: '🧮 Overall (all expenses)',
      disabled: !isEdit && existingCategoryIds.includes(null),
    },
    ...categories.map((c) => ({
      value: c.id,
      label: `${c.icon} ${c.name}`,
      disabled: !isEdit && existingCategoryIds.includes(c.id),
    })),
  ];

  function handleSubmit() {
    if (!canSave) return;

    if (budget) {
      updateBudget.mutate({ id: budget.id, limit: limitNum }, { onSuccess: onClose });
      return;
    }

    createBudget.mutate(
      {
        categoryId: categoryValue === OVERALL_VALUE ? undefined : categoryValue,
        month,
        limit: limitNum,
        recurring,
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="440px" className="overflow-visible">
      <ModalHead
        tag={isEdit ? t('budget.editTag') : t('budget.newTag')}
        title={isEdit ? '✎ ' + t('budget.editTitle') : '＋ ' + t('budget.newTitle')}
      />
      <ModalBody className="flex flex-col gap-4">
        <Field label={t('budget.forMonthLabel')}>
          <div className="text-[13px] text-[var(--text-hi)]">
            {formatMonthLabel(isEdit ? budget.month : month, locale)}
          </div>
        </Field>

        <Field label={t('budget.category')}>
          {isEdit ? (
            <div className="text-[13px] text-[var(--text-hi)]">
              {budget.categoryId ? budget.categoryName : t('budget.overall')}
            </div>
          ) : (
            <Select
              options={categoryOptions}
              value={categoryValue}
              onValueChange={setCategoryValue}
            />
          )}
        </Field>

        <Field label={t('budget.limit')}>
          <input
            type="text"
            inputMode="numeric"
            className="w-full rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[18px] font-bold tabular-nums text-[var(--text-hi)] focus:border-[var(--gold)] focus:outline-none"
            value={formatAmountInput(limit)}
            onChange={(e) => setLimit(toAmountDigits(e.target.value))}
            placeholder="0"
            autoFocus
          />
        </Field>

        {isEdit ? (
          budget.recurring && (
            <p className="text-[11px] text-[var(--text-lo)]">
              ↻ Recurring — editing the limit also updates every later month that inherits it.
            </p>
          )
        ) : (
          <Field label="Applies to">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setRecurring(false)}
                className={cn(
                  'flex-1 rounded-[var(--r-sm)] border px-3 py-2 text-left text-[12px] transition-all',
                  !recurring
                    ? 'border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.1)] text-[var(--gold)]'
                    : 'border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)]',
                )}
              >
                <div className="font-bold">{formatMonthLabel(month, locale)} only</div>
                <div className="text-[10px] text-[var(--text-lo)]">One-off, this month only</div>
              </button>
              <button
                type="button"
                onClick={() => setRecurring(true)}
                className={cn(
                  'flex-1 rounded-[var(--r-sm)] border px-3 py-2 text-left text-[12px] transition-all',
                  recurring
                    ? 'border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.1)] text-[var(--gold)]'
                    : 'border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)]',
                )}
              >
                <div className="font-bold">↻ This &amp; future months</div>
                <div className="text-[10px] text-[var(--text-lo)]">Until you change it</div>
              </button>
            </div>
          </Field>
        )}
      </ModalBody>
      <ModalFoot>
        <Button variant="ghost" onClick={onClose} disabled={isPending}>
          {t('common.cancel')}
        </Button>
        <Button variant="primary" onClick={handleSubmit} disabled={!canSave} isLoading={isPending}>
          ✦ {isEdit ? t('common.save') : t('common.create')}
        </Button>
      </ModalFoot>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--text-lo)] [font-family:var(--f-title)]">
        {label}
      </span>
      {children}
    </label>
  );
}
