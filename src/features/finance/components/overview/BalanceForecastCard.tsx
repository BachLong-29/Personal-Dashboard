'use client';

import { useLocale, useTranslations } from 'next-intl';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { BalanceForecast } from '@/types';

import { formatCurrency } from '../../utils';
import { SectionCard } from './SectionCard';

interface BalanceForecastCardProps {
  forecast: BalanceForecast | null;
  isLoading: boolean;
}

/** Short axis labels: 87.000.000 → "87tr", 850.000 → "850k". */
function compact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${Math.round(value / 1_000_000)}tr`;
  if (abs >= 1_000) return `${Math.round(value / 1_000)}k`;
  return String(value);
}

export function BalanceForecastCard({ forecast, isLoading }: BalanceForecastCardProps) {
  const t = useTranslations('finance');
  const locale = useLocale();

  const points = forecast?.points ?? [];
  const hasProjection = (forecast?.basedOnMonths ?? 0) > 0;

  const data = points.map((p) => {
    const [year, month] = p.month.split('-');
    const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(locale, {
      month: 'short',
    });
    return { ...p, label };
  });

  return (
    <SectionCard title={t('overview.forecast')} index={2}>
      {isLoading ? (
        <div className="h-[180px] animate-pulse rounded-[var(--r-md)] bg-[var(--panel2)]" />
      ) : data.length === 0 ? (
        <p className="text-[12px] text-[var(--text-mid)]">{t('overview.forecastNoData')}</p>
      ) : (
        <>
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="forecast-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border-lo)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: 'var(--text-mid)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={{ stroke: 'var(--border)' }}
                />
                <YAxis
                  width={44}
                  tickFormatter={compact}
                  tick={{ fill: 'var(--text-mid)', fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ stroke: 'var(--border-hi)' }}
                  contentStyle={{
                    background: 'var(--panel2)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: 'var(--text-mid)' }}
                  formatter={(value) => [formatCurrency(Number(value)), '']}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="var(--gold)"
                  strokeWidth={2}
                  fill="url(#forecast-fill)"
                  dot={{ r: 2, fill: 'var(--gold)' }}
                  activeDot={{ r: 4 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <p className="mt-2 text-[11px] text-[var(--text-mid)]">
            {hasProjection
              ? t('overview.forecastHint', { months: forecast?.basedOnMonths ?? 0 })
              : t('overview.forecastNoData')}
          </p>
        </>
      )}
    </SectionCard>
  );
}
