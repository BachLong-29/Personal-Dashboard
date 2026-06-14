'use client';

import { cn } from '@/libs/utils';

export interface StatCardProps {
  tone: 'gold' | 'cyan' | 'mint' | 'violet';
  ico: string;
  label: string;
  value: number | string;
  suffix?: string;
  sub?: string;
  trend?: number;
}

const TONE: Record<StatCardProps['tone'], { border: string; bg: string; text: string }> = {
  gold:   { border: 'border-[oklch(0.74_0.17_85_/_0.35)]',  bg: 'bg-[oklch(0.74_0.17_85_/_0.05)]',  text: 'text-[var(--gold)]' },
  cyan:   { border: 'border-[oklch(0.78_0.16_205_/_0.35)]', bg: 'bg-[oklch(0.78_0.16_205_/_0.05)]', text: 'text-[var(--cyan)]' },
  mint:   { border: 'border-[oklch(0.76_0.14_162_/_0.35)]', bg: 'bg-[oklch(0.76_0.14_162_/_0.05)]', text: 'text-[var(--mint)]' },
  violet: { border: 'border-[oklch(0.66_0.22_295_/_0.35)]', bg: 'bg-[oklch(0.66_0.22_295_/_0.05)]', text: 'text-[var(--violet)]' },
};

export function StatCard({ tone, ico, label, value, suffix, sub, trend }: StatCardProps) {
  const t = TONE[tone];
  return (
    <div className={cn('flex-1 min-w-0 flex flex-col gap-0.5 px-3.5 py-3 bg-[var(--panel)] border rounded-[var(--r)]', t.border, t.bg)}>
      <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-mid)] tracking-[0.08em] font-[var(--font-title)] uppercase">
        <span className={t.text}>{ico}</span>
        {label}
      </div>
      <div className={cn('font-[var(--font-title)] text-[22px] font-black leading-none mt-0.5', t.text)}>
        {value}
        {suffix && <small className="text-[13px] text-[var(--text-mid)] font-bold ml-0.5">{suffix}</small>}
      </div>
      {sub && (
        <div className="text-[9px] text-[var(--text-lo)] tracking-[0.04em] mt-0.5">
          {trend !== undefined && (
            <span className={cn('mr-0.5 font-bold', trend > 0 ? 'text-[var(--mint)]' : 'text-[var(--rose)]')}>
              {trend > 0 ? '▲' : '▼'}
            </span>
          )}
          {sub}
        </div>
      )}
    </div>
  );
}
