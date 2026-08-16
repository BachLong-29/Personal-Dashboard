'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

import { Button } from '@/components/ui/Button';
import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { cn } from '@/libs/utils';
import type { FinanceCategory, FinanceCategoryType, TaskColor } from '@/types';

import { COLOR_CSS, COLOR_OPTIONS } from '../constants';
import { useCreateFinanceCategory } from '../hooks/useCreateFinanceCategory';
import { useUpdateFinanceCategory } from '../hooks/useUpdateFinanceCategory';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pass a category to edit it; omit to create a new one. */
  category?: FinanceCategory | null;
  /** Type for a new category — locked once it exists. */
  defaultType?: FinanceCategoryType;
  /** Force `defaultType` even for a new category — e.g. quick-create from an expense-only picker. */
  lockType?: boolean;
  onSaved?: (mode: 'created' | 'updated', category: FinanceCategory) => void;
}

export function FinanceCategoryFormModal({
  open,
  onClose,
  category,
  defaultType = 'expense',
  lockType = false,
  onSaved,
}: Props) {
  const t = useTranslations('finance');
  const createCategory = useCreateFinanceCategory();
  const updateCategory = useUpdateFinanceCategory();
  const isEdit = !!category;
  const isPending = createCategory.isPending || updateCategory.isPending;

  const [name, setName] = useState('');
  const [type, setType] = useState<FinanceCategoryType>(defaultType);
  const [icon, setIcon] = useState('📦');
  const [color, setColor] = useState<TaskColor>('gold');
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordDraft, setKeywordDraft] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  // Re-seed on open (adjusted during render, not an effect — same as the other finance forms).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(category?.name ?? '');
      setType(category?.type ?? defaultType);
      setIcon(category?.icon ?? '📦');
      setColor(category?.color ?? 'gold');
      setKeywords(category?.keywords ?? []);
      setKeywordDraft('');
      setShowPicker(false);
    }
  }

  const canSave = name.trim().length > 0 && !isPending;

  function addKeyword() {
    const value = keywordDraft.trim().toLowerCase();
    setKeywordDraft('');
    if (!value || keywords.includes(value)) return;
    setKeywords((prev) => [...prev, value]);
  }

  function removeKeyword(value: string) {
    setKeywords((prev) => prev.filter((k) => k !== value));
  }

  function handleSubmit() {
    if (!canSave) return;

    if (category) {
      updateCategory.mutate(
        { id: category.id, name: name.trim(), icon, color, keywords },
        {
          onSuccess: (updated) => {
            if (updated) onSaved?.('updated', updated);
            onClose();
          },
        },
      );
      return;
    }

    createCategory.mutate(
      { name: name.trim(), type, icon, color, keywords },
      {
        onSuccess: (created) => {
          if (created) onSaved?.('created', created);
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
    <Modal open={open} onClose={onClose} maxWidth="440px" scrollable>
      <ModalHead
        tag={isEdit ? t('categories.editTag') : t('categories.newTag')}
        title={
          (isEdit ? '✎ ' : '＋ ') + (isEdit ? t('categories.editTitle') : t('categories.newTitle'))
        }
      />
      <ModalBody className="flex flex-col gap-4" scrollable>
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

        {!lockType && (
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
        )}

        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('categories.icon')}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPicker((v) => !v)}
              className={cn(
                'flex h-11 w-11 items-center justify-center rounded-[var(--r-sm)] border text-[22px] transition-all',
                showPicker
                  ? 'border-[var(--gold)] shadow-[0_0_10px_oklch(0.74_0.17_85_/_0.3)]'
                  : 'border-[var(--border)] hover:border-[var(--border-hi)]',
              )}
            >
              {icon}
            </button>
          </div>
          {showPicker && (
            <div className="relative z-50 mt-1">
              <Picker
                data={data}
                theme="dark"
                previewPosition="none"
                skinTonePosition="none"
                perLine={9}
                onEmojiSelect={(emoji: { native: string }) => {
                  setIcon(emoji.native);
                  setShowPicker(false);
                }}
              />
            </div>
          )}
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
        <div className="flex flex-col gap-1.5">
          <span className={fieldLabel}>{t('categories.keywords')}</span>
          <div className="flex gap-2">
            <input
              className={input}
              value={keywordDraft}
              onChange={(e) => setKeywordDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  addKeyword();
                }
              }}
              placeholder={t('categories.keywordsPlaceholder')}
            />
            <Button type="button" variant="ghost" size="sm" onClick={addKeyword}>
              ＋
            </Button>
          </div>
          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {keywords.map((k) => (
                <span
                  key={k}
                  className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] text-[var(--text-hi)]"
                >
                  {k}
                  <button
                    type="button"
                    onClick={() => removeKeyword(k)}
                    className="text-[var(--text-lo)] hover:text-[var(--crimson)]"
                    aria-label={`${t('common.delete')} ${k}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
            </div>
          )}
          <span className="text-[11px] text-[var(--text-lo)]">{t('categories.keywordsHint')}</span>
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
