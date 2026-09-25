'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
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

function toDateString(d: Date): string {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

function parseDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
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

  // Only the current type's categories are on offer; switching type clears the
  // choice below, so the list and the selection can never disagree.
  const categoryOptions = useMemo(
    () =>
      categories
        .filter((c) => c.type === type)
        .map((c) => ({
          value: c.id,
          // The label is markup, so the filter needs the plain name to match on.
          searchText: c.name,
          label: (
            <span className="flex min-w-0 items-center gap-2">
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: COLOR_CSS[c.color] }}
              />
              <span className="shrink-0">{c.icon}</span>
              <span className="truncate">{c.name}</span>
            </span>
          ),
        })),
    [categories, type],
  );

  function handleTypeChange(next: TransactionType) {
    setType(next);
    setCategoryId('');
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
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
        <form onSubmit={handleSubmit}>
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

            {/* A dropdown, not a chip grid: the list grows with every category
            the reader adds, and at two dozen it had taken five wrapped rows —
            more of the modal than the amount it belongs to. One row now, and
            no height change when the type toggles. */}
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
              <Select
                options={categoryOptions}
                value={categoryId}
                onValueChange={setCategoryId}
                placeholder={t('transactions.category')}
                searchable
                selectedFirst
              />
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
              <DatePicker
                value={parseDateString(date)}
                onChange={(d) => setDate(toDateString(d))}
              />
            </Field>
          </ModalBody>
          <ModalFoot className={isEdit ? 'justify-between' : undefined}>
            {isEdit && (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleDelete}
                isLoading={deleteTx.isPending}
              >
                {t('common.delete')}
              </Button>
            )}
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={!canSave} isLoading={saving}>
                ✦ {isEdit ? t('common.save') : t('common.create')}
              </Button>
            </div>
          </ModalFoot>
        </form>
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
