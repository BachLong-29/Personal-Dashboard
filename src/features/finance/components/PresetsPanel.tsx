'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { cn } from '@/libs/utils';
import { MAX_TRANSACTION_PRESETS } from '@/types/finance';
import type { TransactionPreset, TransactionType } from '@/types';

import { useFinanceCategories } from '../hooks/useFinanceCategories';
import { useDeletePreset, usePresets, useSavePreset } from '../hooks/usePresets';
import { useWallets } from '../hooks/useWallets';
import { formatAmountInput, formatCurrency, toAmountDigits } from '../utils';

/** The one-tap transactions the mobile home-screen widget offers. Shared with the app. */
export function PresetsPanel() {
  const t = useTranslations('finance');
  const { data: presets = [] } = usePresets();
  const [editing, setEditing] = useState<TransactionPreset | 'new' | null>(null);
  const canAdd = presets.length < MAX_TRANSACTION_PRESETS;

  return (
    <section className="flex flex-col gap-2 rounded-[var(--r-lg)] border border-[var(--border)] p-3">
      <div className="flex items-center gap-2">
        <span className="flex-1 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--gold)] [font-family:var(--f-title)]">
          {t('presets.title')}
        </span>
        {canAdd && (
          <Button variant="ghost" onClick={() => setEditing('new')}>
            ＋ {t('presets.add')}
          </Button>
        )}
      </div>
      <p className="text-[12px] text-[var(--text-mid)]">
        {t('presets.hint', { count: MAX_TRANSACTION_PRESETS })}
      </p>

      {presets.length === 0 ? (
        <p className="text-[12px] text-[var(--text-lo)]">{t('presets.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => setEditing(preset)}
              className="flex items-center gap-3 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-left transition-colors hover:border-[var(--gold)]"
            >
              <span className="flex-1 truncate text-[13px] font-bold text-[var(--text-hi)]">
                {preset.label}
              </span>
              <span
                className={cn(
                  'text-[12px] tabular-nums',
                  preset.type === 'income' ? 'text-[var(--mint)]' : 'text-[var(--rose)]',
                )}
              >
                {preset.type === 'income' ? '+' : '−'}
                {formatCurrency(preset.amount)}
              </span>
            </button>
          ))}
        </div>
      )}

      <PresetFormModal
        open={editing !== null}
        onClose={() => setEditing(null)}
        preset={editing === 'new' ? null : editing}
      />
    </section>
  );
}

interface FormProps {
  open: boolean;
  onClose: () => void;
  preset: TransactionPreset | null;
}

function PresetFormModal({ open, onClose, preset }: FormProps) {
  const t = useTranslations('finance');
  const { data: wallets = [] } = useWallets();
  const { data: allCategories = [] } = useFinanceCategories();
  const save = useSavePreset();
  const remove = useDeletePreset();
  const pending = save.isPending || remove.isPending;

  const [label, setLabel] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [walletId, setWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  // Re-seed on open (adjusted during render, like the other form modals).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setLabel(preset?.label ?? '');
      setType(preset?.type ?? 'expense');
      setAmount(preset ? String(preset.amount) : '');
      setNote(preset?.note ?? '');
      setWalletId(preset?.walletId ?? '');
      setCategoryId(preset?.categoryId ?? '');
    }
  }

  const categories = allCategories.filter((c) => c.type === type);
  // The first of each, so the common case needs no picking.
  const wallet = wallets.find((w) => w.id === walletId) ?? wallets[0];
  const category = categories.find((c) => c.id === categoryId) ?? categories[0];
  const value = amount ? parseInt(amount, 10) : 0;
  const canSave = label.trim().length > 0 && value > 0 && !!wallet && !!category && !pending;

  function submit() {
    if (!canSave || !wallet || !category) return;
    save.mutate(
      {
        id: preset?.id,
        label: label.trim(),
        type,
        amount: value,
        walletId: wallet.id,
        categoryId: category.id,
        note: note.trim() || (preset ? null : undefined),
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="440px">
      <ModalHead
        tag={t('presets.title')}
        title={preset ? `✎ ${t('presets.edit')}` : `＋ ${t('presets.add')}`}
      />
      <ModalBody className="flex flex-col gap-4">
        <Field label={t('presets.name')}>
          <input
            className={input}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={16}
            placeholder={t('presets.namePlaceholder')}
            autoFocus
          />
        </Field>

        <div className="flex gap-2">
          {(['expense', 'income'] as const).map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => {
                setType(kind);
                setCategoryId('');
              }}
              className={cn(
                'flex-1 rounded-[var(--r-sm)] border px-2 py-2 text-[11px] font-bold uppercase tracking-[0.04em] transition-all',
                type === kind
                  ? 'border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.1)] text-[var(--gold)]'
                  : 'border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)]',
              )}
            >
              {t(kind === 'expense' ? 'presets.expense' : 'presets.income')}
            </button>
          ))}
        </div>

        <Field label={t('presets.amount')}>
          <input
            className={input}
            inputMode="numeric"
            value={formatAmountInput(amount)}
            onChange={(e) => setAmount(toAmountDigits(e.target.value))}
            placeholder="0"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={t('presets.wallet')}>
            <select
              className={input}
              value={wallet?.id ?? ''}
              onChange={(e) => setWalletId(e.target.value)}
            >
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={t('presets.category')}>
            <select
              className={input}
              value={category?.id ?? ''}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label={t('presets.note')}>
          <input
            className={input}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
          />
        </Field>
      </ModalBody>
      <ModalFoot>
        {preset ? (
          <Button
            variant="danger"
            disabled={pending}
            onClick={() => remove.mutate(preset.id, { onSuccess: onClose })}
          >
            {t('common.delete')}
          </Button>
        ) : (
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            {t('common.cancel')}
          </Button>
        )}
        <Button variant="primary" onClick={submit} disabled={!canSave} isLoading={save.isPending}>
          ✦ {t('common.save')}
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

const input =
  'w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2 text-[13px] text-[var(--text-hi)] focus:border-[var(--gold)] focus:outline-none';
