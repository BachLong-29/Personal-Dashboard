'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/common/Icon';
import type { Wallet } from '@/types';

import { useSepayStatus } from '../../hooks/useSepayStatus';
import { SectionCard } from './SectionCard';

interface SepayCardProps {
  wallets: Wallet[];
}

/**
 * Bank-sync status for the first bank wallet, with the webhook URL to paste into SePay.
 * Renders nothing when there is no bank wallet — there'd be nothing to connect.
 */
export function SepayCard({ wallets }: SepayCardProps) {
  const t = useTranslations('finance');
  const [copied, setCopied] = useState(false);

  const bankWallet = wallets.find((w) => w.type === 'bank') ?? null;
  const { data: status } = useSepayStatus(bankWallet?.id ?? null);

  if (!bankWallet) return null;

  const state = !status?.configured
    ? 'notConfigured'
    : status.connected
      ? 'connected'
      : 'notConnected';
  const tone =
    state === 'connected'
      ? 'var(--mint)'
      : state === 'notConnected'
        ? 'var(--gold)'
        : 'var(--text-mid)';

  async function handleCopy() {
    if (!status?.webhookUrl) return;
    await navigator.clipboard.writeText(status.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <SectionCard
      title={t('sepayCard.title')}
      action={{ href: '/finance/wallets', label: t('sepayCard.setUp') }}
      index={3}
    >
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 text-[12px] text-[var(--text-hi)]">
          <Icon icon={bankWallet.icon} />
          <span className="truncate">{bankWallet.name}</span>
        </span>
        <span
          className="ml-auto shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.08em]"
          style={{ color: tone, borderColor: tone }}
        >
          {t(`sepayCard.${state}`)}
        </span>
      </div>

      <label className="mt-3 flex flex-col gap-1.5">
        <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[var(--text-mid)] [font-family:var(--f-title)]">
          {t('sepayCard.urlLabel')}
        </span>
        <div className="flex gap-2">
          <input
            readOnly
            value={status?.webhookUrl ?? ''}
            onFocus={(e) => e.target.select()}
            className="min-w-0 flex-1 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[11px] text-[var(--text-hi)] focus:border-[var(--gold)] focus:outline-none"
          />
          <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!status?.webhookUrl}>
            {copied ? t('sepayCard.copied') : t('sepayCard.copy')}
          </Button>
        </div>
      </label>

      <p className="mt-1.5 text-[11px] leading-relaxed text-[var(--text-mid)]">
        {t('sepayCard.hint')}
      </p>
    </SectionCard>
  );
}
