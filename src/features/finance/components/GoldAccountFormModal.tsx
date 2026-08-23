'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { GoldAccount } from '@/types';

import { useUpdateGoldAccount } from '../hooks/useUpdateGoldAccount';
import { formatCurrency } from '../utils';

interface Props {
  open: boolean;
  onClose: () => void;
  account: GoldAccount | null | undefined;
}

/** Parses a number input's string value, treating blank/invalid as 0 — quantities never go negative. */
function toQuantity(raw: string): number {
  const n = Number(raw);
  return raw === '' || Number.isNaN(n) || n < 0 ? 0 : n;
}

/** Edit "gold bar" (cây) + "tael" (chỉ) counts for the user's single gold holding. */
export function GoldAccountFormModal({ open, onClose, account }: Props) {
  const t = useTranslations('finance');
  const updateGoldAccount = useUpdateGoldAccount();

  const [cay, setCay] = useState(0);
  const [chi, setChi] = useState(0);

  // Re-seed fields whenever the modal opens, matching WalletFormModal's convention — adjusted
  // during render (not an effect) to avoid an extra render pass on open.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setCay(account?.quantityCay ?? 0);
      setChi(account?.quantityChi ?? 0);
    }
  }

  const totalChi = cay * 10 + chi;
  const previewValue = account?.pricePerChi != null ? totalChi * account.pricePerChi : null;
  const canSave = !updateGoldAccount.isPending;

  function handleSubmit() {
    if (!canSave) return;
    updateGoldAccount.mutate({ quantityCay: cay, quantityChi: chi }, { onSuccess: onClose });
  }

  return (
    <Modal open={open} onClose={onClose} maxWidth="380px">
      <ModalHead tag={t('accounts.goldEditTag')} title={'✎ ' + t('accounts.goldEditTitle')} />
      <ModalBody className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label={t('overview.goldCay')}>
            <input
              className={input}
              type="number"
              min={0}
              step={1}
              inputMode="decimal"
              value={cay}
              onChange={(e) => setCay(toQuantity(e.target.value))}
              autoFocus
            />
          </Field>
          <Field label={t('overview.goldChi')}>
            <input
              className={input}
              type="number"
              min={0}
              step={0.1}
              inputMode="decimal"
              value={chi}
              onChange={(e) => setChi(toQuantity(e.target.value))}
            />
          </Field>
        </div>

        <div className="rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5">
          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-lo)] [font-family:var(--f-title)]">
            {t('accounts.goldPreviewValue')}
          </span>
          <div className="mt-0.5 text-[18px] font-bold tabular-nums text-[var(--gold)] [font-family:var(--f-title)]">
            {previewValue !== null ? formatCurrency(previewValue) : '—'}
          </div>
        </div>
      </ModalBody>
      <ModalFoot>
        <Button variant="ghost" onClick={onClose} disabled={updateGoldAccount.isPending}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!canSave}
          isLoading={updateGoldAccount.isPending}
        >
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
