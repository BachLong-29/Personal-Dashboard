'use client';

import { useState } from 'react';

import { useTranslations } from 'next-intl';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/libs/utils';
import type { TaskColor, Wallet } from '@/types';
import type { WalletType } from '@/types/finance';

import { COLOR_CSS, COLOR_OPTIONS, WALLET_ICONS, WALLET_TYPE_OPTIONS } from '../constants';
import { useCreateWallet } from '../hooks/useCreateWallet';
import { useUpdateWallet } from '../hooks/useUpdateWallet';
import { formatSignedAmountInput, toSignedAmountDigits } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  /** Pass a wallet to edit it; omit to create a new one. */
  wallet?: Wallet | null;
}

export function WalletFormModal({ open, onClose, wallet }: Props) {
  const t = useTranslations('finance');
  const createWallet = useCreateWallet();
  const updateWallet = useUpdateWallet();
  const isEdit = !!wallet;
  const isPending = createWallet.isPending || updateWallet.isPending;

  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [icon, setIcon] = useState(WALLET_ICONS[0] ?? '🏦');
  const [color, setColor] = useState<TaskColor>('gold');
  const [bankCode, setBankCode] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [balance, setBalance] = useState('0');
  // Only true once the user actually edits the balance field — an edit save must never
  // resubmit the value it was pre-filled with, since transactions/webhooks may have
  // moved the real balance forward while the modal was open, and re-sending the stale
  // snapshot would silently overwrite that.
  const [balanceTouched, setBalanceTouched] = useState(false);

  // Re-seed form fields whenever the modal opens, so edit prefills and create starts blank.
  // Adjusted during render (not an effect) to avoid an extra render pass on open.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setName(wallet?.name ?? '');
      setType(wallet?.type ?? 'bank');
      setIcon(wallet?.icon ?? WALLET_ICONS[0] ?? '🏦');
      setColor(wallet?.color ?? 'gold');
      setBankCode(wallet?.bankCode ?? '');
      setBankAccountNumber(wallet?.bankAccountNumber ?? '');
      setBalance(String(wallet?.balance ?? 0));
      setBalanceTouched(false);
    }
  }

  const typeLabels: Record<WalletType, string> = {
    bank: t('wallet.typeBank'),
    cash: t('wallet.typeCash'),
    ewallet: t('wallet.typeEwallet'),
  };

  const balanceValue = Number(balance);
  const canSave = name.trim().length > 0 && Number.isFinite(balanceValue) && !isPending;

  function handleSubmit() {
    if (!canSave) return;

    const bankFields = {
      bankCode: type === 'bank' ? bankCode.trim() || undefined : undefined,
      bankAccountNumber: type === 'bank' ? bankAccountNumber.trim() || undefined : undefined,
    };

    if (wallet) {
      updateWallet.mutate(
        {
          id: wallet.id,
          name: name.trim(),
          icon,
          color,
          ...(balanceTouched ? { balance: balanceValue } : {}),
          ...bankFields,
        },
        { onSuccess: onClose },
      );
      return;
    }

    createWallet.mutate(
      { name: name.trim(), type, icon, color, balance: balanceValue, ...bankFields },
      { onSuccess: onClose },
    );
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="440px">
      <ModalHead
        tag={isEdit ? t('wallet.editTag') : t('wallet.newTag')}
        title={isEdit ? '✎ ' + t('wallet.editTitle') : '＋ ' + t('wallet.newTitle')}
      />
      <ModalBody className="flex flex-col gap-4">
        <Field label={t('wallet.name')}>
          <input
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder={t('wallet.namePlaceholder')}
            autoFocus
          />
        </Field>

        <Field label={t('wallet.balance')}>
          <input
            className={input}
            type="text"
            inputMode="numeric"
            value={formatSignedAmountInput(balance)}
            onChange={(e) => {
              setBalance(toSignedAmountDigits(e.target.value));
              setBalanceTouched(true);
            }}
            placeholder="0"
          />
          <span className="text-[11px] text-[var(--text-lo)]">
            {isEdit && !balanceTouched ? t('wallet.balanceHintUnedited') : t('wallet.balanceHint')}
          </span>
        </Field>

        <Field label={t('wallet.type')}>
          <div className="flex gap-2">
            {WALLET_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setType(option.value)}
                disabled={isEdit}
                title={isEdit ? t('wallet.typeLocked') : undefined}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-[var(--r-sm)] border px-2 py-2 text-[11px] font-bold uppercase tracking-[0.04em] transition-all',
                  type === option.value
                    ? 'border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.1)] text-[var(--gold)]'
                    : 'border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)]',
                  isEdit && 'cursor-not-allowed opacity-50 hover:text-[var(--text-mid)]',
                )}
              >
                <span>{option.icon}</span>
                {typeLabels[option.value]}
              </button>
            ))}
          </div>
        </Field>

        <Field label={t('wallet.icon')}>
          <div className="flex flex-wrap gap-1.5">
            {WALLET_ICONS.map((ic) => (
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
        </Field>

        <Field label={t('wallet.color')}>
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
        </Field>

        {type === 'bank' && (
          <div className="grid grid-cols-2 gap-3">
            <Field label={t('wallet.bankCode')}>
              <input
                className={input}
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                placeholder="VCB"
              />
            </Field>
            <Field label={t('wallet.accountNumber')}>
              <input
                className={input}
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="0123456789"
              />
            </Field>
          </div>
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

const input =
  'w-full bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2 text-[13px] text-[var(--text-hi)] focus:border-[var(--gold)] focus:outline-none';
