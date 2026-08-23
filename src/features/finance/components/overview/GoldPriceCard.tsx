'use client';

import { useLocale, useTranslations } from 'next-intl';

import { useGoldPrice } from '../../hooks/useGoldPrice';
import { formatCurrency } from '../../utils';
import { SectionCard } from './SectionCard';

function formatUpdatedAt(iso: string, locale: string): string {
  return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
}

/**
 * Live SJC/DOJI/PNJ/24K gold price ticker (VND/chỉ), sourced from vang.today — see
 * rules/docs/requirements/finance-gold.md. Not tied to any holding yet; informational only.
 */
export function GoldPriceCard() {
  const t = useTranslations('finance');
  const locale = useLocale();
  const { data, isLoading } = useGoldPrice();

  // vngsjc is fetched alongside these but only used to price GoldAccountCard — not shown here.
  const prices = (data?.prices ?? []).filter((p) => p.goldType !== 'vngsjc');
  const unavailable = data?.unavailable ?? false;
  const anyStale = prices.some((p) => p.stale);
  const latestFetchedAt = prices[0]?.fetchedAt;

  return (
    <SectionCard title={t('overview.goldPrice')} index={2}>
      {isLoading ? (
        <div className="h-[72px] animate-pulse rounded-[var(--r-md)] bg-[var(--panel2)]" />
      ) : unavailable || prices.length === 0 ? (
        <p className="text-[12px] text-[var(--text-mid)]">{t('overview.goldPriceUnavailable')}</p>
      ) : (
        <>
          <ul className="flex flex-wrap gap-1.5 sm:gap-2">
            {prices.map((p) => (
              <li
                key={p.goldType}
                className="flex min-w-[128px] flex-1 flex-col gap-0.5 rounded-[var(--r-sm)] border border-[var(--border)] bg-[var(--panel2)] px-2.5 py-1.5 sm:flex-none sm:gap-1 sm:px-3 sm:py-2"
              >
                <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[var(--text-mid)]">
                  <span>🪙</span>
                  <span className="truncate">{p.name}</span>
                </span>
                <span className="flex items-baseline gap-1.5 text-[13px] font-bold tabular-nums text-[var(--gold)]">
                  {formatCurrency(p.buyPrice)}
                  <span className="text-[10px] font-normal normal-case text-[var(--text-mid)]">
                    {t('overview.goldBuy')}
                  </span>
                </span>
                <span className="flex items-baseline gap-1.5 text-[11px] font-bold tabular-nums text-[var(--text-mid)]">
                  {formatCurrency(p.sellPrice)}
                  <span className="text-[10px] font-normal normal-case">
                    {t('overview.goldSell')}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {latestFetchedAt && (
            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-[var(--text-mid)] sm:mt-3">
              <span>
                {t('overview.goldUpdatedAt', { time: formatUpdatedAt(latestFetchedAt, locale) })}
              </span>
              {anyStale && (
                <span className="rounded-[var(--r-sm)] border border-[var(--amber)] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] text-[var(--amber)]">
                  {t('overview.goldStale')}
                </span>
              )}
            </p>
          )}
        </>
      )}
    </SectionCard>
  );
}
