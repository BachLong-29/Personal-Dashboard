'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { cn } from '@/libs/utils';
import type { FinanceCategory, Transaction, TransactionType, Wallet } from '@/types';

import { COLOR_CSS } from '../constants';
import { formatAmountInput, toAmountDigits } from '../utils';
import { useCreateTransaction } from '../hooks/useCreateTransaction';
import { useUpdateTransaction } from '../hooks/useUpdateTransaction';
import { useDeleteTransaction } from '../hooks/useDeleteTransaction';

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
}

export function TransactionFormModal({
  open,
  onClose,
  wallets,
  categories,
  transaction,
  defaultWalletId,
}: Props) {
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
        setType('expense');
        setWalletId(defaultWalletId || wallets[0]?.id || '');
        setCategoryId('');
        setAmount('');
        setNote('');
        setDate(today());
      }
    }
  }

  const filteredCategories = categories.filter((c) => c.type === type);
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
    <Modal open={open} onClose={onClose} maxWidth="480px">
      <ModalHead
        tag={isEdit ? 'EDIT TRANSACTION' : 'NEW TRANSACTION'}
        title={isEdit ? '✎ Edit Transaction' : '＋ Add Transaction'}
      />
      <ModalBody className="max-h-[calc(80vh-130px)] overflow-y-auto flex flex-col gap-4">
        {/* Type toggle */}
        <div className="relative flex gap-1 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--panel)] p-1">
          {(['expense', 'income'] as TransactionType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => handleTypeChange(t)}
              className="relative flex-1 py-2 text-[12px] font-bold uppercase tracking-[0.06em] [font-family:var(--f-title)]"
            >
              {type === t && (
                <motion.span
                  layoutId="tx-type-pill"
                  transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  className={cn(
                    'absolute inset-0 rounded-[var(--r-sm)]',
                    t === 'income'
                      ? 'bg-[oklch(0.76_0.14_162_/_0.14)]'
                      : 'bg-[oklch(0.72_0.18_5_/_0.14)]',
                  )}
                />
              )}
              <span
                className="relative"
                style={{
                  color:
                    type === t
                      ? t === 'income'
                        ? 'var(--mint)'
                        : 'var(--rose)'
                      : 'var(--text-mid)',
                }}
              >
                {t === 'income' ? '↓ Income' : '↑ Expense'}
              </span>
            </button>
          ))}
        </div>

        {/* Amount */}
        <Field label="Amount">
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
        <Field label="Wallet">
          <Select
            options={wallets.map((w) => ({ value: w.id, label: `${w.icon} ${w.name}` }))}
            value={walletId}
            onValueChange={setWalletId}
            placeholder="Select wallet"
          />
        </Field>

        {/* Category grid */}
        <Field label="Category">
          <div className="flex flex-wrap gap-1.5">
            {filteredCategories.map((c) => {
              const accent = COLOR_CSS[c.color];
              const selected = categoryId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
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
        </Field>

        {/* Note */}
        <Field label="Note (optional)">
          <input
            className={input}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={200}
            placeholder="What was this for?"
          />
        </Field>

        {/* Date */}
        <Field label="Date">
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
          <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleteTx.isPending}>
            Delete
          </Button>
        )}
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!canSave} isLoading={saving}>
            {isEdit ? '✦ Save' : '✦ Add'}
          </Button>
        </div>
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

const input =
  'w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2 text-[13px] text-[var(--text-hi)] focus:border-[var(--gold)] focus:outline-none';
