'use client';

import { useState } from 'react';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/libs/utils';
import type { TaskColor } from '@/types';
import type { WalletType } from '@/types/finance';

import { COLOR_CSS, COLOR_OPTIONS, WALLET_ICONS, WALLET_TYPE_OPTIONS } from '../constants';
import { useCreateWallet } from '../hooks/useCreateWallet';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function WalletFormModal({ open, onClose }: Props) {
  const createWallet = useCreateWallet();

  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [icon, setIcon] = useState(WALLET_ICONS[0] ?? '🏦');
  const [color, setColor] = useState<TaskColor>('gold');
  const [bankCode, setBankCode] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');

  const canSave = name.trim().length > 0 && !createWallet.isPending;

  function reset() {
    setName('');
    setType('bank');
    setIcon(WALLET_ICONS[0] ?? '🏦');
    setColor('gold');
    setBankCode('');
    setBankAccountNumber('');
  }

  function handleSubmit() {
    if (!canSave) return;
    createWallet.mutate(
      {
        name: name.trim(),
        type,
        icon,
        color,
        bankCode: type === 'bank' ? bankCode.trim() || undefined : undefined,
        bankAccountNumber: type === 'bank' ? bankAccountNumber.trim() || undefined : undefined,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      },
    );
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="440px">
      <ModalHead tag="NEW WALLET" title="＋ Add Wallet" />
      <ModalBody className="flex flex-col gap-4">
        <Field label="Name">
          <input
            className={input}
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            placeholder="e.g. Vietcombank, Cash"
            autoFocus
          />
        </Field>

        <Field label="Type">
          <div className="flex gap-2">
            {WALLET_TYPE_OPTIONS.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded-[var(--r-sm)] border px-2 py-2 text-[11px] font-bold uppercase tracking-[0.04em] transition-all',
                  type === t.value
                    ? 'border-[var(--gold)] bg-[oklch(0.74_0.17_85_/_0.1)] text-[var(--gold)]'
                    : 'border-[var(--border)] text-[var(--text-mid)] hover:text-[var(--text-hi)]',
                )}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Icon">
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

        <Field label="Color">
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
            <Field label="Bank Code">
              <input
                className={input}
                value={bankCode}
                onChange={(e) => setBankCode(e.target.value)}
                placeholder="VCB"
              />
            </Field>
            <Field label="Account Number">
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
        <Button variant="ghost" onClick={onClose} disabled={createWallet.isPending}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!canSave}
          isLoading={createWallet.isPending}
        >
          ✦ Create
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
