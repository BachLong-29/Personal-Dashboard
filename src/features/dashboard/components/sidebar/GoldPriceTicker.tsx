'use client';

import { useTranslations } from 'next-intl';

import { useGoldPrice } from '@/features/finance/hooks/useGoldPrice';
import { formatCurrency } from '@/features/finance/utils';
import { Link } from '@/i18n/navigation';
import { cn } from '@/libs/utils';

/** Quick glance at the SJC gold price — links through to Finance for the full picture. */
export function GoldPriceTicker() {
  const t = useTranslations('dashboard');
  const { data, isLoading } = useGoldPrice();
  const sjc = data?.prices.find((p) => p.goldType === 'sjc');

  if (isLoading) {
    return (
      <div className="h-[58px] shrink-0 animate-pulse rounded-[var(--r)] bg-[var(--panel2)]" />
    );
  }
  if (!sjc) return null;

  return (
    <Link href="/finance/wallets" className={card}>
      <div className={row}>
        <span className={label}>◆ {t('goldPrice.title')}</span>
        {sjc.stale && <span className={staleTag}>{t('goldPrice.stale')}</span>}
      </div>
      <div className={priceRow}>
        <span className={priceCol}>
          <span className={cn(priceLabel, buyColor)}>{t('goldPrice.buy')}</span>
          <span className={cn(priceValue, buyColor)}>{formatCurrency(sjc.buyPrice)}</span>
        </span>
        <span className={divider} />
        <span className={priceCol}>
          <span className={cn(priceLabel, sellColor)}>{t('goldPrice.sell')}</span>
          <span className={cn(priceValue, sellColor)}>{formatCurrency(sjc.sellPrice)}</span>
        </span>
      </div>
    </Link>
  );
}

const card =
  'block shrink-0 bg-[linear-gradient(135deg,oklch(0.3_0.05_85_/_0.2),oklch(0.22_0.03_270_/_0.2))] border border-[oklch(0.78_0.16_82_/_0.3)] rounded-[var(--r)] px-[14px] py-2.5 no-underline transition-colors hover:border-[oklch(0.78_0.16_82_/_0.55)]';
const row = 'flex items-center justify-between mb-1.5';
const label = 'text-[8px] tracking-[0.12em] uppercase text-[var(--gold)] font-[var(--font-title)]';
const staleTag =
  'text-[7px] tracking-[0.08em] uppercase text-[var(--text-dim)] font-[var(--font-title)]';
const priceRow = 'flex items-center gap-2.5';
const priceCol = 'flex-1 min-w-0 flex flex-col gap-px';
const priceLabel = 'text-[8px] uppercase tracking-[0.06em]';
const priceValue = 'text-[13px] font-bold tabular-nums truncate';
const divider = 'w-px h-6 bg-[var(--border)] opacity-60 shrink-0';
const buyColor = 'text-[var(--mint)]';
const sellColor = 'text-[var(--rose)]';
