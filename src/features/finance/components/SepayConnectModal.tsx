'use client';

import { useState } from 'react';

import { Modal, ModalHead, ModalBody, ModalFoot } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/libs/utils';
import type { Wallet } from '@/types';

import { useSepayStatus } from '../hooks/useSepayStatus';
import { useGenerateSepayKey } from '../hooks/useGenerateSepayKey';

interface Props {
  wallet: Wallet | null;
  onClose: () => void;
}

export function SepayConnectModal({ wallet, onClose }: Props) {
  const walletId = wallet?.id ?? null;
  const { data: status, isLoading } = useSepayStatus(walletId);
  const generateKey = useGenerateSepayKey(walletId);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState<'url' | 'key' | null>(null);

  function handleClose() {
    setRevealedKey(null);
    generateKey.reset();
    onClose();
  }

  function handleGenerate() {
    generateKey.mutate(undefined, {
      onSuccess: (result) => setRevealedKey(result?.apiKey ?? null),
    });
  }

  async function copy(text: string, which: 'url' | 'key') {
    await navigator.clipboard.writeText(text);
    setCopied(which);
    setTimeout(() => setCopied((c) => (c === which ? null : c)), 1500);
  }

  return (
    <Modal open={!!wallet} onClose={handleClose} maxWidth="440px">
      <ModalHead tag="BANK SYNC" title="🔌 Connect SePay" />
      <ModalBody className="flex flex-col gap-4">
        {wallet && (
          <div className="flex items-center gap-2 text-[12px] text-[var(--text-mid)]">
            <span>{wallet.name}</span>
            {!isLoading && status && (
              <span
                className={cn(
                  'rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]',
                  status.connected
                    ? 'border-[var(--mint)] text-[var(--mint)]'
                    : 'border-[var(--border)] text-[var(--text-lo)]',
                )}
              >
                {status.connected ? 'Connected' : 'Not synced yet'}
              </span>
            )}
          </div>
        )}

        <Field label="Webhook URL">
          <div className="flex gap-2">
            <input
              className={input}
              value={status?.webhookUrl ?? ''}
              readOnly
              onFocus={(e) => e.target.select()}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => status && copy(status.webhookUrl, 'url')}
              disabled={!status}
            >
              {copied === 'url' ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <span className="text-[11px] text-[var(--text-lo)]">
            Paste this into your SePay dashboard webhook config (auth method: API Key).
          </span>
        </Field>

        {revealedKey ? (
          <Field label="API Key — save it now, shown only once">
            <div className="flex gap-2">
              <input
                className={cn(input, 'text-[var(--gold)]')}
                value={revealedKey}
                readOnly
                onFocus={(e) => e.target.select()}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => copy(revealedKey, 'key')}
              >
                {copied === 'key' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <span className="text-[11px] text-[var(--rose)]">
              You won&apos;t be able to see this key again after closing this window.
            </span>
          </Field>
        ) : (
          <Button
            type="button"
            variant="primary"
            onClick={handleGenerate}
            isLoading={generateKey.isPending}
            disabled={!wallet}
          >
            {status?.configured ? '↻ Rotate API Key' : '✦ Generate API Key'}
          </Button>
        )}
      </ModalBody>
      <ModalFoot>
        <Button variant="ghost" onClick={handleClose}>
          Done
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
  'w-full min-w-0 bg-[var(--surface-2)] border border-[var(--border)] rounded-[var(--r-sm)] px-3 py-2 text-[13px] text-[var(--text-hi)] focus:border-[var(--gold)] focus:outline-none';
