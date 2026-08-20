'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { cn } from '@/libs/utils';
import type { FinanceCategory, Transaction, TransactionType, Wallet } from '@/types';

import type { QuickEntryDraft } from '../quick-entry';

import { COLOR_CSS } from '../constants';
import { formatAmountInput, toAmountDigits } from '../utils';
import { useCreateTransaction } from '../hooks/useCreateTransaction';
import { useUpdateTransaction } from '../hooks/useUpdateTransaction';
import { useDeleteTransaction } from '../hooks/useDeleteTransaction';
import { FinanceCategoryFormModal } from './FinanceCategoryFormModal';

function today(): string {
  return new Date().toISOString().substring(0, 10);
}

interface Props {
  open: boolean;
  onClose: () => void;
  wallets: Wallet[];
  categories: FinanceCategory[];
  /** Provided when editing an existing transaction. */
  transaction?: Transaction | null;
  /** Preselected wallet when creating from a selected wallet card. */
  defaultWalletId?: string | null;
  /** Prefilled values from the quick-add parser — the user still confirms before saving. */
  draft?: QuickEntryDraft | null;
}

export function TransactionFormModal({
  open,
  onClose,
  wallets,
  categories,
  transaction,
  defaultWalletId,
  draft,
}: Props) {
  const t = useTranslations('finance');
  const isEdit = !!transaction;
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();
  const saving = createTx.isPending || updateTx.isPending;

  const [type, setType] = useState<TransactionType>('expense');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(today());
  const [showNewCategory, setShowNewCategory] = useState(false);

  // Re-seed form fields whenever the modal opens for a different transaction/context.
  // Adjusted during render (not an effect) to avoid an extra render pass on open.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      if (transaction) {
        setType(transaction.type);
        setWalletId(transaction.walletId);
        setCategoryId(transaction.categoryId);
        setAmount(String(transaction.amount));
        setNote(transaction.note ?? '');
        setDate(transaction.date);
      } else {
        setType(draft?.type ?? 'expense');
        setWalletId(draft?.walletId || defaultWalletId || wallets[0]?.id || '');
        setCategoryId(draft?.categoryId ?? '');
        setAmount(draft ? String(draft.amount) : '');
        setNote(draft?.note ?? '');
        setDate(today());
      }
    }
  }

  const amountNum = parseFloat(amount);
  const canSave =
    walletId && categoryId && amountNum > 0 && !saving && (!isEdit || !deleteTx.isPending);

  function handleTypeChange(next: TransactionType) {
    setType(next);
    setCategoryId('');
  }

  function handleSubmit() {
    if (!canSave) return;
    const payload = {
      walletId,
      categoryId,
      type,
      amount: amountNum,
      note: note.trim() || undefined,
      date,
    };

    if (transaction) {
      updateTx.mutate({ id: transaction.id, ...payload }, { onSuccess: () => onClose() });
    } else {
      createTx.mutate(payload, { onSuccess: () => onClose() });
    }
  }

  function handleDelete() {
    if (!transaction) return;
    deleteTx.mutate(transaction.id, { onSuccess: () => onClose() });
  }

  return (
    <>
      <Modal open={open} onClose={onClose} maxWidth="480px">
        <ModalHead
          tag={isEdit ? t('transactions.editTag') : t('transactions.newTag')}
          title={`${isEdit ? '✎' : '＋'} ${
            isEdit ? t('transactions.editTitle') : t('transactions.newTitle')
          }`}
        />
        <ModalBody className="max-h-[calc(80vh-130px)] overflow-y-auto flex flex-col gap-4">
          {/* Type toggle */}
          <div className="relative flex gap-1 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--panel)] p-1">
            {(['expense', 'income'] as TransactionType[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => handleTypeChange(option)}
                className="relative flex-1 py-2 text-[12px] font-bold uppercase tracking-[0.06em] [font-family:var(--f-title)]"
              >
                {type === option && (
                  <motion.span
                    layoutId="tx-type-pill"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className={cn(
                      'absolute inset-0 rounded-[var(--r-sm)]',
                      option === 'income'
                        ? 'bg-[oklch(0.76_0.14_162_/_0.14)]'
                        : 'bg-[oklch(0.72_0.18_5_/_0.14)]',
                    )}
                  />
                )}
                <span
                  className="relative"
                  style={{
                    color:
                      type === option
                        ? option === 'income'
                          ? 'var(--mint)'
                          : 'var(--rose)'
                        : 'var(--text-mid)',
                  }}
                >
                  {option === 'income'
                    ? `↓ ${t('transactions.income')}`
                    : `↑ ${t('transactions.expense')}`}
                </span>
              </button>
            ))}
          </div>

          {/* Amount */}
          <Field label={t('transactions.amount')}>
            <input
              type="text"
              inputMode="numeric"
              className={cn(input, 'text-[18px] font-bold tabular-nums')}
              value={formatAmountInput(amount)}
              onChange={(e) => setAmount(toAmountDigits(e.target.value))}
              placeholder="0"
              autoFocus
            />
          </Field>

          {/* Wallet */}
          <Field label={t('transactions.wallet')}>
            <Select
              options={wallets.map((w) => ({ value: w.id, label: `${w.icon} ${w.name}` }))}
              value={walletId}
              onValueChange={setWalletId}
              placeholder={t('transactions.wallet')}
            />
          </Field>

          {/* Category grid — both type's chip sets are stacked in the same CSS grid cell, so the
            container's height is always the taller of the two and never jumps on toggle. */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold tracking-[0.12em] uppercase text-[var(--text-lo)] [font-family:var(--f-title)]">
                {t('transactions.category')}
              </span>
              <button
                type="button"
                onClick={() => setShowNewCategory(true)}
                className="text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--gold)] hover:underline"
              >
                ＋ {t('transactions.newCategory')}
              </button>
            </div>
            <div className="grid">
              {(['expense', 'income'] as TransactionType[]).map((section) => {
                const active = type === section;
                return (
                  <div
                    key={section}
                    aria-hidden={!active}
                    className={cn(
                      'col-start-1 row-start-1 flex flex-wrap content-start gap-1.5 transition-opacity duration-150',
                      active ? 'opacity-100' : 'pointer-events-none opacity-0',
                    )}
                  >
                    {categories
                      .filter((c) => c.type === section)
                      .map((c) => {
                        const accent = COLOR_CSS[c.color];
                        const selected = categoryId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            tabIndex={active ? 0 : -1}
                            onClick={() => setCategoryId(c.id)}
                            className={cn(
                              'flex items-center gap-1.5 rounded-[var(--r-sm)] border px-2.5 py-1.5 text-[11px] font-semibold transition-all',
                              selected ? 'scale-[1.03]' : 'opacity-70 hover:opacity-100',
                            )}
                            style={{
                              borderColor: selected ? accent : 'var(--border)',
                              background: selected
                                ? `color-mix(in oklch, ${accent} 14%, transparent)`
                                : 'transparent',
                              color: selected ? accent : 'var(--text-mid)',
                            }}
                          >
                            <span>{c.icon}</span>
                            {c.name}
                          </button>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <Field label={t('transactions.note')}>
            <input
              className={input}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder={t('transactions.notePlaceholder')}
            />
          </Field>

          {/* Date */}
          <Field label={t('transactions.date')}>
            <input
              type="date"
              className={input}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </ModalBody>
        <ModalFoot className={isEdit ? 'justify-between' : undefined}>
          {isEdit && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={deleteTx.isPending}
            >
              {t('common.delete')}
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" onClick={handleSubmit} disabled={!canSave} isLoading={saving}>
              ✦ {isEdit ? t('common.save') : t('common.create')}
            </Button>
          </div>
        </ModalFoot>
      </Modal>

      <FinanceCategoryFormModal
        open={showNewCategory}
        onClose={() => setShowNewCategory(false)}
        defaultType={type}
        lockType
        onSaved={(mode, created) => {
          if (mode === 'created') setCategoryId(created.id);
        }}
      />
    </>
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

const input =
  'w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2 text-[13px] text-[var(--text-hi)] focus:border-[var(--gold)] focus:outline-none';
