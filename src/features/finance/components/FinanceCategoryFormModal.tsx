'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { cn } from '@/libs/utils';
import type { FinanceCategory, FinanceCategoryType, TaskColor } from '@/types';

import { CATEGORY_ICONS, COLOR_CSS, COLOR_OPTIONS } from '../constants';
import { useCreateFinanceCategory } from '../hooks/useCreateFinanceCategory';
import { useUpdateFinanceCategory } from '../hooks/useUpdateFinanceCategory';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pass a category to edit it; omit to create a new one. */
  category?: FinanceCategory | null;
  /** Type for a new category — locked once it exists. */
  defaultType?: FinanceCategoryType;
  onSaved?: (mode: 'created' | 'updated') => void;
}

export function FinanceCategoryFormModal({
  open,
  onClose,
  category,
  defaultType = 'expense',
  onSaved,
}: Props) {
  const t = useTranslations('finance');
  const createCategory = useCreateFinanceCategory();
  const updateCategory = useUpdateFinanceCategory();
  const isEdit = !!category;
  const isPending = createCategory.isPending || updateCategory.isPending;

  const [name, setName] = useState('');
  const [type, setType] = useState<FinanceCategoryType>(defaultType);
  const [icon, setIcon] = useState(CATEGORY_ICONS[0] ?? '📦');
  const [color, setColor] = useState<TaskColor>('gold');

  // Re-seed on open (adjusted during render, not an effect — same as the other finance forms).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(category?.name ?? '');
      setType(category?.type ?? defaultType);
      setIcon(category?.icon ?? CATEGORY_ICONS[0] ?? '📦');
      setColor(category?.color ?? 'gold');
    }
  }

  const canSave = name.trim().length > 0 && !isPending;

  function handleSubmit() {
    if (!canSave) return;

    if (category) {
      updateCategory.mutate(
        { id: category.id, name: name.trim(), icon, color },
        {
          onSuccess: () => {
            onSaved?.('updated');
            onClose();
          },
        },
      );
      return;
    }

    createCategory.mutate(
      { name: name.trim(), type, icon, color },
      {
        onSuccess: () => {
          onSaved?.('created');
          onClose();
        },
      },
    );
  }

  const typeOptions: { value: FinanceCategoryType; label: string }[] = [
    { value: 'expense', label: t('categories.expense') },
    { value: 'income', label: t('categories.income') },
  ];

  return (
    <Modal open={open} onClose={onClose} maxWidth="440px">
      <ModalHead
        tag={isEdit ? t('categories.editTag') : t('categories.newTag')}
        title={
          (isEdit ? '✎ ' : '＋ ') + (isEdit ? t('categories.editTitle') : t('categories.newTitle'))
        }
      />
      <ModalBody className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('categories.name')}</span>
          <input
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder={t('categories.namePlaceholder')}
            autoFocus
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('categories.type')}</span>
          <div className="flex gap-2">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                disabled={isEdit}
                title={isEdit ? t('categories.typeLocked') : undefined}
                className={cn(
                  'flex flex-1 items-center justify-center rounded-[var(--r-sm)] border px-2 py-2 text-[11px] font-bold uppercase tracking-[0.04em] transition-all',
                  type === option.value
                    ? 'border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.1)] text-[var(--gold)]'
                    : 'border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)]',
                  isEdit && 'cursor-not-allowed opacity-50 hover:text-[var(--text-mid)]',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('categories.icon')}</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_ICONS.map((ic) => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={cn(
                  'flex h-9 w-9 items-center justify-center rounded-[var(--r-sm)] border text-[18px] transition-all',
                  icon === ic
                    ? 'border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.12)]'
                    : 'border-[var(--border)] hover:border-[var(--border-hi)]',
                )}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('categories.color')}</span>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setColor(c.value)}
                title={c.label}
                className={cn(
                  'h-7 w-7 rounded-full border-2 transition-all',
                  color === c.value ? 'scale-110' : 'opacity-60 hover:opacity-100',
                )}
                style={{
                  background: COLOR_CSS[c.value],
                  borderColor: color === c.value ? 'var(--text-hi)' : 'transparent',
                }}
              />
            ))}
          </div>
        </div>
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

const fieldLabel =
  'text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--text-mid)] [font-family:var(--f-title)]';
const input =
  'w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2 text-[13px] text-[var(--text-hi)] focus:border-[var(--gold)] focus:outline-none';
